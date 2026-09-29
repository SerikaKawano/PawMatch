const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-ts.cjs");

const { demoUsers } = load("lib/demoUsers.ts");
const { pets } = load("lib/seed.ts");

test("demo people and animal breeds use UK-plausible presentation data", () => {
  const expectedBreeds = new Set([
    "ドメスティック・ショートヘア（キジトラ）",
    "ドメスティック・ショートヘア（白）",
    "ボーダー・コリー系ミックス",
    "ラブラドール・レトリーバー",
    "ドメスティック・ショートヘア（三毛）",
    "ドメスティック・ショートヘア（白黒）",
    "ミニチュア・ダックスフンド",
    "コッカプー",
  ]);
  assert.deepEqual(new Set(pets.map(pet => pet.breed)), expectedBreeds);
  assert.equal(demoUsers.find(user => user.id === "rehomer-haru").name, "Lucas Evans");
  assert.equal(demoUsers.find(user => user.id === "admin").name, "Serika Kawano", "the named project administrator remains unchanged");
  assert.ok(demoUsers.filter(user => user.role !== "admin" && !user.id.startsWith("tester-")).every(user => /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(user.name)));
});
