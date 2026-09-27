const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-ts.cjs");
const { translateText } = load("lib/i18n.ts");
const { petEditorial } = load("lib/pet-editorial.ts");
const { scenarios } = load("lib/research/scenarios.ts");
const { uiCopy } = load("lib/ui-copy.ts");

test("shared Japanese actions have consistent English labels", () => {
  assert.equal(translateText(uiCopy.findPets), "Find a pet to adopt");
  assert.equal(translateText(uiCopy.seeDetails), "View details");
  assert.equal(translateText(uiCopy.viewFlow), "View the process");
  assert.equal(translateText(uiCopy.contactPet("Bella")), "Enquire about Bella");
  assert.equal(translateText(" 掲載番号 "), " Listing ID ");
  assert.equal(translateText("全国のペットを 8件表示しています"), "Showing 8 pets in All regions");
  assert.equal(translateText("日本猫・キジトラのBella"), "Bella, Domestic shorthair · tabby");
  assert.equal(translateText("2015年4月18日（11歳）"), "18/4/2015 (11 years old)");
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
