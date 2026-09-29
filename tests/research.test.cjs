const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, readFileSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
process.env.MONGODB_URI = "";
process.env.PAWMATCH_DATA_DIR = mkdtempSync(path.join(os.tmpdir(), "pawmatch-research-test-"));
const load = require("./load-ts.cjs");
const { scenarios, defaultConfig } = load("lib/research/scenarios.ts");
const { assess, defaultWeights } = load("lib/research/scoring.ts");
const { configSchema, responseSchema } = load("lib/research/validation.ts");
const store = load("lib/research/store.ts");
const { analyse, resultsCsv, responseMetrics, csvCell } = load("lib/research/analysis.ts");
const { applicants, pets } = load("lib/seed.ts");
const { demoUsers } = load("lib/demoUsers.ts");
const { saveReview, initialReview, getReviewRecords } = load("lib/review-store.ts");
const { getApplicants } = load("lib/repository.ts");

test("proposal research invariants and persistence", async t => {
  await t.test("eight distinct scenarios and 32 candidates, independent valid rubrics", () => {
    assert.equal(scenarios.length, 8);
    const ids = scenarios.flatMap(s => s.candidates.map(c => c.id));
    assert.equal(ids.length, 32); assert.equal(new Set(ids).size, 32);
    for (const s of scenarios) {
      for (const r of s.rubric.expectedRisks) assert.ok(s.candidates.some(c => c.id === r.candidateId));
      for (const c of s.candidates) {
        const a = assess(c);
        assert.ok(a.score >= 0 && a.score <= 100);
        assert.equal(a.score, a.breakdown.reduce((sum, row) => sum + row.earned, 0));
      }
    }
  });
  await t.test("high score cannot hide pending verification; demographics do not change the score", () => {
    const c = scenarios.find(s=>s.id==="pending-verification").candidates[0];
    const a = assess(c); assert.equal(a.score, 100);
    assert.ok(a.risks.some(r=>r.id==="verification-housing" && r.severity==="high"));
    const verified = structuredClone(c); verified.verification.housing = "verified";
    assert.equal(assess(verified).score, a.score);
    assert.ok(!assess(verified).risks.some(r=>r.id==="verification-housing"));
    const altered = { ...c, household:"世帯・年齢・職業の表現を変更", preferences:"見た目の好みを変更" };
    assert.deepEqual(assess(altered), a);
    assert.deepEqual(scenarios.find(s=>s.id==="equivalent-care").candidates.map(c=>assess(c).score), [100,100,100,100]);
  });
  await t.test("unknown information and a conflicting plan remain distinct", () => {
    const c = structuredClone(scenarios[0].candidates[0]);
    c.evidence.medical.state = "unknown";
    const unknown = assess(c);
    c.evidence.medical.state = "conflict";
    const conflict = assess(c);
    assert.equal(unknown.score, conflict.score);
    assert.ok(unknown.coverage < conflict.coverage);
    assert.notEqual(unknown.risks[0].label, conflict.risks[0].label);
    assert.equal(conflict.risks[0].severity, "high");
  });
  await t.test("invalid weights, unknown fields, incomplete responses are rejected", () => {
    const {version,...config} = defaultConfig; void version;
    assert.ok(configSchema.safeParse(config).success);
    assert.ok(!configSchema.safeParse({...config,weights:{...defaultWeights,housing:26}}).success);
    assert.ok(!configSchema.safeParse({...config,weights:{...defaultWeights,housing:-1,time:46}}).success);
    assert.ok(!configSchema.safeParse({...config,email:"not-requested"}).success);
    assert.ok(!responseSchema.safeParse({}).success);
  });
  let id, originalWeights;
  await t.test("researcher review gate, frozen settings, explicit consent and counterbalanced order", async () => {
    await assert.rejects(store.createSession({source:"participant",group:"other",order:"AB"}));
    const issued = await store.createSession({source:"simulation",group:"other",order:"AB"});
    id = issued.id;
    await assert.rejects(store.changeSession(id,"start"));
    await store.changeSession(id,"consent");
    const first = await store.changeSession(id,"start");
    assert.equal(first.trial.mode,"baseline");
    assert.equal(first.trial.scenario.id,defaultConfig.scenarioIds[0]);
    const repeated = await store.changeSession(id,"start");
    assert.equal(repeated.trial.startedAt,first.trial.startedAt);
    const text = JSON.stringify(first);
    for (const forbidden of ['"rubric"','"expectedRisks"','"assessments"','"critical"','"nextCheck"','"evidence"']) assert.ok(!text.includes(forbidden),forbidden);
    const {version,...config}=defaultConfig; void version;
    originalWeights=structuredClone(config.weights);
    await store.saveConfig({...config,weights:{...config.weights,housing:20,time:25}});
    const saved=(await store.getResearch()).sessions.find(s=>s.id===id);
    assert.deepEqual(saved.config.weights,originalWeights);
    const issuedPair = await Promise.all([store.createSession({source:"simulation",group:"other",order:"alternate"}),store.createSession({source:"simulation",group:"other",order:"alternate"})]);
    assert.notEqual(issuedPair[0].order,issuedPair[1].order);
  });
  await t.test("every rehomer has suitability decline, trial decline, and adopted cases", async () => {
    const applications=await getApplicants();
    const ownerIds=[...new Set(pets.map(pet=>pet.ownerId))];
    assert.equal(ownerIds.length,5);
    for(const ownerId of ownerIds){
      const petIds=pets.filter(pet=>pet.ownerId===ownerId).map(pet=>pet.id);
      const cases=applications.filter(application=>petIds.includes(application.petId));
      const suitabilityDecline=cases.find(application=>application.stage==="risk_review"&&application.review?.decisionRecorded&&application.review.decision==="decline");
      const trialDecline=cases.find(application=>application.stage==="trial"&&application.review?.decisionRecorded&&application.review.decision==="decline");
      const adopted=cases.find(application=>application.stage==="final_review"&&application.review?.decisionRecorded&&application.review.decision==="approve");
      assert.ok(suitabilityDecline,`${ownerId} should have a suitability decline`);
      assert.ok(suitabilityDecline.stageTimeline.risk_review.completedAt);
      assert.ok(suitabilityDecline.review.note.length>=30);
      assert.ok(trialDecline,`${ownerId} should have a trial decline`);
      assert.equal(trialDecline.review.trial.result,"ng");
      assert.equal(Object.values(trialDecline.review.trial.criteria).filter(value=>value==="ng").length,1);
      assert.ok(trialDecline.review.signoffs.trial.reviewer);
      assert.equal(trialDecline.review.signoffs.trial.rehomer.userId,ownerId);
      assert.ok(trialDecline.stageTimeline.trial.completedAt>`${trialDecline.review.trial.periodTo}T00:00:00.000Z`);
      assert.ok(adopted,`${ownerId} should have an adopted case`);
      assert.deepEqual(Object.values(adopted.review.verification),["verified","verified","verified","verified","verified"]);
      assert.ok(adopted.review.meetingChecks.every(Boolean));
      assert.equal(adopted.review.trial.result,"ok");
      assert.ok(adopted.review.signoffs.final_review.reviewer);
      assert.equal(adopted.review.signoffs.final_review.rehomer.userId,ownerId);
      assert.ok(adopted.stageTimeline.final_review.completedAt);
    }
    assert.equal(applications.filter(application=>application.review?.decision==="decline").length,10);
    assert.equal(applications.filter(application=>application.review?.decision==="approve").length,5);
  });
  await t.test("final-review cases with attention flags include an actionable initial comment", async () => {
    const finalCases=(await getApplicants()).filter(application=>application.stage==="final_review"&&!application.review?.decisionRecorded);
    const flagged=finalCases.filter(application=>application.risks.length||Object.values(application.verification).some(state=>state!=="verified"));
    assert.ok(flagged.length>0);
    for(const application of flagged){
      assert.match(application.review.note,/要確認事項：/);
      assert.match(application.review.note,/確認後の対応：/);
      for(const risk of application.risks)assert.ok(application.review.note.includes(risk.label));
    }
  });
  await t.test("every active prepared review starts with a stage-specific comment", async () => {
    const active=(await getApplicants()).filter(application=>!application.review?.decisionRecorded);
    assert.ok(active.length>0);
    for(const application of active)assert.ok(application.review.note.trim().length>=20,`${application.id} should have an initial review comment`);
    assert.match(active.find(application=>application.stage==="risk_review").review.note,/適合性確認/);
    assert.match(active.find(application=>application.stage==="verification").review.note,/書類確認|提出済み書類/);
    assert.match(active.find(application=>application.stage==="meeting").review.note,/面談で確認する事項/);
    assert.match(active.find(application=>application.stage==="trial").review.note,/トライアルで確認する事項/);
    assert.match(active.find(application=>application.stage==="final_review").review.note,/最終判断|要確認事項/);
  });
  await t.test("admin weights reach ordinary reviews while issued sessions retain their version", async () => {
    const beforeConfig=(await store.getResearch()).config;
    const before=await getApplicants();
    const nextWeights={...beforeConfig.weights,housing:10,time:35};
    const affected=before.find(a=>a.researchCandidate && assess(a.researchCandidate,beforeConfig.weights).score!==assess(a.researchCandidate,nextWeights).score);
    assert.ok(affected,"fixture must exercise a changed category weight");
    const {version,...editable}=beforeConfig; void version;
    const savedConfig=await store.saveConfig({...editable,weights:nextWeights,researcherNotes:"通常審査への反映を検証するテスト用の変更"});
    const after=(await getApplicants()).find(a=>a.id===affected.id);
    assert.equal(after.score,assess(affected.researchCandidate,nextWeights).score);
    assert.equal(after.assessment.ruleVersion,`care-evidence-1/config-v${savedConfig.version}`);
    assert.deepEqual(after.review,affected.review);
    const issuedBefore=(await store.getResearch()).sessions.find(s=>s.id===id);
    assert.deepEqual(issuedBefore.config.weights,originalWeights);
  });
  function answer(view) {
    const cs=view.trial.scenario.candidates;
    return {trialId:view.trial.id,priorityId:cs[0].id,decisions:Object.fromEntries(cs.map((c,i)=>[c.id,i===0?"proceed":"check"])),identifiedRisks:"応募者Bの備えを確認する",reasoning:"必要なケアと応募者の計画を比較した",nextChecks:"追加の情報を確認する",interrupted:false,ratings:{usefulness:4,clarity:4,confidence:3,reliance:2}};
  }
  await t.test("validated submissions are idempotent and both modes use the exact same cases", async () => {
    let view=await store.getSessionView(id);
    await assert.rejects(store.changeSession(id,"respond",{...answer(view),priorityId:"unknown"}));
    await assert.rejects(store.changeSession(id,"respond",{...answer(view),decisions:{}}));
    const body=answer(view);
    view=await store.changeSession(id,"respond",body);
    assert.equal(view.completed,1);
    view=await store.changeSession(id,"respond",body);
    assert.equal(view.completed,1);
    view=await store.changeSession(id,"start");
    await store.changeSession(id,"respond",answer(view));
    view=await store.changeSession(id,"start");
    assert.equal(view.trial.mode,"risk");
    assert.equal(view.trial.scenario.id,defaultConfig.scenarioIds[0]);
    assert.ok(view.trial.assessments);
    assert.ok(!JSON.stringify(view).includes('"expectedRisks"'));
    await store.changeSession(id,"respond",answer(view));
    const persisted=JSON.parse(readFileSync(path.join(process.env.PAWMATCH_DATA_DIR,"research-v1.json"),"utf8"));
    assert.equal(persisted.sessions.find(s=>s.id===id).responses.length,3);
    assert.ok(persisted.sessions.find(s=>s.id===id).responses.every(r=>r.elapsedMs>=0));
  });
  await t.test("manual coding validates rubric IDs and uncoded outcomes stay missing", async () => {
    const session=(await store.getResearch()).sessions.find(s=>s.id===id);
    const response=session.responses[0],scenario=session.scenarios[0];
    assert.equal(responseMetrics(response,scenario,session).recall,null);
    await assert.rejects(store.saveCoding({sessionId:id,trialId:response.trialId,detectedRiskIds:["invented"],explanationScore:2,notes:""}));
    await store.saveCoding({sessionId:id,trialId:response.trialId,detectedRiskIds:[scenario.rubric.expectedRisks[0].id],explanationScore:2,notes:"根拠を確認"} );
    const refreshed=(await store.getResearch()).sessions.find(s=>s.id===id);
    assert.equal(responseMetrics(refreshed.responses[0],scenario,refreshed).relevant,1);
  });
  await t.test("simulation cannot contaminate participant results; partial and interrupted cases are handled", async () => {
    const sessions=(await store.getResearch()).sessions;
    assert.equal(analyse(sessions,"participant").rows.length,0);
    assert.ok(!resultsCsv(sessions,"participant").includes("SIM-"));
    const sample=structuredClone(sessions.find(s=>s.responses.length===4));
    sample.responses[0].interrupted=true;
    const result=analyse([sample],"simulation");
    assert.equal(result.pairs.length,2);
    assert.equal(result.pairs[0].timeDifference,null);
    assert.ok(Number.isFinite(result.pairs[0].usefulnessDifference));
    assert.ok(Number.isFinite(result.pairs[0].clarityDifference));
    assert.ok(Number.isFinite(result.pairs[0].confidenceDifference));
    assert.ok(Number.isFinite(result.pairs[0].relianceDifference));
    assert.ok(result.modes.every(mode=>mode.confidence!==null&&mode.selfReportedReliance!==null));
    sample.responses.pop();
    assert.equal(analyse([sample],"simulation").pairs.length,1);
    assert.ok(csvCell("=HYPERLINK(x)").startsWith('"\''));
    assert.equal(csvCell('a,"b"\nline'),'"a,""b""\nline"');
  });
  await t.test("withdrawal removes saved answers and makes a session non-resumable", async () => {
    const view=await store.changeSession(id,"withdraw");
    assert.equal(view.withdrawn,true);assert.equal(view.completed,0);
    await assert.rejects(store.changeSession(id,"start"));
    assert.ok(!analyse((await store.getResearch()).sessions,"simulation").included.some(s=>s.id===id));
  });
  await t.test("review records persist, stale writes and skipping stages fail; approval is human-gated", async () => {
    const reviewer=demoUsers.find(user=>user.id==="reviewer");
    const ownerFor=application=>demoUsers.find(user=>user.id===pets.find(pet=>pet.id===application.petId).ownerId);
    const app=applicants[0],initial=initialReview(app);
    const intake=applicants.find(candidate=>candidate.stage==="screening");
    assert.equal(initialReview(intake).stage,"risk_review");
    const {history,...body}=initial; void history;
    await assert.rejects(saveReview(app,{...body,note:"譲渡者が先に進める"},ownerFor(app)));
    const saved=await saveReview(app,{...body,note:"初回確認の根拠を記録"},reviewer);
    assert.equal(saved.revision,1);assert.equal(saved.stage,initial.stage);assert.equal(saved.history.length,1);
    assert.equal((await getReviewRecords())[app.id].note,"初回確認の根拠を記録");
    await assert.rejects(saveReview(app,{...body,note:"古い画面からの更新"},reviewer));
    await assert.rejects(saveReview(app,{...body,revision:1,stage:"final_review",note:"工程飛ばし"},reviewer));
    const declined=await saveReview(app,{...body,revision:1,note:"必要なケアへの対応が難しいことを確認した",decision:"decline",decisionRecorded:true},reviewer);
    assert.equal(declined.stage,initial.stage);assert.equal(declined.decision,"decline");assert.equal(declined.decisionRecorded,true);
    await assert.rejects(saveReview(app,{...body,revision:2,note:"判断後の変更"},reviewer));
    const meetingApp=applicants.find(a=>a.stage==="meeting");
    const {history:meetingHistory,...meetingBody}=initialReview(meetingApp);void meetingHistory;
    const meetingInput={...meetingBody,note:"面談と住環境を確認",meetingChecks:[true,true,true],action:"confirm"};
    const meetingFirst=await saveReview(meetingApp,meetingInput,reviewer);
    assert.equal(meetingFirst.stage,"meeting");assert.equal(meetingFirst.signoffs.meeting.reviewer.name,reviewer.name);assert.equal(meetingFirst.signoffs.meeting.reviewer.note,"面談と住環境を確認");
    await assert.rejects(saveReview(meetingApp,{...meetingInput,revision:1,note:"譲渡者の確認",meetingChecks:[false,true,true]},ownerFor(meetingApp)));
    const meetingSecond=await saveReview(meetingApp,{...meetingInput,revision:1,note:"譲渡者として面談内容を確認"},ownerFor(meetingApp));
    assert.equal(meetingSecond.stage,"trial");assert.equal(meetingSecond.signoffs.meeting.rehomer.name,ownerFor(meetingApp).name);assert.equal(meetingSecond.signoffs.meeting.rehomer.note,"譲渡者として面談内容を確認");
    const finalApp=applicants.find(a=>a.stage==="final_review");
    const {history:ignored,...final}=initialReview(finalApp);void ignored;
    await assert.rejects(saveReview(finalApp,{...final,note:"不足あり",decision:"approve",action:"confirm",riskAcknowledged:true},reviewer));
    await assert.rejects(saveReview(finalApp,{...final,note:"判断待ち",action:"confirm"},ownerFor(finalApp)));
    const rehomerDraft=await saveReview(finalApp,{...final,note:"譲渡者の確認事項を下書き",action:"save"},ownerFor(finalApp));
    assert.equal(rehomerDraft.note,"譲渡者の確認事項を下書き");
    const proposed=await saveReview(finalApp,{...final,revision:1,note:"住居の確認を待つ",decision:"hold",action:"confirm"},reviewer);
    assert.equal(proposed.decisionRecorded,false);
    const held=await saveReview(finalApp,{...final,revision:2,note:"譲渡者も保留理由を確認",decision:"hold",action:"confirm"},ownerFor(finalApp));
    assert.equal(held.decision,"hold");assert.equal(held.decisionRecorded,true);assert.equal(held.signoffs.final_review.rehomer.note,"譲渡者も保留理由を確認");
    const trialApp=applicants.find(a=>a.stage==="trial");
    const {history:trialHistory,...trialBody}=initialReview(trialApp);void trialHistory;
    await assert.rejects(saveReview(trialApp,{...trialBody,stage:"final_review",note:"結果未記録"},reviewer));
    const trialInput={...trialBody,action:"confirm",note:"トライアルを記録",trial:{periodFrom:"2026-09-01",periodTo:"2026-09-07",transportFrom:"保護施設",transportTo:"希望者宅",transportMethod:"車で対面受け渡し",result:"ok",criteria:{housing:"ok",compatibility:"ok",dailyCare:"ok",contingency:"ok"},memo:"食事とケアを継続できた"}};
    await assert.rejects(saveReview(trialApp,{...trialInput,trial:{...trialInput.trial,criteria:{...trialInput.trial.criteria,compatibility:"pending"},result:"pending"}},reviewer));
    await assert.rejects(saveReview(trialApp,{...trialInput,trial:{...trialInput.trial,criteria:{...trialInput.trial.criteria,compatibility:"ng"}}},reviewer));
    const trialFirst=await saveReview(trialApp,trialInput,reviewer);
    assert.equal(trialFirst.stage,"trial");
    const advanced=await saveReview(trialApp,{...trialInput,revision:1,note:"譲渡者としてトライアル結果を確認"},ownerFor(trialApp));
    assert.equal(advanced.stage,"final_review");
    assert.equal(advanced.trial.result,"ok");
    assert.equal(advanced.signoffs.trial.rehomer.note,"譲渡者としてトライアル結果を確認");
    assert.equal((await getReviewRecords())[trialApp.id].trial.transportTo,"希望者宅");
  });
});
