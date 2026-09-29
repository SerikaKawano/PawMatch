const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-ts.cjs");
const { translateText } = load("lib/i18n.ts");
const { petEditorial } = load("lib/pet-editorial.ts");
const { scenarios } = load("lib/research/scenarios.ts");
const { uiCopy } = load("lib/ui-copy.ts");
const { reviewStageDescriptions } = load("lib/review-labels.ts");
const { initialAdopterProfile } = load("lib/adopter-profile.ts");
const { demoUsers } = load("lib/demoUsers.ts");
const { sampleConsultations } = load("lib/consultations.ts");
const { applicants } = load("lib/seed.ts");
const { linkedApplication, journeySummary } = load("lib/consultation-journey.ts");

test("shared Japanese actions have consistent English labels", () => {
  assert.equal(translateText(uiCopy.findPets), "Find a pet to adopt");
  assert.equal(translateText(uiCopy.seeDetails), "View details");
  assert.equal(translateText(uiCopy.viewFlow), "View the process");
  assert.equal(translateText(uiCopy.contactPet("Bella")), "Enquire about Bella");
  assert.equal(translateText(" 掲載番号 "), " Listing ID ");
  assert.equal(translateText("全国のペットを 8件表示しています"), "Showing 8 pets in All regions");
  assert.equal(translateText("ドメスティック・ショートヘア（キジトラ）のBella"), "Bella, Domestic Shorthair · tabby");
  assert.equal(translateText("2015年4月18日（11歳）"), "18/4/2015 (11 years old)");
  assert.equal(translateText("4名"), "4 applicants");
  assert.equal(translateText("ペット可住宅の確認待ち"), "Pet-friendly housing awaiting verification");
  assert.equal(translateText("住環境：一部不足"), "Housing: Partly addressed");
  assert.equal(translateText("未集計 / 0回答"), "Not calculated / 0 responses");
  assert.equal(translateText("評価の準備へ →"), "Prepare the evaluation →");
  assert.equal(translateText("トライアル を進行中"), "Trial in progress");
  assert.equal(translateText("状況"), "Status");
  assert.equal(translateText("状況：要確認"), "Status: Attention required");
  assert.equal(translateText("相談者：Noah Williams · 最終更新 2026/9/28 · 3件を統合"), "Applicant: Noah Williams · Last updated 2026/9/28 · 3 enquiries combined");
  for (const description of Object.values(reviewStageDescriptions)) {
    assert.doesNotMatch(translateText(description), /[ぁ-んァ-ン一-龯]/);
  }
});

test("every pet has English case narratives, checks and vaccination history", () => {
  for (const profile of Object.values(petEditorial)) {
    for (const value of [profile.story, profile.conditionsMessage, ...Object.values(profile.livingPoints), ...profile.vaccinationHistory, ...profile.recordEvidence]) {
      assert.notEqual(translateText(value), value, value);
      assert.doesNotMatch(translateText(value), /[ぁ-んァ-ン一-龯]/);
    }
  }
});

test("research case facts and applicant evidence remain readable in English", () => {
  for (const scenario of scenarios) {
    for (const value of [scenario.title, scenario.focus, scenario.animalNeeds]) {
      assert.notEqual(translateText(value), value, value);
    }
    for (const candidate of scenario.candidates) {
      for (const value of [candidate.household, candidate.preferences, ...Object.values(candidate.evidence).flatMap(row => [row.detail, row.nextCheck])]) {
        assert.notEqual(translateText(value), value, value);
      }
    }
    for (const value of [scenario.rubric.rationale, ...scenario.rubric.expectedRisks.flatMap(risk => [risk.label, risk.rationale])]) {
      assert.notEqual(translateText(value), value, value);
    }
  }
});

test("prepared adopter profiles and consultation messages have English copy", () => {
  assert.equal(translateText("相談の進捗"), "Enquiry progress");
  assert.equal(translateText("Snowへの相談"), "Enquiry about Snow");
  assert.equal(translateText("申込日：2026-09-07"), "Applied: 2026-09-07");
  assert.equal(translateText("2/5件"), "2/5 documents");
  assert.doesNotMatch(translateText("審査担当者が次の手続きへ進めました。事前情報の提出が済むまで、適合性の審査は始まりません。"), /[ぁ-んァ-ン一-龯]/);
  assert.doesNotMatch(translateText("この相談は終了しました。必要な場合は新しくお問い合わせください。"), /[ぁ-んァ-ン一-龯]/);
  for (const user of demoUsers.filter(item => item.role === "adopter")) {
    const profile = initialAdopterProfile(user);
    for (const [key, value] of Object.entries(profile)) {
      if (["userId", "fullName", "contact", "updatedAt", "identityStatus", "identityVerifiedAt", "identityVerifiedBy"].includes(key)) continue;
      assert.doesNotMatch(translateText(value), /[ぁ-んァ-ン一-龯]/, `${key}: ${value}`);
    }
  }
  for (const consultation of sampleConsultations) assert.doesNotMatch(translateText(consultation.message), /[ぁ-んァ-ン一-龯]/);
  for (const consultation of sampleConsultations) {
    assert.doesNotMatch(translateText(journeySummary(consultation, linkedApplication(consultation, applicants))), /[ぁ-んァ-ン一-龯]/);
    if (consultation.replyMessage) assert.doesNotMatch(translateText(consultation.replyMessage), /[ぁ-んァ-ン一-龯]/);
    for (const message of consultation.messages ?? []) assert.doesNotMatch(translateText(message.body), /[ぁ-んァ-ン一-龯]/, message.body);
  }
  assert.equal(translateText("犬・ラブラドール・レトリーバー"), "Dog · Labrador Retriever");
});
