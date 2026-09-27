const assert = require("node:assert/strict");
const base = process.env.PAWMATCH_TEST_URL;
if (!base || !/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) throw new Error("Set PAWMATCH_TEST_URL to an isolated QA server.");
(async () => {
  const home = await (await fetch(base + "/")).text();
  assert.ok(!home.includes('class="role-navigation"'));
  const footer = home.split('<footer class="site-footer">')[1]?.split("</footer>")[0];
  assert.ok(footer);
  assert.ok(!footer.includes('href="/guide"'));
  assert.ok(!footer.includes("ペットと次の家族をつなぐ。"));
  assert.ok(!footer.includes("申込みの確認と譲渡の判断を支援します。"));
  assert.ok(!home.includes("団体・NPOの方"));
  assert.ok(!home.includes(">その他<"));
  for (const text of ["里親希望者の方", "譲渡者の方", "募集の例", "譲渡までの流れ", "面談、トライアル", "両者の合意後に譲渡が成立します。"])
    assert.ok(home.includes(text), `TOP should include: ${text}`);
  assert.ok(!home.includes("犬や猫との、新しい家族のかたち"));
  assert.ok(!home.includes("探す、確認する、迎える。"));
  assert.ok(!home.includes("研究用の募集例"));
  assert.ok(home.includes('class="flow-step-heading"'));
  assert.ok(home.includes('class="brand-demo"'));
  assert.ok(home.includes('class="language-switch"'));
  assert.ok(home.includes("流れを見る"));
  assert.ok(!home.includes("手順を見る"));
  assert.ok(!home.includes("掲載番号 Q8N4V2K7"));
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
  assert.ok(guide.includes('class="guide-hero"'));
  const guideHero = await fetch(base + "/guide-hero-pets.png");
  assert.equal(guideHero.status, 200);
  assert.match(guideHero.headers.get("content-type"), /image\/png/);
  const listings = await (await fetch(base + "/pets")).text();
  assert.ok(listings.includes("里親募集中のペットたち"));
  assert.ok(listings.includes("・「詳細を見る」ボタンから募集内容を確認できます"));
  assert.ok(!listings.includes("写真・条件を見る"));
  const login = await (await fetch(base + "/login")).text();
  for (const name of ["Serika Kawano", "Sophie Bennett", "Alex Morgan", "Noah Williams", "Olivia Parker"]) assert.ok(login.includes(name));
  const { data: pets } = await (await fetch(base + "/api/pets")).json();
  assert.equal(new Set(pets.map(p => p.imageUrl)).size, 8);
  assert.equal(pets.filter(p => p.health?.evidenceStatus === "確認済").length, 6);
  for (const pet of pets) {
    const image = await fetch(base + pet.imageUrl);
    assert.equal(image.status, 200);
    assert.match(image.headers.get("content-type"), /image\/webp/);
    const detail = await (await fetch(base + "/pets/" + pet.id)).text();
    assert.ok(detail.includes(pet.name));
    assert.ok(detail.includes("pet-primary-actions"));
    assert.ok(detail.includes("健康状態と必要なケア"));
    assert.ok(detail.includes("暮らしのポイント"));
    assert.ok(!detail.includes("ペットのプロファイルを里親希望者のプロファイルと照らし合わせて確認・審査を行います。"));
    assert.ok(!detail.includes('class="detail-meta"'));
    assert.ok(detail.includes("トライアル期間と費用"));
    assert.ok(detail.includes("性別"));
    assert.ok(detail.includes("LIVING TOGETHER"));
    assert.ok(detail.includes("譲渡に至った経緯とお迎えの条件"));
    assert.ok(!detail.includes("これまでの経緯とお迎えの条件"));
    assert.ok(detail.includes(pet.listingNumber));
    assert.ok(detail.includes("譲渡に出すことになった経緯"));
    assert.ok(!detail.includes("お迎え前に確認する条件"));
    assert.ok(!detail.includes(">重み "));
    assert.ok(!detail.includes("この画像はモック用に生成した"));
    assert.ok(!detail.includes('class="favorite-button"'));
    if (pet.id === "momo") {
      assert.ok(detail.includes('class="health-status pending"'));
      assert.ok(detail.includes("Webサイト"));
      assert.ok(detail.includes("本人確認済み"));
      assert.ok(!detail.includes('class="detail-summary"'));
    }
  }
  const primary = { adopter: "/pets", rehomer: "/rehoming", reviewer: "/reviews/progress", admin: "/admin/analytics" };
  let reviewCookie, adminCookie;
  for (const [role, target] of Object.entries(primary)) {
    const session = await fetch(base + "/api/demo-session", { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ userId: role }) });
    const Cookie = session.headers.get("set-cookie").split(";")[0];
    if (role === "reviewer") reviewCookie = Cookie;
    if (role === "admin") adminCookie = Cookie;
    const html = await (await fetch(base + "/dashboard", { headers: { Cookie } })).text();
    assert.ok(html.includes('class="role-home-hero"'));
    assert.ok(html.includes("おかえりなさい、"));
    assert.ok(html.includes("<span>おかえりなさい、</span><span>"));
    assert.ok(html.includes({adopter:"Noah Williams",rehomer:"Emma Wilson",reviewer:"Sophie Bennett",admin:"Serika Kawano"}[role]));
    assert.ok(!html.includes('class="page-context-back"'));
    if (role === "adopter") {
      const menu = html.split('class="role-home-menu"')[1]?.split('</nav>')[0];
      assert.ok(menu);
      for (const href of ["/pets", "/adopter/profile", "/adopter/history"]) assert.ok(menu.includes(`href="${href}"`));
      assert.equal((menu.match(/href="/g) || []).length, 3);
      assert.ok(html.includes("Noah Williams"));
      assert.ok(html.includes("里親希望者のホーム"));
      assert.ok(!html.includes('class="role-nav-links"'));
      for (const old of ["里親希望者としてログイン中", "目的に合わせて選ぶ", "あなたの利用状況", 'class="dashboard-user"']) assert.ok(!html.includes(old));
    } else if (role === "rehomer") {
      const menu = html.split('class="rehomer-home-menu"')[1]?.split('</nav>')[0];
      assert.ok(menu);
      for (const href of ["/rehoming", "/reviews/progress", "/rehoming/consultations"]) assert.ok(menu.includes(`href="${href}"`));
      assert.equal((menu.match(/href="/g) || []).length, 3);
    } else if (role === "reviewer") {
      const menu = html.split('class="reviewer-home-menu"')[1]?.split('</nav>')[0];
      assert.ok(menu);
      for (const href of ["/reviews/progress", "/reviews/consultations", "/reviews/records?view=pending"]) assert.ok(menu.includes(`href="${href.replaceAll("&", "&amp;")}"`));
      assert.equal((menu.match(/href="/g) || []).length, 3);
      assert.ok(html.includes("審査担当のホーム"));
      assert.ok(!html.includes('class="next-task-panel"'));
    } else {
      const nextTask = html.split('class="next-task-panel"')[1].split("</section>")[0];
      assert.ok(nextTask.includes('href="' + target + '"'));
    }
    assert.ok(!html.includes('aria-label="現在地"'));
    assert.ok(!html.includes('class="role-navigation"'));
    assert.ok(!html.includes(">お気に入り<"));
    const screen = await fetch(base + target, { headers: { Cookie }, redirect: "manual" });
    assert.equal(screen.status, 200);
    const screenHtml = await screen.text();
    assert.ok(!screenHtml.includes('class="role-navigation"'));
    if (role === "rehomer") {
      assert.ok(screenHtml.includes("/reviews/progress?pet=momo"));
      assert.ok(!screenHtml.includes("/reviews?pet=momo"));
      assert.ok(!screenHtml.includes("個人譲渡者の管理画面"));
    }
    if (role === "admin") for (const path of Object.values(primary)) assert.ok(html.includes('href="' + path + '"'));
  }
  const progress = await (await fetch(base + "/reviews/progress?pet=momo", {headers:{Cookie:reviewCookie}})).text();
  assert.equal((progress.match(/class="pipeline-open"/g) || []).length, 4);
  assert.ok(progress.includes("審査進捗ボード") && progress.includes("各工程で確認すること"));
  assert.ok(progress.includes("完了"));
  assert.ok(!progress.includes("通過済み"));
  assert.ok(!progress.includes("ここから審査を進めます"));
  const removedComparison = await fetch(base + "/reviews?pet=momo", {headers:{Cookie:reviewCookie},redirect:"manual"});
  assert.equal(removedComparison.status,307);
  assert.equal(removedComparison.headers.get("location"),"/reviews/progress?pet=momo");
  const workflow = await (await fetch(base + "/reviews/app-aiko", {headers:{Cookie:reviewCookie}})).text();
  assert.ok(workflow.includes("内容を保存（工程は進めない）"));
  assert.ok(workflow.includes("review-state-banner"));
  assert.ok(workflow.includes("次の工程へ進める") && workflow.includes("今回は見送る"));
  const adminPet = await (await fetch(base + "/pets/momo", { headers: { Cookie: adminCookie } })).text();
  assert.ok(!adminPet.includes(">重み "));
  const reviewerPet = await (await fetch(base + "/pets/momo", { headers: { Cookie: reviewCookie } })).text();
  assert.ok(!reviewerPet.includes(">重み "));
  const guest = await fetch(base + "/rehoming", { redirect: "manual" });
  assert.equal(guest.status, 307);
  assert.ok(guest.headers.get("location").includes("next=%2Frehoming"));
  console.log("PASS: 8 local images, all role primary links, explicit pet/review actions, filtered progress and guest return.");
})().catch(error => { console.error(error); process.exitCode = 1; });
