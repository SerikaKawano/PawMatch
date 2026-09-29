const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-ts.cjs");
const { pets, applicants } = load("lib/seed.ts");
const { demoUsers } = load("lib/demoUsers.ts");
const { visiblePets, visibleApplications, mayReviewPet } = load("lib/ownership.ts");

test("each synthetic pet belongs to one demo rehomer, with realistic account sizes", () => {
  assert.equal(pets.length, 13);
  const owners = new Set(pets.map(pet => pet.ownerId));
  assert.equal(owners.size, 10);
  for (const pet of pets) assert.equal(demoUsers.find(user => user.id === pet.ownerId)?.role, "rehomer");
  for (const user of demoUsers.filter(account => account.role === "rehomer")) {
    const count = visiblePets(user, pets).length;
    assert.equal(count, user.kind === "organization" ? 4 : 1);
    assert.equal(visibleApplications(user, applicants, pets).length, user.id.startsWith("tester-") ? 1 : count * 4);
  }
});

test("pet profiles contain useful health details with explicit record status", () => {
  assert.ok(pets.filter(pet => pet.health?.evidenceStatus === "確認済").length >= 6);
  assert.ok(pets.filter(pet => pet.birthDateApproximate).length >= 4);
  assert.equal(new Set(pets.map(pet => pet.listingNumber)).size, pets.length);
  for (const pet of pets) {
    assert.match(pet.listingNumber, /^[A-Z0-9]{8}$/);
    assert.match(pet.birthDate, /^20\d{2}年\d{1,2}月(?:\d{1,2}日|頃)$/);
    assert.ok(pet.health?.medicalHistory);
    assert.ok(pet.health?.vaccinationHistory?.length >= 4);
    assert.ok(pet.health?.recordEvidence?.length >= 4);
    assert.ok(pet.health?.medicalRecords?.length);
    assert.ok(pet.health?.vaccinations);
    assert.match(pet.health.evidenceStatus, /^(確認済|未確認)$/);
    assert.ok(pet.health.medicalRecords.every(record => !record.includes("未提出")));
    assert.match(pet.health.spayNeuter, pet.sex === "Female" ? /避妊/ : /去勢/);
    assert.ok(pet.rehoming?.pedigree);
    assert.ok(pet.rehoming?.compatibility);
    assert.ok(pet.rehoming?.requirements?.length);
    assert.ok(pet.rehoming?.story?.length > 60);
    assert.ok(pet.rehoming?.conditionsMessage?.length > 50);
    assert.equal(Object.keys(pet.rehoming?.livingPoints ?? {}).length, 6);
    for (const text of Object.values(pet.rehoming?.livingPoints ?? {})) assert.ok(text.length > 28);
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
  assert.equal(visibleApplications(admin, applicants, pets).length, 37);
  assert.equal(visibleApplications(reviewer, applicants, pets).length, 37);
});
