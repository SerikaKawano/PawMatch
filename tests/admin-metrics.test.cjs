const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-ts.cjs");
const { annualAdminMetrics } = load("lib/admin-metrics.ts");
const { applicants, pets } = load("lib/seed.ts");
const { sampleConsultations } = load("lib/consultations.ts");

test("annual administrator metrics use a one-year window and unique person-pet cases", () => {
  const now = new Date("2026-09-29T23:59:59.000Z");
  const baseline = annualAdminMetrics(pets, sampleConsultations, applicants, now);
  assert.equal(baseline.periodStart, "2025-09-29");
  assert.equal(baseline.periodEnd, "2026-09-29");
  assert.equal(baseline.listedPets, 8);
  assert.equal(baseline.reviews, 32);
  assert.equal(baseline.declined, 10);
  assert.equal(baseline.adopted, 5);

  const first = sampleConsultations[0];
  const duplicate = { ...first, id: "same-person-and-pet", createdAt: "2026-09-29T10:00:00.000Z" };
  const old = { ...first, id: "outside-window", userId: "adopter-mia", petId: "riku", createdAt: "2024-01-01T10:00:00.000Z" };
  const repeated = annualAdminMetrics(pets, [...sampleConsultations, duplicate, old], applicants, now);
  assert.equal(repeated.enquiries, baseline.enquiries);
});

