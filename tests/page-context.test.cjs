const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-ts.cjs");
const { pageContext } = load("lib/page-context.ts");

test("every app page except home has a title and a predictable parent link", () => {
  const pages = ["/login", "/guide", "/pets", "/pets/momo", "/pets/momo/consult", "/dashboard", "/rehoming", "/rehoming/consultations", "/reviews/progress", "/reviews/app-aiko", "/reviews/consultations", "/reviews/adopters", "/reviews/adopters/adopter", "/reviews/applicants/app-aiko", "/consultations/sample-consultation-1", "/admin/records", "/admin/analytics", "/admin/users", "/research", "/research/setup", "/research/results", "/research/session/example", "/terms", "/privacy", "/docs", "/access-denied"];
  assert.equal(pageContext("/", null), null);
  for (const page of pages) {
    const context = pageContext(page, "admin");
    assert.ok(context?.title, page);
    assert.ok(context.backHref.startsWith("/"), page);
    assert.notEqual(context.backHref, page);
  }
  assert.equal(pageContext("/pets/momo/consult", "adopter").backHref, "/pets/momo");
  assert.equal(pageContext("/dashboard", "reviewer").title, "審査担当のホーム");
  assert.equal(pageContext("/dashboard", "rehomer").title, "譲渡者のホーム");
  assert.equal(pageContext("/dashboard", "admin").title, "管理者のホーム");
  assert.equal(pageContext("/dashboard", "adopter").title, "里親希望者のホーム");
  assert.equal(pageContext("/adopter/profile", "adopter").backHref, "/dashboard");
  assert.equal(pageContext("/consultations/example", "rehomer").backHref, "/rehoming/consultations");
  assert.equal(pageContext("/reviews/adopters/adopter", "rehomer").backHref, "/reviews/progress");
  assert.equal(pageContext("/reviews/adopters/adopter", "reviewer").backHref, "/reviews/adopters");
});
