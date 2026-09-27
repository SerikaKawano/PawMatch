const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-ts.cjs");
const { applicants } = load("lib/seed.ts");
const { sampleConsultations } = load("lib/consultations.ts");
const { linkedApplication, journeySteps, journeySummary } = load("lib/consultation-journey.ts");

test("sample enquiries only link to a later application for the same adopter and pet", () => {
  assert.equal(sampleConsultations.length, 10);
  assert.equal(sampleConsultations.filter(record => linkedApplication(record, applicants)).length, 7);
  for (const record of sampleConsultations) {
    const application = linkedApplication(record, applicants);
    if (record.status === "closed" || record.status === "received") {
      assert.equal(application, null);
      assert.ok(journeySummary(record, application).includes("審査"));
    } else {
      assert.ok(application, record.userId);
      assert.equal(application.userId, record.userId);
      assert.equal(application.petId, record.petId);
      assert.ok(application.submittedAt >= record.createdAt.slice(0, 10));
      assert.ok(application.submittedAt >= record.reviewedAt.slice(0, 10));
    }
  }
  const noah = sampleConsultations[0];
  assert.equal(linkedApplication({ ...noah, createdAt: "2026-09-27T10:00:00.000Z" }, applicants), null);
});

test("timeline distinguishes waiting, ended, review stage and recorded decisions", () => {
  const waiting = journeySteps(sampleConsultations[6], null);
  assert.deepEqual(waiting.map(step => step.state), ["done", "active", "pending"]);
  const ended = journeySteps(sampleConsultations[7], null);
  assert.equal(ended.at(-1).state, "stopped");
  const review = sampleConsultations[5];
  const application = linkedApplication(review, applicants);
  assert.equal(journeySteps(review, application).find(step => step.label === "トライアル").state, "active");
  const decided = { ...application, stage: "final_review", review: { ...application.review, decisionRecorded: true, decision: "decline", history: [] } };
  assert.equal(journeySteps(review, decided).at(-1).state, "stopped");
  assert.match(journeySummary(review, decided), /見送り/);
});
