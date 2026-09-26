const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-ts.cjs");
const { pets, applicants } = load("lib/seed.ts");
const { demoUsers } = load("lib/demoUsers.ts");
const { visiblePets, visibleApplications, mayReviewPet } = load("lib/ownership.ts");

test("each synthetic pet belongs to one demo rehomer, with realistic account sizes", () => {
  assert.equal(pets.length, 8);
  const owners = new Set(pets.map(pet => pet.ownerId));
  assert.equal(owners.size, 5);
  for (const pet of pets) assert.equal(demoUsers.find(user => user.id === pet.ownerId)?.role, "rehomer");
  for (const user of demoUsers.filter(account => account.role === "rehomer")) {
    const count = visiblePets(user, pets).length;
    assert.equal(count, user.kind === "organization" ? 4 : 1);
    assert.equal(visibleApplications(user, applicants, pets).length, count * 4);
  }
});

test("every synthetic listing exposes health and rehoming information without implying verified records", () => {
  for (const pet of pets) {
    assert.ok(pet.health?.medicalHistory);
    assert.ok(pet.health?.medicalRecords?.length);
    assert.ok(pet.health?.vaccinations);
    assert.match(pet.health.evidenceStatus, /未確認/);
    assert.ok(pet.rehoming?.pedigree);
    assert.ok(pet.rehoming?.compatibility);
    assert.ok(pet.rehoming?.requirements?.length);
  }
});

test("a person cannot read or review another person's cases; administrators and reviewers see all", () => {
  const miyagi = demoUsers.find(user => user.id === "rehomer-hana");
  const aichi = demoUsers.find(user => user.id === "rehomer-riku");
  const admin = demoUsers.find(user => user.id === "admin");
  const reviewer = demoUsers.find(user => user.id === "reviewer");
  assert.deepEqual(visiblePets(miyagi, pets).map(pet => pet.id), ["hana"]);
  assert.deepEqual(visiblePets(aichi, pets).map(pet => pet.id), ["riku"]);
  assert.equal(mayReviewPet(miyagi, pets.find(pet => pet.id === "riku")), false);
  assert.equal(mayReviewPet(miyagi, pets.find(pet => pet.id === "hana")), true);
  assert.equal(visibleApplications(admin, applicants, pets).length, 32);
  assert.equal(visibleApplications(reviewer, applicants, pets).length, 32);
});
