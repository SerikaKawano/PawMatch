const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-ts.cjs");
const { applicants } = load("lib/seed.ts");
const { sampleConsultations } = load("lib/consultations.ts");
const { linkedApplication, journeySteps, journeySummary } = load("lib/consultation-journey.ts");
const { groupConsultations } = load("lib/consultation-groups.ts");

test("sample enquiries only link to a later application for the same adopter and pet", () => {
  assert.equal(sampleConsultations.length, 19);
  assert.equal(sampleConsultations.filter(record => linkedApplication(record, applicants)).length, 12);
  for (const record of sampleConsultations) {
    const application = linkedApplication(record, applicants);
    if (record.status === "closed" || record.status === "received") {
      assert.equal(application, null);
      assert.ok(journeySummary(record, application).includes("審査"));
    } else if (application) {
      assert.ok(application, record.userId);
      assert.equal(application.userId, record.userId);
      assert.equal(application.petId, record.petId);
      assert.ok(application.submittedAt >= record.createdAt.slice(0, 10));
      assert.ok(application.submittedAt >= record.reviewedAt.slice(0, 10));
    } else {
      assert.equal(record.status, "profile_requested");
      assert.match(journeySummary(record, application), /提出待ち/);
    }
  }
  const noah = sampleConsultations[0];
  assert.equal(linkedApplication({ ...noah, createdAt: "2026-09-27T10:00:00.000Z" }, applicants), null);
});

test("timeline distinguishes waiting, ended, review stage and recorded decisions", () => {
  const waiting = journeySteps(sampleConsultations[11], null);
  assert.deepEqual(waiting.map(step => step.state), ["done", "active", "pending"]);
  const ended = journeySteps(sampleConsultations[7], null);
  assert.equal(ended.at(-1).state, "stopped");
  const review = sampleConsultations[5];
  const application = linkedApplication(review, applicants);
  const reviewSteps = journeySteps(review, application);
  assert.equal(reviewSteps.find(step => step.label === "トライアル").state, "active");
  assert.ok(reviewSteps.filter(step => step.state === "done").every(step => step.at), "completed phases must have timestamps");
  const recordedTimes = reviewSteps.filter(step => step.at).map(step => Date.parse(step.at));
  assert.deepEqual(recordedTimes, [...recordedTimes].sort((a, b) => a - b), "timeline timestamps must remain chronological");
  for (const applicant of applicants) {
    const stages = ["screening", "risk_review", "verification", "meeting", "trial", "final_review"];
    const activeStage = applicant.stage === "screening" ? "risk_review" : applicant.stage;
    const current = stages.indexOf(activeStage);
    const timeline = applicant.stageTimeline;
    assert.ok(timeline, applicant.id);
    for (const [index, stage] of stages.entries()) {
      if (index < current) {
        assert.ok(timeline[stage]?.startedAt, `${applicant.id}: ${stage} start`);
        assert.ok(timeline[stage]?.completedAt, `${applicant.id}: ${stage} completion`);
        assert.ok(timeline[stage].startedAt < timeline[stage].completedAt, `${applicant.id}: ${stage} order`);
      } else if (index === current) {
        assert.ok(timeline[stage]?.startedAt, `${applicant.id}: ${stage} active start`);
      } else {
        assert.equal(timeline[stage], undefined, `${applicant.id}: ${stage} must not be started`);
      }
    }
  }
  const decided = { ...application, stage: "final_review", review: { ...application.review, decisionRecorded: true, decision: "decline", history: [] } };
  assert.equal(journeySteps(review, decided).at(-1).state, "stopped");
  assert.match(journeySummary(review, decided), /見送り/);
});

test("sample consultation threads include direct rehomer replies for pet-specific questions", () => {
  const rehomerIds = new Set(["rehomer", "rehomer-hana", "rehomer-riku", "rehomer-haru", "rehomer-nagi", ...[1,2,3,4,5].map(number => `tester-${number}-rehomer`)]);
  const directReplies = sampleConsultations.flatMap(record => record.messages ?? []).filter(message => rehomerIds.has(message.authorId));
  assert.ok(directReplies.length >= 8);
  assert.ok(sampleConsultations.filter(record => record.status === "received").every(record => record.messages.some(message => rehomerIds.has(message.authorId))));
});

test("consultations from the same person about the same pet form one thread", () => {
  const original = sampleConsultations[0];
  const duplicate = {
    ...original,
    id: "duplicate-same-person-pet",
    requestId: "00000000-0000-4000-8000-999999999999",
    status: "received",
    createdAt: "2026-09-28T09:00:00.000Z",
    reviewedAt: undefined,
    reviewedBy: undefined,
    replyMessage: undefined,
    message: "追加で投薬時の食事について確認したいです。",
    messages: [],
  };
  const groups = groupConsultations([...sampleConsultations, duplicate], applicants);
  assert.equal(groups.length, sampleConsultations.length);
  const group = groups.find(item => item.userId === original.userId && item.petId === original.petId);
  assert.equal(group.records.length, 2);
  assert.equal(group.representative.id, original.id, "the record linked to the application remains the reply target");
  assert.ok(group.application);
  assert.equal(group.latestAt, duplicate.createdAt);
});

test("tester preview data includes an enquiry that ended without an application", () => {
  const enquiryOnly = sampleConsultations.find(record => record.userId === "tester-2-adopter" && record.petId === "tester-pet-1");
  assert.ok(enquiryOnly);
  assert.equal(enquiryOnly.status, "closed");
  assert.equal(linkedApplication(enquiryOnly, applicants), null);
  assert.match(enquiryOnly.messages.at(-1).body, /no review case was created/);
});
