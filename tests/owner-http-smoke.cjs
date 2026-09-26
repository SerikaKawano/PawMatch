// Run against an isolated local server with PAWMATCH_DATA_DIR set to a QA directory.
const assert = require("node:assert/strict");
const base = process.env.PAWMATCH_TEST_URL;
if (!base || !/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) throw new Error("Isolated local QA URL required");

async function login(userId) {
  const response = await fetch(base + "/api/demo-session", {
    method: "POST", headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  assert.equal(response.status, 200, userId);
  return response.headers.get("set-cookie").split(";")[0];
}

(async () => {
  const owners = [
    ["rehomer", ["momo", "yuki", "sora", "kai"]],
    ["rehomer-hana", ["hana"]],
    ["rehomer-riku", ["riku"]],
    ["rehomer-haru", ["haru"]],
    ["rehomer-nagi", ["nagi"]],
  ];
  const allIds = owners.flatMap(([, ids]) => ids);
  for (const [userId, petIds] of owners) {
    const cookie = await login(userId);
    const response = await fetch(base + "/api/applications", { headers: { Cookie: cookie } });
    assert.equal(response.status, 200);
    const applications = (await response.json()).data;
    assert.equal(applications.length, petIds.length * 4, userId);
    assert.deepEqual([...new Set(applications.map(item => item.petId))].sort(), [...petIds].sort());
    const listing = await (await fetch(base + "/rehoming", { headers: { Cookie: cookie } })).text();
    for (const id of petIds) assert.match(listing, new RegExp(`href="/pets/${id}"`), userId + ":" + id);
    for (const id of allIds.filter(id => !petIds.includes(id))) {
      assert.doesNotMatch(listing, new RegExp(`href="/pets/${id}"`), userId + " must not list " + id);
      const filtered = await fetch(base + "/api/applications?petId=" + id, { headers: { Cookie: cookie } });
      assert.deepEqual((await filtered.json()).data, []);
    }
    const otherId = allIds.find(id => !petIds.includes(id));
    const adminCookie = await login("admin");
    const otherCases = (await (await fetch(base + "/api/applications?petId=" + otherId, { headers: { Cookie: adminCookie } })).json()).data;
    const otherCaseId = otherCases[0].id;
    const detail = await fetch(base + "/reviews/" + otherCaseId, { headers: { Cookie: cookie }, redirect: "manual" });
    assert.equal(detail.status, 404, userId + " other detail");
    const mutation = await fetch(base + "/api/applications/" + otherCaseId, {
      method: "PATCH", headers: { Cookie: cookie, Origin: base, "Content-Type": "application/json" }, body: "{}",
    });
    assert.equal(mutation.status, 404, userId + " other mutation");
    const ownDetail = await fetch(base + "/reviews/" + applications[0].id, { headers: { Cookie: cookie } });
    assert.equal(ownDetail.status, 200, userId + " own detail");
  }
  for (const userId of ["admin", "reviewer"]) {
    const cookie = await login(userId);
    const result = (await (await fetch(base + "/api/applications", { headers: { Cookie: cookie } })).json()).data;
    assert.equal(result.length, 32);
  }
  for (const path of ["/terms", "/privacy"]) assert.equal((await fetch(base + path)).status, 200, path);
  console.log("PASS: 5 owner accounts, 8 pet scopes, 32 applications, direct details, mutation isolation, admin/reviewer and policy pages");
})().catch(error => { console.error(error); process.exitCode = 1; });
