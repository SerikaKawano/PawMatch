const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");

process.env.MONGODB_URI = "";
process.env.PAWMATCH_DATA_DIR = mkdtempSync(path.join(os.tmpdir(), "pawmatch-full-journey-"));

const load = require("./load-ts.cjs");
const { demoUsers } = load("lib/demoUsers.ts");
const { pets } = load("lib/seed.ts");
const { canAccess } = load("lib/permissions.ts");
const { getApplicants, getPets } = load("lib/repository.ts");
const { initialReview, saveReview } = load("lib/review-store.ts");
const { appendConsultationMessage, consultationThread, sampleConsultations } = load("lib/consultations.ts");
const { linkedApplication, journeySteps, journeySummary } = load("lib/consultation-journey.ts");

const user = id => demoUsers.find(item => item.id === id);
const reviewInput = (record, overrides = {}) => ({
  revision: record.revision,
  stage: record.stage,
  verification: record.verification,
  meetingChecks: record.meetingChecks,
  trialChecks: record.trialChecks,
  trial: record.trial,
  note: "確認内容と判断理由を記録",
  decision: record.decision,
  decisionRecorded: false,
  riskAcknowledged: record.riskAcknowledged,
  ...overrides,
});

test("one pet can move consistently from inquiry to completed adoption across all four roles", async () => {
  const adopter = user("adopter");
  const rehomer = user("rehomer");
  const reviewer = user("reviewer");
  const admin = user("admin");
  assert.deepEqual(
    [adopter, rehomer, reviewer, admin].map(item => item.role),
    ["adopter", "rehomer", "reviewer", "admin"],
  );
  assert.equal(canAccess(adopter, "consult"), true);
  assert.equal(canAccess(rehomer, "review"), true);
  assert.equal(canAccess(reviewer, "review"), true);
  assert.equal(canAccess(admin, "admin"), true);

  const consultation = sampleConsultations[0];
  const publicListings = await getPets();
  const pet = publicListings.find(item => item.id === consultation.petId);
  assert.equal(pet.name, "Bella");
  assert.equal(pet.ownerId, rehomer.id);
  assert.equal(pet.listingNumber, "Q8N4V2K7");
  assert.ok(publicListings.filter(item => item.ownerId === rehomer.id).length > 1, "the organisation account should own its published listings");
  assert.equal(pets.find(item => item.id === pet.id).listingNumber, pet.listingNumber, "the public listing and review fixture must identify the same pet");

  // The applicant starts the inquiry; the pet's rehomer and PawMatch operations
  // can answer in the same thread. The administrator can audit and clarify it.
  const audited = await appendConsultationMessage(consultation.id, admin.id, {
    message: "運営記録を確認しました。以後の判断は各工程の記録に残します。",
  });
  assert.ok(audited);
  const authors = new Set(consultationThread(audited).map(message => message.authorId));
  for (const participant of [adopter.id, rehomer.id, reviewer.id, admin.id]) {
    assert.ok(authors.has(participant), `${participant} must be represented in the journey`);
  }

  let applications = await getApplicants();
  let application = linkedApplication(audited, applications);
  assert.equal(application.id, "app-aiko");
  assert.equal(application.userId, adopter.id);
  assert.equal(application.petId, pet.id);

  let review = initialReview(application);
  assert.equal(review.stage, "risk_review");
  await assert.rejects(
    saveReview(application, reviewInput(review, { note: "応募者は審査を操作できない" }), adopter),
    /このロールでは審査を更新できません/,
  );
  await assert.rejects(
    saveReview(application, reviewInput(review, { note: "譲渡者の操作はまだ不要" }), rehomer),
    /譲渡者の操作は必要ありません/,
  );

  review = await saveReview(application, reviewInput(review, {
    stage: "verification",
    action: "advance",
    note: "必要なケアと希望者の計画を照合し、重大な不一致がないことを確認",
  }), reviewer);
  assert.equal(review.stage, "verification");

  const verified = {
    identity: "verified",
    housing: "verified",
    cohabitantConsent: "verified",
    lifelongCare: "verified",
    followUp: "verified",
  };
  review = await saveReview(application, reviewInput(review, {
    stage: "meeting",
    verification: verified,
    action: "advance",
    note: "本人確認、住居、同居者同意、終生飼養、譲渡後連絡の資料を確認",
  }), reviewer);
  assert.equal(review.stage, "meeting");

  review = await saveReview(application, reviewInput(review, {
    meetingChecks: [true, true, true],
    action: "confirm",
    note: "審査担当者が面談内容、住環境、ケア計画を確認",
  }), reviewer);
  assert.equal(review.stage, "meeting");
  assert.equal(review.signoffs.meeting.reviewer.name, reviewer.name);

  review = await saveReview(application, reviewInput(review, {
    meetingChecks: [true, true, true],
    action: "confirm",
    note: "譲渡者がBellaの性格と日常ケアに関する面談内容を確認",
  }), rehomer);
  assert.equal(review.stage, "trial");
  assert.equal(review.signoffs.meeting.rehomer.name, rehomer.name);

  const completedTrial = {
    periodFrom: "2026-09-20",
    periodTo: "2026-09-27",
    transportFrom: "North Star Rescue",
    transportTo: "Noah Williams宅",
    transportMethod: "譲渡者の車による対面受け渡し",
    result: "ok",
    criteria: { housing: "ok", compatibility: "ok", dailyCare: "ok", contingency: "ok" },
    memo: "投薬、食事、室内環境、緊急時の連絡方法を双方で確認した。",
  };
  review = await saveReview(application, reviewInput(review, {
    trial: completedTrial,
    action: "confirm",
    note: "審査担当者がトライアル記録と四つの確認項目を確認",
  }), reviewer);
  assert.equal(review.stage, "trial");

  review = await saveReview(application, reviewInput(review, {
    trial: completedTrial,
    action: "confirm",
    note: "譲渡者がBellaの体調と家庭での生活状況を確認",
  }), rehomer);
  assert.equal(review.stage, "final_review");
  assert.equal(review.signoffs.trial.rehomer.name, rehomer.name);

  // An administrator has the same operational review authority as a PawMatch
  // reviewer and performs the service-side final sign-off in this scenario.
  review = await saveReview(application, reviewInput(review, {
    decision: "approve",
    riskAcknowledged: true,
    action: "confirm",
    note: "全工程の根拠と残る注意事項を監査し、譲渡へ進める判断を確認",
  }), admin);
  assert.equal(review.decisionRecorded, false);
  assert.equal(review.signoffs.final_review.reviewer.name, admin.name);

  review = await saveReview(application, reviewInput(review, {
    decision: "approve",
    riskAcknowledged: true,
    action: "confirm",
    note: "譲渡者が最終条件と譲渡後の連絡方法に合意",
  }), rehomer);
  assert.equal(review.stage, "final_review");
  assert.equal(review.decision, "approve");
  assert.equal(review.decisionRecorded, true);
  assert.equal(review.signoffs.final_review.rehomer.name, rehomer.name);

  applications = await getApplicants();
  application = linkedApplication(audited, applications);
  assert.equal(application.review.decisionRecorded, true);
  assert.equal(application.review.decision, "approve");
  assert.match(journeySummary(audited, application), /譲渡へ進める判断/);

  const steps = journeySteps(audited, application);
  assert.deepEqual(steps.map(step => step.state), Array(steps.length).fill("done"));
  assert.ok(steps.every(step => step.at), "every completed phase must have a date");
  const timestamps = steps.map(step => Date.parse(step.at));
  assert.ok(timestamps.every(Number.isFinite));
  assert.ok(timestamps.every((value, index) => index === 0 || value >= timestamps[index - 1]), "phase dates must be chronological");
  assert.deepEqual(
    application.review.history.map(entry => entry.stage),
    ["verification", "meeting", "meeting", "trial", "trial", "final_review", "final_review", "final_review"],
  );
});
