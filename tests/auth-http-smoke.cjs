// Run only against an isolated local server with PAWMATCH_DATA_DIR set to a QA directory.
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3003";
if (!/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(base)) throw new Error("Use an isolated local QA server.");
async function json(path, method, body, cookie) {
  return fetch(base + path, { method, redirect: "manual", headers: { "Content-Type": "application/json", Origin: base, ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
(async () => {
  const guest = await fetch(base + "/pets/momo/consult", { redirect: "manual" });
  assert.equal(guest.status, 307);
  assert.equal(guest.headers.get("location"), "/login?next=%2Fpets%2Fmomo%2Fconsult");
  assert.equal((await json("/api/consultations", "POST", {})).status, 401);
  assert.equal((await json("/api/demo-session", "POST", { userId: "invalid" })).status, 400);
  const sessions = {};
  for (const [id, name] of [["adopter", "Noah Williams"], ["admin", "Serika Kawano"], ["reviewer", "Sophie Bennett"], ["rehomer", "Emma Wilson"]]) {
    const login = await json("/api/demo-session", "POST", { userId: id });
    assert.equal(login.status, 200);
    assert.match(login.headers.get("set-cookie"), /HttpOnly/i);
    sessions[id] = login.headers.get("set-cookie").split(";")[0];
    const session = await (await json("/api/demo-session", "GET", null, sessions[id])).json();
    assert.equal(session.user.id, id);
    const dashboard = await fetch(base + "/dashboard?user=" + (id === "admin" ? "adopter" : "admin"), { headers: { Cookie: sessions[id] } });
    const html = await dashboard.text();
    assert.equal(dashboard.status, 200);
    assert.ok(html.includes(name));
    assert.ok(html.split('class="dashboard-welcome"')[1].split('class="dashboard-user"')[0].includes(name));
    assert.ok(html.includes("session-account-toggle"));
    const consult = await fetch(base + "/pets/momo/consult", { redirect: "manual", headers: { Cookie: sessions[id] } });
    if (["adopter", "admin"].includes(id)) {
      assert.equal(consult.status, 200);
      assert.ok((await consult.text()).includes("consultation-message"));
    } else { assert.equal(consult.status, 307); assert.equal(consult.headers.get("location"), "/access-denied"); }
  }
  const marker = "相談テスト-" + randomUUID();
  const body = { petId: "momo", topic: "健康・お世話", message: marker, requestId: randomUUID(), userId: "admin" };
  const saved = await json("/api/consultations", "POST", body, sessions.adopter);
  assert.equal(saved.status, 201);
  const record = (await saved.json()).consultation;
  assert.equal(record.userId, "adopter");
  const retry = await json("/api/consultations", "POST", body, sessions.adopter);
  assert.equal((await retry.json()).consultation.id, record.id);
  const history = await (await json("/api/consultations?petId=momo", "GET", null, sessions.adopter)).json();
  assert.equal(history.consultations.filter(item => item.message === marker).length, 1);
  for (const role of ["reviewer", "admin", "rehomer"]) {
    const response = await json("/api/consultations", "GET", null, sessions[role]);
    if (role === "admin") assert.ok(!(await response.json()).consultations.some(item => item.message === marker));
    else assert.equal(response.status, 403);
  }
  const persisted = await fetch(base + "/pets/momo/consult", { headers: { Cookie: sessions.adopter } });
  assert.ok((await persisted.text()).includes(marker));
  const badPet = await json("/api/consultations", "POST", { ...body, petId: "missing-pet", requestId: randomUUID() }, sessions.adopter);
  assert.equal(badPet.status, 404);
  const crossOrigin = await fetch(base + "/api/demo-session", { method: "POST", headers: { Origin: "https://example.com", "Content-Type": "application/json" }, body: JSON.stringify({ userId: "admin" }) });
  assert.equal(crossOrigin.status, 403);
  const logout = await json("/api/demo-session", "DELETE", null, sessions.adopter);
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/i);
  const clearedCookie = logout.headers.get("set-cookie").split(";")[0];
  assert.equal((await json("/api/consultations", "GET", null, clearedCookie)).status, 401);
  assert.equal((await json("/api/consultations", "GET", null, sessions.adopter)).status, 401);
  console.log("PASS: core identities, header, direct consultation, login return, query isolation, persistence, retry, user isolation and logout");
})().catch(error => { console.error(error); process.exitCode = 1; });
