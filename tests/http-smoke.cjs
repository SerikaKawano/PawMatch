// Run against a server with PAWMATCH_DATA_DIR set to a disposable QA directory.
const assert = require("node:assert/strict");
const base = process.env.PAWMATCH_TEST_URL;
if (!base || !/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) throw new Error("Set PAWMATCH_TEST_URL to an isolated local QA server.");
let cookie;
async function request(route, method="GET", body) {
  const response = await fetch(base+route,{method,headers:{"Content-Type":"application/json", ...(!/^\/api\/research\/sessions\/[^/]+$/.test(route) && cookie ? {Cookie:cookie} : {})},...(body?{body:JSON.stringify(body)}:{})});
  const data = await response.json();
  return { response, data };
}
(async()=>{
  const login = await request("/api/demo-session", "POST", { userId: "admin" });
  assert.equal(login.response.status, 200);
  cookie = login.response.headers.get("set-cookie").split(";")[0];
  for(const route of ["/pets","/reviews","/reviews/progress","/reviews/app-aiko","/dashboard?user=admin","/admin/analytics","/research","/research/setup","/research/results","/research/results?source=simulation"]){
    const response=await fetch(base+route, { headers: { Cookie: cookie }, redirect: "manual" });
    assert.equal(response.status,200,route);
    assert.ok((await response.text()).includes("PawMatch"),route);
  }
  const schema=await request("/api/openapi");
  assert.equal(schema.data.openapi,"3.1.0");
  assert.ok(schema.data.paths["/research/sessions/{id}"]);
  const dataset=await request("/api/research/export?format=dataset");
  assert.equal(dataset.data.scenarios.length,8);
  const created=await request("/api/research/sessions","POST",{group:"other",source:"simulation",order:"BA"});
  assert.equal(created.response.status,201);
  const url="/api/research/sessions/"+created.data.id;
  assert.equal((await request(url,"POST",{action:"start"})).response.status,400);
  await request(url,"POST",{action:"consent"});
  let view=(await request(url,"POST",{action:"start"})).data;
  assert.equal(view.trial.mode,"risk");
  assert.ok(view.trial.assessments);
  assert.ok(!JSON.stringify(view).includes("expectedRisks"));
  assert.equal((await request(url,"POST",{action:"respond",response:{}})).response.status,400);
  for(let i=0;i<4;i++){
    assert.ok(view.trial);
    const candidates=view.trial.scenario.candidates;
    const body={trialId:view.trial.id,priorityId:candidates[0].id,decisions:Object.fromEntries(candidates.map((c,n)=>[c.id,n===0?"proceed":"check"])),identifiedRisks:"【HTTP動作確認】追加の情報を確認する",reasoning:"架空ケースの必要なケアと生活計画を比較",nextChecks:"住居の確認状況と継続ケアを確認",ratings:{usefulness:3,clarity:3,confidence:3,reliance:3},interrupted:true};
    const sent=await request(url,"POST",{action:"respond",response:body});
    assert.equal(sent.response.status,200);
    assert.equal(sent.data.completed,i+1);
    const retry=await request(url,"POST",{action:"respond",response:body});
    assert.equal(retry.data.completed,i+1);
    if(i<3)view=(await request(url,"POST",{action:"start"})).data;
    if(i===1) {assert.equal(view.trial.mode,"baseline");assert.ok(!view.trial.assessments);}
  }
  const stored=(await request(url)).data;
  assert.equal(stored.completed,4);assert.ok(!stored.trial);
  const liveCsv=await(await fetch(base+"/api/research/export",{headers:{Cookie:cookie}})).text();
  assert.ok(!liveCsv.includes(created.data.participantCode));
  const simCsv=await(await fetch(base+"/api/research/export?source=simulation",{headers:{Cookie:cookie}})).text();
  assert.ok(simCsv.includes(created.data.participantCode));
  const withdrawn=await request(url,"POST",{action:"withdraw"});
  assert.equal(withdrawn.data.withdrawn,true);assert.equal(withdrawn.data.completed,0);
  const apps=await request("/api/applications");
  const application=apps.data.data.find(a=>a.id==="app-aiko");
  assert.ok(application.review);
  const {history,...review}=application.review;
  void history;
  const saved=await request("/api/applications/app-aiko","PATCH",{...review,note:"【隔離QA環境】HTTP経由の保存を確認"});
  assert.equal(saved.response.status,200);
  const fresh=(await request("/api/applications")).data.data.find(a=>a.id==="app-aiko");
  assert.equal(fresh.review.revision,review.revision+1);
  assert.equal(fresh.stage,application.stage);
  assert.equal((await request("/api/applications/app-aiko","PATCH",{...review,note:"古い更新"})).response.status,400);
  const afterWithdrawal=await(await fetch(base+"/api/research/export?source=simulation",{headers:{Cookie:cookie}})).text();
  assert.ok(!afterWithdrawal.includes(created.data.participantCode));
  console.log("HTTP smoke passed: 11 pages, OpenAPI, dataset, 4 paired tasks, validation, idempotency, exports, withdrawal, review persistence.");
})().catch(error=>{console.error(error);process.exitCode=1;});
