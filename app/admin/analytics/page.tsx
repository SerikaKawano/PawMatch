import { requirePageAccess } from "@/lib/access-control";
import Link from "next/link";
import { getApplicants, getPets } from "@/lib/repository";
import { reviewStages, stageLabels } from "@/lib/review-store";
import { getResearch } from "@/lib/research/store";
import { criteria } from "@/lib/research/types";
import { criterionLabels } from "@/lib/research/scoring";
import { getAllConsultations } from "@/lib/consultations";
import { annualAdminMetrics } from "@/lib/admin-metrics";
export const dynamic="force-dynamic";
export default async function AdminAnalyticsPage(){
  await requirePageAccess("admin", "/admin/analytics");
  const [apps,pets,research,consultations]=await Promise.all([getApplicants(),getPets(),getResearch(),getAllConsultations()]);
  const events=apps.flatMap(app=>(app.review?.history??[]).map(event=>({...event,id:app.id,name:app.name}))).sort((a,b)=>b.at.localeCompare(a.at));
  const pending=apps.filter(a=>Object.values(a.verification).some(v=>v!=="verified"));
  const high=apps.filter(a=>a.risks.some(r=>r.severity==="high"));
  const decisions=apps.filter(a=>a.review?.decisionRecorded);
  const metrics=annualAdminMetrics(pets,consultations,apps);
  return <div className="research-page">
    <p className="research-kpi-period">直近1年（{metrics.periodStart.replaceAll("-","/")}～{metrics.periodEnd.replaceAll("-","/")}）</p>
    <div className="research-kpis"><article><strong>{metrics.listedPets}</strong><span>掲載ペット数</span></article><article><strong>{metrics.enquiries}</strong><span>問い合わせ・相談件数</span></article><article><strong>{metrics.reviews}</strong><span>審査まで進んだ件数</span></article><article><strong>{metrics.declined}</strong><span>見送り件数</span></article><article><strong>{metrics.adopted}</strong><span>譲渡完了件数</span></article></div>
    <section className="research-card"><h2>現在の審査点の重み · 設定 v{research.config.version}</h2><p>通常の審査画面は、この設定で参考点を計算します。配点を変えても、担当者が記録した判断は書き換えません。</p><div className="research-table-wrap"><table><thead><tr><th>確認項目</th><th>現在の配点</th></tr></thead><tbody>{criteria.map(key=><tr key={key}><th>{criterionLabels[key]}</th><td>{research.config.weights[key]}点</td></tr>)}</tbody></table></div><p>項目の選定には資料を参考にしていますが、この配点は検証前の仮設定です。変更時には理由を記録し、参加者評価の開始前に固定してください。</p><Link className="primary-button" href="/research/setup">配点と変更理由を確認・編集する →</Link></section>
    <section className="research-card"><h2>現在の工程と確認待ち</h2><p><Link className="text-link" href="/admin/records?view=pending">確認待ち {pending.length}件 →</Link> / <Link className="text-link" href="/admin/records?view=attention">重要リスク {high.length}件 →</Link></p><div className="research-table-wrap"><table><thead><tr><th>工程</th><th>件数</th><th>内容</th></tr></thead><tbody>{reviewStages.map(stage=><tr key={stage}><th>{stageLabels[stage]}</th><td>{apps.filter(a=>a.stage===stage).length}</td><td><Link href="/reviews/progress">進捗ボードへ →</Link></td></tr>)}</tbody></table></div><p>工程数は現在地です。経過時間を測る「滞留日数」とは異なります。初期の工程は合成ケースに設定されたものです。</p></section>
    <section className="research-card"><h2>担当者が記録した判断</h2><div className="research-table-wrap"><table><thead><tr><th>判断</th><th>件数</th></tr></thead><tbody>{([["approve","正式譲渡へ進める"],["hold","追加確認・保留"],["decline","今回は見送る"]] as const).map(([value,label])=><tr key={value}><th>{label}</th><td>{decisions.filter(a=>a.review?.decision===value).length}</td></tr>)}</tbody></table></div><p>画面上の判断記録であり、実際の譲渡成立や動物福祉の改善を示す件数ではありません。</p></section>
    <section className="research-card"><h2>保存履歴（新しい順）</h2>{!events.length?<p>まだ操作記録はありません。審査ワークフローで保存すると表示されます。</p>:<div className="research-table-wrap"><table><thead><tr><th>保存日時</th><th>申込み</th><th>操作</th><th>根拠・メモ</th></tr></thead><tbody>{events.map((e,i)=><tr key={i}><td>{e.at.replace("T"," ").slice(0,19)} UTC</td><th><Link href={"/reviews/"+e.id}>{e.name}</Link></th><td>{e.action}</td><td className="preserve-lines">{e.note}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}
