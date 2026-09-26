// Use an isolated QA server; this creates only demo sessions.
const assert=require("node:assert/strict");
const base=process.env.PAWMATCH_TEST_URL;
if(!base || !/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) throw new Error("Isolated local QA URL required");
const matrix=[
 ["/rehoming",["rehomer","admin"]],
 ["/reviews",["rehomer","reviewer","admin"]],
 ["/reviews/progress",["rehomer","reviewer","admin"]],
 ["/reviews/app-aiko",["rehomer","reviewer","admin"]],
 ["/reviews/records?view=pending",["rehomer","reviewer","admin"]],
 ["/pets/momo/consult",["adopter","admin"]],
 ...["/admin/records","/admin/analytics","/research","/research/setup","/research/results","/docs"].map(p=>[p,["admin"]])
];
const apis=[
 ["GET","/api/applications",["rehomer","reviewer","admin"]],
 ["GET","/api/consultations",["adopter","admin"]],
 ...["/api/research/config","/api/research/export","/api/openapi"].map(p=>["GET",p,["admin"]]),
 ["PATCH","/api/applications/app-aiko",["rehomer","reviewer","admin"]],
 ["POST","/api/consultations",["adopter","admin"]],
 ...[["PUT","/api/research/config"],["PUT","/api/research/coding"],["POST","/api/research/sessions"],["POST","/api/seed"]].map(([m,p])=>[m,p,["admin"]])
];
(async()=>{
 let checks=0;
 for(const role of ["guest","adopter","rehomer","reviewer","admin"]){
  let cookie="";
  if(role!=="guest"){const login=await fetch(base+"/api/demo-session",{method:"POST",headers:{"Content-Type":"application/json",Origin:base},body:JSON.stringify({userId:role})});assert.equal(login.status,200);cookie=login.headers.get("set-cookie").split(";")[0];assert.match(cookie,/pawmatch-demo-session=[a-f0-9]{64}/);}
  for(const [path,roles]of matrix){const res=await fetch(base+path,{headers:{Cookie:cookie},redirect:"manual"});assert.equal(res.status,roles.includes(role)?200:307,role+" "+path);if(!roles.includes(role))assert.ok(role==="guest"?res.headers.get("location").startsWith("/login?"):res.headers.get("location")==="/access-denied");checks++;}
  for(const [method,path,roles]of apis){
   // Only negative mutation probes; positive persistence checks live in http-smoke.cjs.
   if(method!=="GET"&&roles.includes(role))continue;
   const res=await fetch(base+path,{method,headers:{Cookie:cookie,Origin:base,"Content-Type":"application/json"},...(method==="GET"?{}:{body:JSON.stringify({userId:"admin",role:"admin"})})});
   assert.equal(res.status,roles.includes(role)?200:role==="guest"?401:403,role+" "+method+" "+path);checks++;
  }
  if(role!=="guest"){
   const html=await(await fetch(base+"/dashboard",{headers:{Cookie:cookie}})).text();
   assert.ok(html.includes('class="role-hero-art"'));
   const anchors=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
   if(role==="adopter") assert.ok(!anchors.some(p=>/^\/(?:rehoming|reviews|admin|research|docs)(?:[/?#]|$)/.test(p)));
   if(["rehomer","reviewer"].includes(role)){assert.ok(!anchors.some(p=>/^\/(?:admin|research|docs)(?:[/?#]|$)/.test(p)));assert.ok(!anchors.includes("/dashboard#consultations"));}
   if(["rehomer","reviewer"].includes(role))assert.equal((await fetch(base+"/reviews/records?view=organizations",{headers:{Cookie:cookie}})).status,404);
   const denied=await fetch(base+"/api/applications/app-aiko",{method:"PATCH",headers:{Cookie:cookie,Origin:"https://example.com","Content-Type":"application/json"},body:"{}"});assert.equal(denied.status,403);
   await fetch(base+"/api/demo-session",{method:"DELETE",headers:{Cookie:cookie,Origin:base}});
   assert.equal((await fetch(base+"/api/applications",{headers:{Cookie:cookie}})).status,401);
  }
 }
 for(const cookie of ["pawmatch-demo-user=admin","pawmatch-demo-session=admin","pawmatch-demo-session="+"0".repeat(64)])assert.equal((await fetch(base+"/api/applications",{headers:{Cookie:cookie}})).status,401);
 const guide=await(await fetch(base+"/guide")).text();assert.equal((guide.match(/class="guide-step-art"/g)||[]).length,4);
 assert.ok(!guide.includes("/guide/search.webp"));
 console.log("PASS: "+checks+" role/page/API checks; hidden links, view allowlist, CSRF, forged cookies, revoked sessions and 4 SVG steps.");
})().catch(e=>{console.error(e);process.exitCode=1;});
