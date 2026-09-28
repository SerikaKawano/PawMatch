// Run only against an isolated local QA server with a disposable PAWMATCH_DATA_DIR.
const assert = require("node:assert/strict");
const base = process.env.PAWMATCH_TEST_URL;
if (!base || !/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) throw new Error("Set PAWMATCH_TEST_URL to an isolated QA server.");

async function cookieFor(userId) {
  const response = await fetch(base + "/api/demo-session", { method: "POST", headers: { "Content-Type": "application/json", Origin: base }, body: JSON.stringify({ userId }) });
  assert.equal(response.status, 200);
  return response.headers.get("set-cookie").split(";")[0];
}

(async () => {
  const adopter = await cookieFor("adopter");
  const reviewer = await cookieFor("reviewer");
  const rehomer = await cookieFor("rehomer");
  const unrelatedRehomer = await cookieFor("rehomer-hana");
  const page = await (await fetch(base + "/pets/momo/consult", { headers: { Cookie: adopter } })).text();
  assert.match(page, /Bella(?:<!-- -->)?について問い合わせる/);
  assert.ok(page.includes("相談内容（必須・2,000文字まで）"));
  assert.ok(page.includes("連絡の取りやすいメールアドレスまたは電話番号"));
  assert.ok(!page.includes("連絡の取りやすいメールアドレス（必須・.test）"));
  assert.ok(!page.includes("相談の受付と審査担当者の確認状況を表示します。"));
  assert.ok(page.includes("あなたの相談履歴"));
  assert.ok(!page.includes("相談の種類"));
  assert.ok(!page.includes("相談者："));

  const requestId = crypto.randomUUID();
  const create = await fetch(base + "/api/consultations", { method: "POST", headers: { Cookie: adopter, Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ petId: "momo", message: "通院とお世話の条件を確認したいです。", contactEmail: "noah@pawmatch.test", requestId }) });
  assert.equal(create.status, 201);
  const { consultation } = await create.json();
  assert.equal(consultation.status, "received");
  assert.equal(consultation.contactEmail, "noah@pawmatch.test");
  const ownerReply = await fetch(base + `/api/consultations/${consultation.id}`, { method: "POST", headers: { Cookie: rehomer, Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ message: "Bellaは朝夕の投薬に慣れています。薬はフードと分けて与えています。" }) });
  assert.equal(ownerReply.status, 201);
  assert.equal((await ownerReply.json()).consultation.messages.at(-1).authorId, "rehomer");
  const unrelatedReply = await fetch(base + `/api/consultations/${consultation.id}`, { method: "POST", headers: { Cookie: unrelatedRehomer, Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ message: "この相談には参加できません。" }) });
  assert.equal(unrelatedReply.status, 403);
  const adopterReply = await fetch(base + `/api/consultations/${consultation.id}`, { method: "POST", headers: { Cookie: adopter, Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ message: "ありがとうございます。通院先についても確認します。" }) });
  assert.equal(adopterReply.status, 201);
  const operationsReply = await fetch(base + `/api/consultations/${consultation.id}`, { method: "POST", headers: { Cookie: reviewer, Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ message: "審査へ進む場合はプロファイルと住居書類をご提出ください。" }) });
  assert.equal(operationsReply.status, 201);
  const thread = await (await fetch(base + `/consultations/${consultation.id}`, { headers: { Cookie: rehomer } })).text();
  assert.ok(thread.includes("この相談に参加する人"));
  assert.ok(thread.includes("PawMatch運営"));
  assert.ok(thread.includes("メッセージを送る"));
  assert.ok(thread.includes("Bellaは朝夕の投薬に慣れています"));
  const phoneCreate = await fetch(base + "/api/consultations", { method: "POST", headers: { Cookie: adopter, Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ petId: "yuki", message: "電話での連絡も可能です。", contactEmail: "+44 7700 900123", requestId: crypto.randomUUID() }) });
  assert.equal(phoneCreate.status, 201);
  assert.equal((await phoneCreate.json()).consultation.contactEmail, "+44 7700 900123");

  const queue = await (await fetch(base + "/reviews/consultations", { headers: { Cookie: reviewer } })).text();
  assert.ok(queue.includes("通院とお世話の条件を確認したいです。"));
  const forbiddenPage = await fetch(base + "/reviews/consultations", { headers: { Cookie: rehomer }, redirect: "manual" });
  assert.equal(forbiddenPage.status, 307);
  assert.equal(forbiddenPage.headers.get("location"), "/access-denied");
  const forbiddenAction = await fetch(base + `/api/consultations/${consultation.id}`, { method: "PATCH", headers: { Cookie: rehomer, Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ status: "profile_requested" }) });
  assert.equal(forbiddenAction.status, 403);
  const update = await fetch(base + `/api/consultations/${consultation.id}`, { method: "PATCH", headers: { Cookie: reviewer, Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ status: "profile_requested" }) });
  assert.equal(update.status, 200);
  assert.equal((await update.json()).consultation.status, "profile_requested");
  const duplicate = await fetch(base + `/api/consultations/${consultation.id}`, { method: "PATCH", headers: { Cookie: reviewer, Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ status: "closed" }) });
  assert.equal(duplicate.status, 409);
  const history = await (await fetch(base + "/adopter/history", { headers: { Cookie: adopter } })).text();
  assert.ok(history.includes("申込み前情報の提出"));
  assert.ok(history.includes("相談受付済み"));
  console.log("PASS: simple inquiry, reviewer-controlled handoff, progress and role boundary.");
})().catch(error => { console.error(error); process.exitCode = 1; });
