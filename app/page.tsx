import { currentDemoUser } from "@/lib/demo-session-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Heart, Search } from "lucide-react";
import { PetCard } from "@/components/PetCard";
import { getPets } from "@/lib/repository";
import { REGIONS } from "@/lib/regions";

export default async function HomePage() {
  if (await currentDemoUser()) redirect("/dashboard");
  const petList = await getPets();
  return <>
    <section className="public-hero">
      <div className="public-hero-photo" aria-hidden="true" />
      <div className="public-hero-overlay" />
      <div className="public-hero-content">
        <h1>ずっと一緒に暮らせる<br />家族を見つけよう。</h1>
        <p>PawMatchは、ペットを迎えたい方と、新しい飼い主を探している方をつなぐ里親マッチングサービスです。</p>
        <div className="hero-cta-row" aria-label="利用目的別の入口">
          <div className="hero-entry"><span>里親希望者の方</span><Link href="/pets" className="public-primary"><Search size={22} />里親募集中の子を探す</Link></div>
          <div className="hero-entry"><span>譲渡者の方</span><Link href="/rehoming" className="public-secondary"><Heart size={22} />掲載・里親申込みを管理</Link></div>
        </div>
      </div>
    </section>
    <form className="quick-search" action="/pets" aria-label="ペット検索">
      <div className="quick-search-title"><Search size={24} /><span><strong>里親募集中の子を検索</strong><small>条件を選んで探せます</small></span></div>
      <label><span>種類</span><select name="species"><option>すべて</option><option>犬</option><option>猫</option></select></label>
      <label><span>地域</span><select name="region">{REGIONS.map((region) => <option key={region}>{region}</option>)}</select></label>
      <button type="submit" className="search-submit">この条件で探す <ArrowRight size={21} /></button>
    </form>
    <section className="public-section pets-showcase"><div className="public-section-heading"><div><span className="section-kicker">募集の例</span><h2>新しい家族を待っている子たち</h2></div><Link href="/pets">すべて見る <ArrowRight size={20} /></Link></div><div className="pet-grid">{petList.slice(0, 4).map((pet) => <PetCard pet={pet} key={pet.id} />)}</div></section>
    <section className="public-section flow-section" id="flow"><h2 className="flow-title">譲渡までの流れ</h2><div className="public-flow">{[
      ["1", "探す", "里親募集中のペットの詳細や譲渡の条件をよく読みます。"],
      ["2", "相談", "譲渡を希望する場合は、譲渡者へ相談します。書類で提出された里親希望者のプロファイルとペットの飼育条件が適合しているかどうかを審査担当者がチェックします。"],
      ["3", "面談、トライアル", "書類チェックを通過後、面談とトライアル飼育を行います。"],
      ["4", "譲渡", "環境や相性に問題がないと判断されれば、両者の合意後に譲渡が成立します。"],
    ].map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div><Link href="/guide" className="flow-guide-link">手順を見る <ArrowRight size={21} /></Link></section>
  </>;
}
