import { requirePageAccess } from "@/lib/access-control";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, FileWarning } from "lucide-react";
import { getApplicants, getPets } from "@/lib/repository";
import { visibleApplications, visiblePets } from "@/lib/ownership";
import type { ReviewStage } from "@/lib/types";
export const dynamic = "force-dynamic";

const stages: { id: ReviewStage; short: string }[] = [
  { id: "screening", short: "受付" }, { id: "risk_review", short: "適合性" }, { id: "verification", short: "書類確認" },
  { id: "meeting", short: "面談" }, { id: "trial", short: "トライアル" }, { id: "final_review", short: "最終判断" },
];

export default async function ReviewProgressPage({ searchParams }: { searchParams: Promise<{ pet?: string }> }) {
  const user = await requirePageAccess("review", "/reviews/progress");
  const filters = await searchParams;
  const [allCases, allPets] = await Promise.all([getApplicants(), getPets()]);
  const pets = visiblePets(user, allPets);
  const allApplications = visibleApplications(user, allCases, allPets);
  const selectedPet = pets.find(pet => pet.id === filters.pet);
  const applications = selectedPet ? allApplications.filter(application => application.petId === selectedPet.id) : allApplications;
  return <div className="progress-board-page">
    <header className="progress-board-header"><div><p>受付から最終判断までの進捗を一目で確認できます。</p></div><span><ClipboardList />全 {applications.length}件</span></header>
    <form className="pipeline-filter" action="/reviews/progress"><label htmlFor="progress-pet">対象のペット</label><select id="progress-pet" name="pet" defaultValue={selectedPet?.id ?? ""}><option value="">すべてのペット</option>{pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select><button type="submit" className="task-secondary">この条件で表示</button></form>
    <div className="pipeline-legend"><span><i className="complete" />完了</span><span><i className="current" />現在地</span><span><i className="upcoming" />未着手</span><p>各行を選択すると審査ワークフローを開きます。</p></div>
    <details className="pipeline-help"><summary>各工程で確認すること</summary><div className="pipeline-help-grid">
      <p><strong>受付</strong>申込者のプロフィールを表示します。ここでの操作はありません。</p>
      <p><strong>適合性</strong>ペットに必要なケアと希望者の計画を照らし、重要な不一致や質問を整理します。</p>
      <p><strong>書類確認</strong>提出済み書類と本人確認、住居の飼育許可、同居者の同意などの状態を記録します。</p>
      <p><strong>面談</strong>会話や住環境を通して、実際のお世話の体制を確かめます。</p>
      <p><strong>トライアル</strong>一定期間一緒に暮らし、ケアの継続や相性を確認します。</p>
      <p><strong>最終判断</strong>残る確認事項と双方の合意を踏まえ、担当者が理由を記録します。</p>
    </div></details>
    <section className="pipeline-board" aria-label="申込み審査の進捗一覧">
      <div className="pipeline-row pipeline-heading"><span>対象のペット</span><span>申込者</span>{stages.map(stage => <span key={stage.id}>{stage.short}</span>)}<span>確認</span><span aria-label="開く" /></div>
      {applications.map(application => {
        const current = stages.findIndex(stage => stage.id === application.stage);
        const pending = Object.values(application.verification).filter(value => value !== "verified").length;
        const declined = application.review?.decisionRecorded && application.review.decision === "decline";
        return <Link href={`/reviews/${application.id}`} className="pipeline-row" key={application.id}>
          <span className="pipeline-pet">{pets.find(pet => pet.id === application.petId)?.name}</span>
          <span className="pipeline-applicant"><strong>{application.name}</strong><small>{application.submittedAt}</small></span>
          {stages.map((stage,index) => <span key={stage.id} className={`pipeline-stage ${index < current ? "complete" : index === current ? declined ? "stopped" : "current" : "upcoming"}`}><i>{index < current ? <CheckCircle2 /> : index + 1}</i><b>{index < current ? "完了" : index === current ? declined ? "見送り" : "現在" : "—"}</b>{index < stages.length - 1 && <ArrowRight className="pipeline-arrow" />}</span>)}
          <span className={`pipeline-alert ${declined || pending || application.risks.length ? "has-alert" : ""}`}>{declined ? <><AlertTriangle />見送り</> : pending ? <><FileWarning />未確認 {pending}</> : application.risks.length ? <><AlertTriangle />確認 {application.risks.length}</> : <><CheckCircle2 />確認済み</>}</span>
          <span className="pipeline-open">開く <ArrowRight size={18} /></span>
        </Link>;
      })}
    </section>
  </div>;
}
