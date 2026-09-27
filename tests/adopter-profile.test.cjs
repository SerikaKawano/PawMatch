const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
process.env.MONGODB_URI = "";
process.env.PAWMATCH_DATA_DIR = mkdtempSync(path.join(os.tmpdir(), "pawmatch-adopter-profile-test-"));
const load = require("./load-ts.cjs");
const { demoUsers } = load("lib/demoUsers.ts");
const profileStore = load("lib/adopter-profile.ts");
const documentStore = load("lib/adopter-documents.ts");
const noah = demoUsers.find(user => user.id === "adopter");
const olivia = demoUsers.find(user => user.id === "adopter-olivia");

test("adopter profiles remain separate and identity requires a reviewer record", async () => {
  const original = await profileStore.getAdopterProfile(noah);
  assert.equal(original.fullName, "Noah Williams");
  assert.equal(original.identityStatus, "not_requested");
  const updated = await profileStore.saveAdopterProfile(noah, { fullName: "Noah Williams", region: "東京都", household: "大人2名", housing: "ペット可住宅", careExperience: "犬の飼育経験あり", dailyCare: "朝夕に世話", emergencyPlan: "家族が支援" });
  assert.equal(updated.housing, "ペット可住宅");
  assert.equal((await profileStore.getAdopterProfile(olivia)).fullName, "Olivia Parker");
  assert.equal((await profileStore.requestIdentityReview(noah)).identityStatus, "pending");
  assert.equal((await profileStore.getPendingIdentityProfiles()).length, 1);
  assert.equal((await profileStore.verifyIdentityReview(noah.id, "reviewer")).identityStatus, "verified");
  assert.equal(await profileStore.verifyIdentityReview(noah.id, "reviewer"), null);
  assert.equal((await profileStore.getPendingIdentityProfiles()).length, 0);
  assert.equal((await profileStore.saveAdopterProfile(noah, { ...updated, fullName: "Noah W." })).identityStatus, "pending");
});

test("document records validate type and keep content private to the owner", async () => {
  assert.equal(documentStore.detectDocumentType(Buffer.from("<svg></svg>")), null);
  await assert.rejects(() => documentStore.addAdopterDocument(noah.id, "図", "bad.svg", Buffer.from("<svg></svg>")));
  const pdf = Buffer.from("%PDF-1.4\n1 0 obj\nendobj\n%%EOF");
  const summary = await documentStore.addAdopterDocument(noah.id, "飼育計画", "care-plan.pdf", pdf);
  assert.equal(summary.mimeType, "application/pdf");
  assert.equal("base64" in summary, false);
  assert.equal((await documentStore.listAdopterDocuments(olivia.id)).length, 0);
  assert.equal((await documentStore.getAdopterDocument(summary.id)).base64, pdf.toString("base64"));
  assert.equal(await documentStore.removeAdopterDocument(olivia.id, summary.id), false);
  assert.equal(await documentStore.removeAdopterDocument(noah.id, summary.id), true);
  assert.equal((await documentStore.listAdopterDocuments(noah.id)).length, 0);
});
