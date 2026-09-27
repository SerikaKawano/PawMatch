import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, CalendarDays, CheckCircle2, FileWarning, HeartHandshake, Mail, ShieldAlert } from "lucide-react";
import { getApplicants, getPets } from "@/lib/repository";
import { selectRecords } from "@/lib/record-filters";
import { visibleApplications } from "@/lib/ownership";
import type { DemoUser } from "@/lib/demoUsers";


const configurations: Record<string, { title: string; description: string; icon: typeof Building2 }> = {
  organizations: { title: "登録団体", description: "登録済みの保護団体・NPOと確認状況です。", icon: Building2 },
  screening: { title: "審査中の申込み", description: "正式譲渡までの審査工程にある申込みです。", icon: HeartHandshake },
  adoptions: { title: "譲渡へ進める判断", description: "担当者が正式譲渡へ進めると記録した合成ケースです。", icon: CheckCircle2 },
  attention: { title: "要確認の申込み", description: "重要度の高い確認ポイントが残っている申込みです。", icon: ShieldAlert },
  pending: { title: "確認待ちの項目", description: "情報なし、または確認待ちの項目がある申込みです。", icon: FileWarning },
  meetings: { title: "面談予定", description: "面談・住環境確認が予定されている申込みです。", icon: CalendarDays },
  trials: { title: "トライアル中", description: "相性と飼育状況を確認しているケースです。", icon: HeartHandshake },
  "my-applications": { title: "申込み状況", description: "里親希望者として送信した申込みの進捗です。", icon: HeartHandshake },
  messages: { title: "メッセージ", description: "譲渡者とのやり取りを確認できます。", icon: Mail },
};
const organizations = ["しあわせ動物ネット", "北のいのち保護会", "みちのくアニマルサポート", "東京ねこ家族", "湘南ドッグレスキュー", "信州いのちの会", "東海ペットネット", "京都アニマルホーム", "瀬戸内保護猫の会", "四国わんにゃんネット", "九州アニマルリンク", "沖縄いのちの輪"];

export async function RecordsList({ view, user }: { view: string; user: DemoUser }) {
  const config = configurations[view] ?? configurations.screening;
  const Icon = config.icon;
  const [allApplications, pets] = await Promise.all([getApplicants(), getPets()]);
  const applications = visibleApplications(user, allApplications, pets);
  const records = selectRecords(view, applications);
  return <div className="records-page"><Link href="/dashboard" className="back-link"><ArrowLeft /> ダッシュボードへ戻る</Link><header className="records-header"><span><Icon /></span><div><span className="section-kicker">集計の内訳</span><h1>{config.title}</h1><p>{config.description}</p></div></header>
    {view === "organizations" ? <section className="organization-record-grid">{organizations.map((name,index) => <article key={name}><span className="organization-record-avatar"><Building2 /></span><div><h2>{name}</h2><p>{index % 3 === 0 ? "NPO法人" : index % 3 === 1 ? "任意団体" : "個人保護活動者"} ・ {index % 2 ? "関東" : "全国"}</p><small><CheckCircle2 />活動実績・連絡先確認済み</small></div><Link href="/admin/analytics" aria-label={`${name}の活動履歴を見る`}><ArrowRight /></Link></article>)}</section> : <section className="record-table"><div className="record-row heading"><span>受付日</span><span>応募者</span><span>対象</span><span>現在の工程</span><span>確認内容</span><span /></div>{records.map(item => <Link href={`/reviews/${item.id}`} className="record-row" key={item.id}><span>{item.submittedAt}</span><strong>{item.name}</strong><span>{pets.find(pet => pet.id === item.petId)?.name}</span><span className="history-stage">{view === "adoptions" ? "譲渡へ進める判断" : {screening:"申込み受付",risk_review:"適合性確認",verification:"書類確認",meeting:"面談・住環境",trial:"トライアル",final_review:"最終判断"}[item.stage]}</span><span>{view === "messages" ? "新着メッセージあり" : view === "adoptions" ? "担当者の判断記録あり" : `${item.risks.length}件の確認ポイント`}</span><ArrowRight /></Link>)}</section>}
    {view !== "organizations" && records.length === 0 && <p className="research-empty">該当する記録はまだありません。</p>}<p className="privacy-note">この一覧は研究評価用の合成データです。実在する人物・団体の情報ではありません。</p></div>;
}
