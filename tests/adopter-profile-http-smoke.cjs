// Run only against an isolated local QA server with a disposable PAWMATCH_DATA_DIR.
const assert = require("node:assert/strict");
const base = process.env.PAWMATCH_TEST_URL;
if (!base || !/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) throw new Error("Set PAWMATCH_TEST_URL to an isolated QA server.");

async function cookieFor(userId) {
  const response = await fetch(base + "/api/demo-session", { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
  assert.equal(response.status, 200);
  return response.headers.get("set-cookie").split(";")[0];
}

(async () => {
  const adopter = await cookieFor("adopter");
  const otherAdopter = await cookieFor("adopter-olivia");
  const reviewer = await cookieFor("reviewer");
  const rehomer = await cookieFor("rehomer");
  const initial = await (await fetch(base + "/api/adopter-profile", { headers: { Cookie: adopter } })).json();
  assert.equal(initial.profile.fullName, "Noah Williams");
  const profile = { fullName: "Noah Williams", region: "東京都", household: "大人2名で暮らしています。", housing: "ペット飼育可能な住居です。", careExperience: "犬の飼育経験があります。", dailyCare: "朝夕に世話を分担します。", emergencyPlan: "家族が支援します。" };
  const saved = await fetch(base + "/api/adopter-profile", { method: "PUT", headers: { Cookie: adopter, Origin: base, "Content-Type": "application/json" }, body: JSON.stringify(profile) });
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).profile.dailyCare, profile.dailyCare);
  assert.equal((await (await fetch(base + "/api/adopter-profile", { headers: { Cookie: otherAdopter } })).json()).profile.fullName, "Olivia Parker");
  assert.equal((await fetch(base + "/api/adopter-profile", { headers: { Cookie: rehomer } })).status, 403);

  const body = new FormData(); body.set("label", "お世話の計画"); body.set("file", new Blob(["%PDF-1.4\n%%EOF"], { type: "application/pdf" }), "care-plan.pdf");
  const upload = await fetch(base + "/api/adopter-documents", { method: "POST", headers: { Cookie: adopter, Origin: base }, body });
  assert.equal(upload.status, 201);
  const document = (await upload.json()).document;
  assert.equal(document.filename, "care-plan.pdf");
  assert.equal("base64" in document, false);
  const download = await fetch(base + `/api/adopter-documents/${document.id}`, { headers: { Cookie: adopter } });
  assert.equal(download.status, 200);
  assert.equal(await download.text(), "%PDF-1.4\n%%EOF");
  assert.equal((await fetch(base + `/api/adopter-documents/${document.id}`, { headers: { Cookie: otherAdopter } })).status, 404);
  assert.equal((await fetch(base + `/api/adopter-documents/${document.id}`, { headers: { Cookie: reviewer } })).status, 200);
  assert.equal((await fetch(base + `/api/adopter-documents/${document.id}`, { headers: { Cookie: rehomer } })).status, 404);
  const reviewerProfile = await (await fetch(base + "/reviews/adopters/adopter", { headers: { Cookie: reviewer } })).text();
  assert.ok(reviewerProfile.includes("Noah Williams"));
  assert.ok(reviewerProfile.includes("住居の飼育許可"));
  assert.equal((await fetch(base + "/reviews/adopters/adopter", { headers: { Cookie: rehomer }, redirect: "manual" })).status, 307);
  assert.equal((await fetch(base + `/api/adopter-documents/${document.id}`, { method: "DELETE", headers: { Cookie: otherAdopter, Origin: base } })).status, 404);

  const identity = await fetch(base + "/api/adopter-profile/identity", { method: "POST", headers: { Cookie: adopter, Origin: base } });
  assert.equal(identity.status, 200);
  assert.equal((await identity.json()).profile.identityStatus, "pending");
  const queue = await (await fetch(base + "/reviews/consultations", { headers: { Cookie: reviewer } })).text();
  assert.ok(queue.includes("本人確認の申請"));
  assert.ok(queue.includes("Noah Williams"));
  assert.equal((await fetch(base + "/api/adopter-profile/identity/adopter", { method: "PATCH", headers: { Cookie: rehomer, Origin: base } })).status, 403);
  const verify = await fetch(base + "/api/adopter-profile/identity/adopter", { method: "PATCH", headers: { Cookie: reviewer, Origin: base } });
  assert.equal(verify.status, 200);
  assert.equal((await verify.json()).profile.identityStatus, "verified");
  assert.equal((await (await fetch(base + "/api/adopter-profile", { headers: { Cookie: adopter } })).json()).profile.identityStatus, "verified");
  assert.equal((await fetch(base + `/api/adopter-documents/${document.id}`, { method: "DELETE", headers: { Cookie: adopter, Origin: base } })).status, 200);
  assert.equal((await (await fetch(base + "/api/adopter-documents", { headers: { Cookie: adopter } })).json()).documents.length, 2);
  console.log("PASS: adopter profile, protected document upload/download/delete, human identity review and role isolation.");
})().catch(error => { console.error(error); process.exitCode = 1; });
