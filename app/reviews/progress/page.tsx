import { requirePageAccess } from "@/lib/access-control";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, FileWarning } from "lucide-react";
import { getApplicants, getPets } from "@/lib/repository";
import { visibleApplications, visiblePets } from "@/lib/ownership";
import type { ReviewStage } from "@/lib/types";
export const dynamic = "force-dynamic";

const stages: { id: ReviewStage; short: string }[] = [
  { id: "screening", short: "受付" }, { id: "risk_review", short: "適合性" }, { id: "verification", short: "確認状況" },
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
    <Link href="/reviews" className="back-link"><ArrowLeft /> 審査一覧へ戻る</Link>
    <header className="progress-board-header"><div><span className="section-kicker">REVIEW PIPELINE</span><h1>審査進捗ボード</h1><p>1審査を1行で表示し、受付から最終判断までの現在地を横方向に確認できます。</p></div><span><ClipboardList />全 {applications.length}件</span></header>
    <form className="pipeline-filter" action="/reviews/progress"><label htmlFor="progress-pet">対象のペット</label><select id="progress-pet" name="pet" defaultValue={selectedPet?.id ?? ""}><option value="">すべてのペット</option>{pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select><button type="submit" className="task-secondary">この条件で表示</button>{selectedPet && <Link href="/reviews/progress">すべてに戻す</Link>}</form>
    <div className="pipeline-legend"><span><i className="complete" />通過済み</span><span><i className="current" />現在地</span><span><i className="upcoming" />未着手</span><p>各行を選択すると審査ワークフローを開きます。</p></div>
    <section className="pipeline-board" aria-label="申込み審査の進捗一覧">
      <div className="pipeline-row pipeline-heading"><span>申込み</span><span>対象</span>{stages.map(stage => <span key={stage.id}>{stage.short}</span>)}<span>確認</span><span>次の操作</span></div>
      {applications.map(application => {
        const current = stages.findIndex(stage => stage.id === application.stage);
        const pending = Object.values(application.verification).filter(value => value !== "verified").length;
        return <Link href={`/reviews/${application.id}`} className="pipeline-row" key={application.id}>
          <span className="pipeline-applicant"><strong>{application.name}</strong><small>{application.submittedAt}</small></span>
          <span className="pipeline-pet">{pets.find(pet => pet.id === application.petId)?.name}</span>
          {stages.map((stage,index) => <span key={stage.id} className={`pipeline-stage ${index < current ? "complete" : index === current ? "current" : "upcoming"}`}><i>{index < current ? <CheckCircle2 /> : index + 1}</i><b>{index < current ? "通過済み" : index === current ? "現在" : "—"}</b>{index < stages.length - 1 && <ArrowRight className="pipeline-arrow" />}</span>)}
          <span className={`pipeline-alert ${pending || application.risks.length ? "has-alert" : ""}`}>{pending ? <><FileWarning />未確認 {pending}</> : application.risks.length ? <><AlertTriangle />確認 {application.risks.length}</> : <><CheckCircle2 />確認済み</>}</span>
          <span className="pipeline-open">この審査を開く <ArrowRight size={18} /></span>
        </Link>;
      })}
    </section>
    <p className="privacy-note">進捗・人物・ペットはすべて研究評価用の合成データです。</p>
  </div>;
}
