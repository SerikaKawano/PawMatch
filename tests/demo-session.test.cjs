const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
process.env.MONGODB_URI = "";
process.env.PAWMATCH_DATA_DIR = mkdtempSync(path.join(os.tmpdir(), "pawmatch-consultation-test-"));
const load = require("./load-ts.cjs");
const { safeLoginNext, resolveDemoUser } = load("lib/demo-session.ts");
const { getConsultations, saveConsultation, updateConsultationStatus, consultationInput } = load("lib/consultations.ts");

test("demo login validates roles and accepts only local intended destinations", () => {
  for (const id of ["admin", "reviewer", "rehomer", "adopter"]) assert.equal(resolveDemoUser(id).id, id);
  for (const value of ["root", null, {}, "Admin"]) assert.equal(resolveDemoUser(value), null);
  for (const value of ["/pets/momo/consult", "/pets/sora", "/pets", "/dashboard#consultations"]) assert.equal(safeLoginNext(value), value);
  for (const value of ["https://example.com", "//example.com", "/\\example.com", "/%2f%2fexample.com", "/pets/../login", "/login", "/dashboard?user=admin", "/pets/momo/consult\n", null, []]) assert.equal(safeLoginNext(value), "/dashboard");
});

test("consultations validate, persist, avoid duplicates and isolate users and pets", async () => {
  assert.equal(consultationInput.safeParse({ petId: "momo", contactEmail: "noah@pawmatch.test", message: "  ", requestId: randomUUID() }).success, false);
  assert.equal(consultationInput.safeParse({ petId: "momo", contactEmail: "real@example.com", message: "質問です", requestId: randomUUID() }).success, false);
  const requestId = randomUUID();
  const input = { petId: "momo", contactEmail: "noah@pawmatch.test", message: "  お世話について相談します。  ", requestId };
  const first = await saveConsultation("adopter", input);
  const retry = await saveConsultation("adopter", input);
  assert.equal(first.id, retry.id);
  assert.equal(first.message, "お世話について相談します。");
  assert.equal(first.status, "received");
  await saveConsultation("adopter", { ...input, petId: "sora", requestId: randomUUID() });
  await saveConsultation("reviewer", input);
  assert.equal((await getConsultations("adopter")).length, 2);
  assert.equal((await getConsultations("adopter", "momo")).length, 1);
  assert.equal((await getConsultations("reviewer")).length, 1);
  assert.equal((await getConsultations("admin")).length, 0);
  assert.equal((await updateConsultationStatus(first.id, "profile_requested", "reviewer")).status, "profile_requested");
  assert.equal(await updateConsultationStatus(first.id, "closed", "reviewer"), null);
  assert.equal((await getConsultations("adopter", "momo"))[0].status, "profile_requested");
});
