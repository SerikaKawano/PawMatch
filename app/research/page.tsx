import Link from "next/link";
import { ArrowRight, ClipboardCheck, MessageSquareText, ShieldCheck } from "lucide-react";
import { requirePageAccess } from "@/lib/access-control";
import { getResearch } from "@/lib/research/store";
export const dynamic = "force-dynamic";

const stages = ["申込み受付", "初期確認", "適合性とリスク", "書類確認・連絡", "面談・トライアル", "最終記録"];

export default async function ResearchPage() {
  await requirePageAccess("admin", "/research");
  const { config } = await getResearch();
  return <div className="research-page">
    <section className="research-card"><h2>各工程で、必要な判断ができるか</h2><p>5名の成人に評価ケースを見てもらい、操作時間ではなく、理解・有用性・誤解の理由を確認する形成的評価です。</p></section>
    <section className="research-card"><h2>評価の進め方</h2><div className="formative-steps"><article><ClipboardCheck /><strong>1. 同意とケース</strong><p>口頭またはEメールで同意を得た後、2種類の評価ケースを提示します。</p></article><article><ShieldCheck /><strong>2. 6工程を確認</strong><p>各工程の状態、未確認事項、次に誰が何を確認するかを説明してもらいます。</p></article><article><MessageSquareText /><strong>3. 点数と意見</strong><p>各工程で分かりやすさ・有用性・未確認事項への自信を1～5点で尋ね、理由を記録します。</p></article></div><p>少人数のため、平均点だけで結論を出さず、回答分布・観察した誤解・少数意見・設計変更案を工程ごとに示します。実際の審査時間や譲渡件数への効果は主張しません。</p></section>
    <section className="research-card"><h2>評価する工程</h2><ol className="formative-stage-list">{stages.map(stage => <li key={stage}>{stage}</li>)}</ol><p>重要な確認事項が抜けていないか、点数を合否と誤認していないかも観察します。</p></section>
    <div className="research-actions"><Link className="primary-button" href="/research/setup">審査項目と重みを確認 <ArrowRight /></Link><Link className="secondary-button" href="/admin/analytics">累積・履歴分析を見る <ArrowRight /></Link></div>
    <p className="research-notice">現在の配点設定は v{config.version}。テスト参加者の実回答はまだ入力されていません。既存の旧A/B比較データは今回の形成的評価の結果として使用しません。</p>
  </div>;
}
