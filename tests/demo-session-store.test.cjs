const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path");
process.env.MONGODB_URI="";
process.env.PAWMATCH_DATA_DIR=fs.mkdtempSync(path.join(os.tmpdir(),"pawmatch-role-session-"));
const load=require("./load-ts.cjs");
const {issueDemoSession,resolveDemoSession,revokeDemoSession}=load("lib/demo-session-store.ts");
const {mutateStore,readStore}=load("lib/persistence.ts");
test("opaque sessions reject tampering, expire and revoke",async()=>{
 const token=await issueDemoSession("adopter");
 assert.equal((await resolveDemoSession(token)).id,"adopter");
 assert.equal(await resolveDemoSession("admin"),null);
 const rows=await readStore("demo-sessions-v1",()=>[]);
 assert.notEqual(rows[0].hash,token);
 assert.equal(JSON.stringify(rows).includes(token),false);
 await mutateStore("demo-sessions-v1",()=>[],records=>{records[0].expiresAt=Date.now()-1;});
 assert.equal(await resolveDemoSession(token),null);
 const admin=await issueDemoSession("admin");assert.equal((await resolveDemoSession(admin)).id,"admin");
 await revokeDemoSession(admin);assert.equal(await resolveDemoSession(admin),null);
 await assert.rejects(()=>issueDemoSession("unknown"));
});
