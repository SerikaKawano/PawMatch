const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-ts.cjs");

const { demoUsers } = load("lib/demoUsers.ts");
const { pets, applicants } = load("lib/seed.ts");
const { sampleConsultations } = load("lib/consultations.ts");

test("five tester personas have separate adopter, rehomer and reviewer preview accounts", () => {
  const testerUsers = demoUsers.filter(user => user.id.startsWith("tester-"));
  assert.equal(testerUsers.length, 15);
  for (const number of [1, 2, 3, 4, 5]) {
    for (const role of ["adopter", "rehomer", "reviewer"]) {
      const user = testerUsers.find(candidate => candidate.id === `tester-${number}-${role}`);
      assert.ok(user, `Tester-${number}-${role}`);
      assert.equal(user.name, `Tester-${number}-${role[0].toUpperCase()}${role.slice(1)}`);
      assert.match(`${user.organization} ${user.description}`, /模擬|実参加者データではありません/);
    }
  }
});

test("each tester has a linked pet, conversation and review case within a 30-minute preview", () => {
  for (const number of [1, 2, 3, 4, 5]) {
    const pet = pets.find(candidate => candidate.id === `tester-pet-${number}`);
    const conversation = sampleConsultations.find(record => record.userId === `tester-${number}-adopter` && record.petId === pet?.id);
    const application = applicants.find(candidate => candidate.id === `tester-application-${number}`);
    assert.ok(pet);
    assert.ok(conversation);
    assert.ok(application);
    assert.equal(pet.ownerId, `tester-${number}-rehomer`);
    assert.ok(pet.species === "Dog" ? !/猫/.test(pet.rehoming.pedigree) : !/犬種/.test(pet.rehoming.pedigree));
    assert.equal(application.userId, `tester-${number}-adopter`);
    assert.ok(conversation.messages.some(message => message.authorId === `tester-${number}-rehomer`));
    assert.ok(application.review.history.some(entry => entry.actorName === `Tester-${number}-Reviewer`));
    const times = [
      ...Object.values(application.stageTimeline).flatMap(entry => [entry.startedAt, entry.completedAt].filter(Boolean)),
      ...application.review.history.map(entry => entry.at),
    ].map(Date.parse);
    assert.ok(Math.max(...times) - Math.min(...times) <= 30 * 60_000, `Tester-${number} exceeds 30 minutes`);
  }
  assert.ok(applicants.some(application => application.id.startsWith("tester-application-") && application.review?.decision === "decline" && application.review.decisionRecorded));
  assert.ok(applicants.some(application => application.id.startsWith("tester-application-") && application.review?.decision === "approve" && application.review.decisionRecorded));
  const operationalMetaCopy = /(ボタン|画面|表示|操作|フォーム|模擬|テスト|\btest\b)/i;
  const testerApplications = applicants.filter(application => application.id.startsWith("tester-application-"));
  for (const application of testerApplications) {
    const visibleInputs = [
      application.household, application.housing, application.experience, application.availability,
      application.review?.note, application.review?.trial?.memo,
      ...(application.risks ?? []).flatMap(risk => [risk.label, risk.detail]),
      ...(application.review?.history ?? []).flatMap(entry => [entry.action, entry.note]),
    ].filter(Boolean);
    assert.ok(visibleInputs.every(value => !operationalMetaCopy.test(value)), `${application.id} contains UI-testing narration`);
  }
  const testerMessages = sampleConsultations
    .filter(record => record.userId.startsWith("tester-"))
    .flatMap(record => [record.message, ...record.messages.map(message => message.body)]);
  assert.ok(testerMessages.every(value => !operationalMetaCopy.test(value)), "tester consultations must read like real enquiries");
});
