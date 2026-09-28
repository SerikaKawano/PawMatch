const { test } = require("node:test");
const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const load = require("./load-ts.cjs");
const { pets, applicants } = load("lib/seed.ts");
const { scenarios } = load("lib/research/scenarios.ts");
const { roleNavigation } = load("lib/role-navigation.ts");
const { safeLoginNext } = load("lib/demo-session.ts");
const { demoUsers } = load("lib/demoUsers.ts");
test("eight distinct local pet images and English names preserve research links", () => {
  assert.equal(pets.length, 8);
  assert.equal(applicants.length, 32);
  assert.equal(new Set(pets.map(pet => pet.imageUrl)).size, 8);
  assert.equal(new Set(pets.map(pet => pet.breed)).size, 8);
  assert.ok(pets.every(pet => /^[A-Za-z]+$/.test(pet.name)));
  for (const pet of pets) {
    assert.equal(pet.name, scenarios.find(s => s.petId === pet.id).petName);
    const file = path.join(__dirname, "../public", pet.imageUrl);
    assert.ok(existsSync(file), file);
    assert.equal(readFileSync(file).toString("ascii", 8, 12), "WEBP");
    assert.equal(applicants.filter(a => a.petId === pet.id).length, 4);
  }
});
test("every persona has an actionable primary destination", () => {
  assert.equal(demoUsers.find(user => user.id === "admin").name, "Serika Kawano");
  for (const role of ["reviewer", "rehomer", "adopter"]) assert.ok(demoUsers.filter(user => user.role === role).length >= 2);
  assert.equal(demoUsers.filter(user => user.role === "adopter").length, 10);
  assert.equal(applicants.filter(application => application.userId?.startsWith("adopter")).length, 7);
  assert.equal(new Set(applicants.filter(application => application.userId).map(application => application.stage)).size, 6);
  assert.equal(demoUsers.filter(user => user.role === "rehomer" && user.kind === "individual").length, 4);
  assert.equal(roleNavigation.adopter.tasks[0].href, "/pets");
  assert.equal(roleNavigation.rehomer.tasks[0].href, "/rehoming");
  assert.equal(roleNavigation.reviewer.tasks[0].href, "/reviews/progress");
  assert.equal(roleNavigation.admin.tasks[0].href, "/admin/analytics");
  for (const group of Object.values(roleNavigation)) {
    for (const task of group.tasks) {
      const route = task.href.split(/[?#]/)[0];
      assert.ok(existsSync(path.join(__dirname, "../app", route, "page.tsx")), task.href);
      assert.ok(!task.href.includes("?user="));
    }
  }
  assert.equal(safeLoginNext("/rehoming"), "/rehoming");
});
test("account menu requires logout before choosing another user", () => {
  const header = readFileSync(path.join(__dirname, "../components/PublicHeader.tsx"), "utf8");
  assert.ok(!header.includes("テストユーザーを切り替える"));
  assert.ok(header.includes('window.location.assign("/login")'));
});
test("public shell remains cacheable while session navigation hydrates separately", () => {
  const shell = readFileSync(path.join(__dirname, "../components/SessionChrome.tsx"), "utf8");
  const layout = readFileSync(path.join(__dirname, "../app/layout.tsx"), "utf8");
  assert.match(shell, /fetch\("\/api\/demo-session", \{ cache: "no-store"/);
  assert.match(shell, /<PublicHeader user=\{user\}/);
  assert.doesNotMatch(layout, /currentDemoUser/);
  for (const page of ["guide", "terms", "privacy"]) {
    assert.match(readFileSync(path.join(__dirname, `../app/${page}/page.tsx`), "utf8"), /dynamic = "force-static"/);
  }
});
