const test = require("node:test"), assert = require("node:assert/strict");
const load = require("./load-ts.cjs");
const {canAccess, permittedDestination} = load("lib/permissions.ts");
test("independent minimum roles and admin superset",()=>{
  const expected={adopter:["consult"],rehomer:["rehome","review"],reviewer:["review"],admin:["consult","rehome","review","admin"]};
  for(const role of [...Object.keys(expected),"invalid"]) for(const cap of ["consult","rehome","review","admin"])
    assert.equal(canAccess({role},cap), expected[role]?.includes(cap) ?? false);
  assert.equal(canAccess({role:"rehomer"},"review"),true);
  assert.equal(canAccess(null,"review"),false);
});
test("login destinations do not loop into a different role",()=>{
  for(const path of ["/rehoming","/reviews?pet=momo","/admin/analytics","/research/setup","/docs"]) assert.equal(permittedDestination({role:"adopter"},path),"/dashboard");
  assert.equal(permittedDestination({role:"rehomer"},"/pets/Q8N4V2K7/consult"),"/dashboard");
  assert.equal(permittedDestination({role:"admin"},"/rehoming"),"/rehoming");
});
