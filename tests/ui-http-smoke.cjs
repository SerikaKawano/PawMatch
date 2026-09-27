const assert = require("node:assert/strict");
const base = process.env.PAWMATCH_TEST_URL;
if (!base || !/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) throw new Error("Set PAWMATCH_TEST_URL to an isolated QA server.");
(async () => {
  const home = await (await fetch(base + "/")).text();
  assert.ok(!home.includes("団体・NPOの方"));
  assert.ok(!home.includes(">その他<"));
  for (const text of ["里親希望者の方", "譲渡者の方", "募集の例", "譲渡までの流れ", "面談、トライアル", "両者の合意後に譲渡が成立します。"])
    assert.ok(home.includes(text), `TOP should include: ${text}`);
  assert.ok(!home.includes("犬や猫との、新しい家族のかたち"));
  assert.ok(!home.includes("探す、確認する、迎える。"));
  assert.ok(!home.includes("研究用の募集例"));
  assert.ok(home.includes('class="flow-step-heading"'));
  const guide = await (await fetch(base + "/guide")).text();
  for (const text of [
    "相談から正式譲渡まで", "確認事項の例", "細かな質問には理由があります",
    "事前に本人確認を完了する。", "譲渡成立後、譲渡契約書はきちんと保管する。",
    "ペットの受け渡しは対面で。輸送業者に任せない。",
    "取引を即時中止する。",
  ]) assert.ok(guide.includes(text), `Guide should include: ${text}`);
  for (const text of [
    "里親募集中のペットの詳細や譲渡の条件をよく読みます。",
    "譲渡を希望する場合は、譲渡者へ相談します。書類で提出された里親希望者のプロファイルとペットの飼育条件が適合しているかどうかを審査担当者がチェックします。",
    "書類チェックを通過後、面談とトライアル飼育を行います。",
    "環境や相性に問題がないと判断されれば、両者の合意後に譲渡が成立します。",
  ]) {
    assert.ok(home.includes(text), `TOP flow should include: ${text}`);
    assert.ok(guide.includes(text), `Guide flow should include: ${text}`);
  }
  assert.ok(!guide.includes("4 STEPS"));
  assert.ok(!guide.includes("図はSVGアイコンです。"));
  const login = await (await fetch(base + "/login")).text();
  for (const name of ["Serika Kawano", "Sophie Bennett", "Alex Morgan", "Noah Williams", "Olivia Parker"]) assert.ok(login.includes(name));
  const { data: pets } = await (await fetch(base + "/api/pets")).json();
  assert.equal(new Set(pets.map(p => p.imageUrl)).size, 8);
  for (const pet of pets) {
    const image = await fetch(base + pet.imageUrl);
    assert.equal(image.status, 200);
    assert.match(image.headers.get("content-type"), /image\/webp/);
    const detail = await (await fetch(base + "/pets/" + pet.id)).text();
    assert.ok(detail.includes(pet.name));
    assert.ok(detail.includes("pet-primary-actions"));
    assert.ok(!detail.includes('class="favorite-button"'));
  }
  const primary = { adopter: "/pets", rehomer: "/rehoming", reviewer: "/reviews/progress", admin: "/admin/analytics" };
  let reviewCookie;
  for (const [role, target] of Object.entries(primary)) {
    const session = await fetch(base + "/api/demo-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: role }) });
    const Cookie = session.headers.get("set-cookie").split(";")[0];
    if (role === "reviewer") reviewCookie = Cookie;
    const html = await (await fetch(base + "/dashboard", { headers: { Cookie } })).text();
    const nextTask = html.split('class="next-task-panel"')[1].split("</section>")[0];
    assert.ok(nextTask.includes('href="' + target + '"'));
    assert.ok(html.includes('aria-label="現在地"'));
    assert.ok(!html.includes(">お気に入り<"));
    const screen = await fetch(base + target, { headers: { Cookie }, redirect: "manual" });
    assert.equal(screen.status, 200);
    if (role === "rehomer") assert.ok((await screen.text()).includes("/reviews?pet=momo"));
    if (role === "admin") for (const path of Object.values(primary)) assert.ok(html.includes('href="' + path + '"'));
  }
  const progress = await (await fetch(base + "/reviews/progress?pet=momo", {headers:{Cookie:reviewCookie}})).text();
  assert.equal((progress.match(/class="pipeline-open"/g) || []).length, 4);
  assert.ok(progress.includes("この審査を開く"));
  assert.ok(!progress.includes("ここから審査を進めます"));
  const comparisons = await (await fetch(base + "/reviews?pet=momo", {headers:{Cookie:reviewCookie}})).text();
  assert.ok(comparisons.includes("この申込みの確認・記録へ"));
  assert.ok(!comparisons.includes("基本表示"));
  const workflow = await (await fetch(base + "/reviews/app-aiko", {headers:{Cookie:reviewCookie}})).text();
  assert.ok(workflow.includes("内容を保存（工程は進めない）"));
  assert.ok(workflow.includes("review-state-banner"));
  const guest = await fetch(base + "/rehoming", { redirect: "manual" });
  assert.equal(guest.status, 307);
  assert.ok(guest.headers.get("location").includes("next=%2Frehoming"));
  console.log("PASS: 8 local images, all role primary links, explicit pet/review actions, filtered progress and guest return.");
})().catch(error => { console.error(error); process.exitCode = 1; });
