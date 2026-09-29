const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync } = require("node:fs");
const path = require("node:path");
const os = require("node:os");

process.env.MONGODB_URI = "";
process.env.PAWMATCH_DATA_DIR = mkdtempSync(path.join(os.tmpdir(), "pawmatch-listings-test-"));
const load = require("./load-ts.cjs");
const { applyPetListingOverrides, createPetListing, getPetListings, petListingInput, stopPetListing, updatePetListing } = load("lib/pet-listings.ts");

const input = {
  name: "Bramble", species: "Dog", breed: "English Cocker Spaniel", sex: "Female", birthDate: "2021-04-12", birthDateApproximate: false,
  location: "Bristol", temperament: "人が好き、落ち着いている", pedigree: "血統書なし。犬種は譲渡者申告です。", imageDataUrl: "data:image/png;base64,aGVsbG8=",
  housing: "室内飼育が可能な住居で、玄関に脱走防止ゲートを設置してください。", time: "朝夕30分の散歩と朝夕の給餌が必要です。",
  care: "新しい環境にはゆっくり慣らし、短時間の留守番から始めてください。", medical: "年1回の健診とワクチン費用を計画してください。",
  integration: "同居者の同意を確認し、先住犬とは屋外から段階的に対面します。", continuity: "終生飼養と、緊急時に世話をする家族の協力が必要です。",
  medicalHistory: "既知の慢性疾患はありません。", medication: "なし", vaccinations: "2025年4月 混合ワクチン\n2025年5月 狂犬病ワクチン",
  recordEvidence: "マイクロチップ登録証を確認\nワクチン証明書を確認", spayNeuter: "避妊済み", microchip: "装着済み", evidenceStatus: "確認済",
  story: "飼い主の生活環境が変わり、十分な運動時間を確保することが難しくなったため募集します。",
  conditionsMessage: "毎日の散歩と家族との時間を大切にし、譲渡後の連絡に協力いただける方を希望します。", trial: "7日間を予定します。", fees: "医療費の実費を事前に明示します。",
};

test("a rehomer can persist a complete listing that renders through the normal pet model", async () => {
  assert.ok(petListingInput.safeParse(input).success);
  const created = await createPetListing("rehomer-hana", input, ["Q8N4V2K7"]);
  assert.match(created.listingNumber, /^[A-HJ-NP-Z2-9]{8}$/);
  assert.equal(created.imageUrl, input.imageDataUrl);
  assert.equal(created.ownerId, "rehomer-hana");
  assert.equal(created.birthDate, "2021年4月12日");
  assert.equal(created.rehoming.livingPoints.integration, input.integration);
  assert.deepEqual(created.health.vaccinationHistory, ["2025年4月 混合ワクチン", "2025年5月 狂犬病ワクチン"]);
  assert.equal((await getPetListings()).at(-1).id, created.id);
});

test("a rehomer can edit or stop a listing only through persisted listing overrides", async () => {
  const created = await createPetListing("rehomer-hana", { ...input, name: "Bramble Two" });
  const updated = await updatePetListing(created, "rehomer-hana", { ...input, name: "Bramble Updated" });
  assert.equal(updated.name, "Bramble Updated");
  assert.equal((await applyPetListingOverrides([created]))[0].name, "Bramble Updated");
  await stopPetListing(updated, "rehomer-hana");
  assert.equal((await applyPetListingOverrides([updated]))[0].listingStatus, "stopped");
  await assert.rejects(() => updatePetListing(created, "rehomer-nagi", input), /掲載した譲渡者/);
});
