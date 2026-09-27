import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, PawPrint, ShieldCheck } from "lucide-react";
import { adoptionSteps } from "@/lib/adoption-flow";
import { uiCopy } from "@/lib/ui-copy";

export default function GuidePage() {
  return <div className="guide-page">
    <section className="guide-hero"><span className="hero-label"><PawPrint size={21} /> はじめての方へ</span><h1>{uiCopy.adoptionFlow}</h1><p>焦らず、確かめながら。ペットと家族の双方が安心できる譲渡を進めるための手順です。</p></section>
    <main className="guide-main">
      <section className="guide-process"><h2>相談から正式譲渡まで</h2><div className="guide-step-list">{adoptionSteps.map((step, index) => { const Icon = step.icon; return <article key={step.title}><span className="guide-step-number">{index + 1}</span><span className="guide-step-art" aria-hidden="true"><Icon size={68} strokeWidth={1.65} /></span><div><h3>{step.title}</h3><p>{step.text}</p></div></article>; })}</div></section>

      <section className="screening-guide"><div><span className="section-kicker light">確認事項の例</span><h2>細かな質問には理由があります</h2><p>申込み後は、ペットが新しい家庭で安全に暮らせるかを確認するため、例えば次のような情報の提出を求めます。審査担当者がPawMatch上で回答を整理し、適合性チェックや次のステップに進むための手続きを行います。</p></div><div className="screening-topics">{["本人・家族構成", "住居と飼育スペース", "留守時間と世話の担当", "飼育経験・先住ペット", "動物病院と健康管理", "緊急時・将来の飼育計画"].map(item => <span key={item}><CheckCircle2 />{item}</span>)}</div><p className="human-decision-note"><ShieldCheck />システムが自動で譲渡の合否を決めることはありません。譲渡者・審査担当者の綿密なコミュニケーションや確認の上で最終的な判断を行います。</p></section>


      <section className="safety-guide"><AlertTriangle size={34} /><div><h2>トラブルを防ぐために</h2><ul><li>・個人情報やメッセージの内容を送信前に確認する</li><li>・事前に本人確認を完了する。</li><li>・譲渡成立後、譲渡契約書はきちんと保管する。</li><li>・ペットの受け渡しは対面で。輸送業者に任せない。</li><li>・高額な費用請求やサイト外での有償譲渡を持ちかけられた場合、取引を即時中止する。</li></ul></div></section>
      <div className="guide-cta"><h2>準備ができたら、家族を探しに行きましょう。</h2><Link href="/pets" className="public-primary">{uiCopy.findPets} <ArrowRight /></Link></div>
    </main>
  </div>;
}
