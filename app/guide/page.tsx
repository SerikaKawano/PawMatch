import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, HeartHandshake, MessageCircle, PawPrint, Search, ShieldCheck } from "lucide-react";

const steps = [
  { icon: Search, title: "ペットを探す", text: "種類・地域・性格・必要なお世話を確認し、暮らしに合う子を探します。" },
  { icon: MessageCircle, title: "相談・応募する", text: "募集地域と譲渡条件を確認してから、詳細画面より譲渡者へ連絡します。" },
  { icon: ShieldCheck, title: "条件・書類を確認する", text: "住環境、日々の世話、医療への備えを確認します。未確認と条件不一致は区別します。" },
  { icon: HeartHandshake, title: "面談・譲渡を決める", text: "対話と必要に応じたトライアルの後、担当者と応募者が合意して進めます。" },
];

export default function GuidePage() {
  return <div className="guide-page">
    <section className="guide-hero"><span className="hero-label"><PawPrint size={21} /> はじめての方へ</span><h1>里親になるまでの流れ</h1><p>焦らず、確かめながら。ペットと家族の双方が安心できる譲渡を進めるための手順です。</p></section>
    <main className="guide-main">
      <section className="guide-process"><span className="section-kicker">4 STEPS</span><h2>相談から正式譲渡まで</h2><div className="guide-step-list">{steps.map((step, index) => { const Icon = step.icon; return <article key={step.title}><span className="guide-step-number">{index + 1}</span><span className="guide-step-art" aria-hidden="true"><Icon size={68} strokeWidth={1.65} /></span><div><h3>{step.title}</h3><p>{step.text}</p></div></article>; })}</div></section>

      <section className="screening-guide"><div><span className="section-kicker light">事前アンケートと確認</span><h2>細かな質問には理由があります</h2><p>申込み後は、ペットが新しい家庭で安全に暮らせるかを確認するため、次のような情報を伺います。PawMatchは回答を整理し、確認漏れや次の対応を担当者へ提示します。</p></div><div className="screening-topics">{["本人・家族構成", "住居と飼育スペース", "留守時間と世話の担当", "飼育経験・先住ペット", "動物病院と健康管理", "緊急時・将来の飼育計画"].map(item => <span key={item}><CheckCircle2 />{item}</span>)}</div><p className="human-decision-note"><ShieldCheck />システムが自動で合否を決めることはありません。譲渡者・審査担当者が対話と確認をもとに最終判断します。</p></section>


      <section className="safety-guide"><AlertTriangle size={34} /><div><h2>トラブルを防ぐために</h2><ul><li>個人情報やメッセージの内容を送信前に確認する</li><li>本人確認を行い、譲渡誓約書を双方で保管する</li><li>対面でペットを受け渡し、輸送業者だけに任せない</li><li>高額な費用やサイト外での有償譲渡を持ちかけられたら中止する</li></ul></div></section>
      <div className="guide-cta"><h2>準備ができたら、家族を探しに行きましょう。</h2><Link href="/pets" className="public-primary">里親募集中の子を見る <ArrowRight /></Link></div>
      <p className="privacy-note">図はSVGアイコンです。このページは研究用モックの案内であり、実際の譲渡や本人確認は行いません。</p>
    </main>
  </div>;
}
