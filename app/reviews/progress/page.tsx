import { requirePageAccess } from "@/lib/access-control";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, XCircle } from "lucide-react";
import { getApplicants, getPets } from "@/lib/repository";
import { visibleApplications, visiblePets } from "@/lib/ownership";
import type { ReviewStage } from "@/lib/types";
import { reviewStageDescriptions } from "@/lib/review-labels";
import { demoUsers } from "@/lib/demoUsers";

export const dynamic = "force-dynamic";

const stages: { id: ReviewStage; short: string }[] = [
  { id: "screening", short: "受付" }, { id: "risk_review", short: "適合性" }, { id: "verification", short: "書類確認" },
  { id: "meeting", short: "面談" }, { id: "trial", short: "トライアル" }, { id: "final_review", short: "最終判断" },
];
type ProgressFilters = { pet?: string; owner?: string; stage?: string; filtered?: string; hideDeclined?: string; hideAdopted?: string };

export default async function ReviewProgressPage({ searchParams }: { searchParams: Promise<ProgressFilters> }) {
  const user = await requirePageAccess("review", "/reviews/progress");
  const filters = await searchParams;
  const [allCases, allPets] = await Promise.all([getApplicants(), getPets()]);
  const pets = visiblePets(user, allPets);
  const allApplications = visibleApplications(user, allCases, allPets);
  const owners = [...new Set(pets.map(pet => pet.ownerId))].map(id => demoUsers.find(person => person.id === id)).filter(person => person !== undefined);
  const selectedPet = pets.find(pet => pet.id === filters.pet);
  const selectedOwner = owners.find(owner => owner.id === filters.owner);
  const selectedStage = stages.find(stage => stage.id === filters.stage);
  const submitted = filters.filtered === "1";
  const hideDeclined = !submitted || filters.hideDeclined === "1";
  const hideAdopted = !submitted || filters.hideAdopted === "1";
  const applications = allApplications.filter(application => {
    const pet = pets.find(item => item.id === application.petId);
    if (selectedPet && application.petId !== selectedPet.id) return false;
    if (selectedOwner && pet?.ownerId !== selectedOwner.id) return false;
    if (selectedStage && application.stage !== selectedStage.id) return false;
    if (hideDeclined && application.review?.decisionRecorded && application.review.decision === "decline") return false;
    if (hideAdopted && application.review?.decisionRecorded && application.review.decision === "approve") return false;
    return true;
  });

  return <div className="progress-board-page">
    <header className="progress-board-header progress-board-count"><span><ClipboardList />表示 {applications.length}件</span></header>
    <form className="pipeline-filter" action="/reviews/progress">
      <input type="hidden" name="filtered" value="1" />
      <label htmlFor="progress-owner">対象の譲渡者・団体<select id="progress-owner" name="owner" defaultValue={selectedOwner?.id ?? ""}><option value="">すべての譲渡者・団体</option>{owners.map(owner => <option key={owner.id} value={owner.id}>{owner.kind === "organization" ? owner.organization : owner.name}</option>)}</select></label>
      <label htmlFor="progress-pet">対象のペット<select id="progress-pet" name="pet" defaultValue={selectedPet?.id ?? ""}><option value="">すべてのペット</option>{pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label>
      <label htmlFor="progress-stage">フェーズ<select id="progress-stage" name="stage" defaultValue={selectedStage?.id ?? ""}><option value="">すべてのフェーズ</option>{stages.map(stage => <option key={stage.id} value={stage.id}>{stage.short}</option>)}</select></label>
      <div className="pipeline-filter-checks">
        <label><input type="checkbox" name="hideDeclined" value="1" defaultChecked={hideDeclined} />見送り済を非表示</label>
        <label><input type="checkbox" name="hideAdopted" value="1" defaultChecked={hideAdopted} />譲渡済を非表示</label>
      </div>
      <button type="submit" className="task-secondary">この条件で表示</button>
    </form>
    <div className="pipeline-legend"><span><i className="complete" />完了</span><span><i className="current" />現在地</span><span><i className="stopped" />見送り</span><span><i className="upcoming" />未着手</span><p>各行を選択すると審査ワークフローを開きます。</p></div>
    <details className="pipeline-help"><summary>各工程で確認すること</summary><div className="pipeline-help-grid">
      {stages.map(stage => <p key={stage.id}><strong>{stage.short}</strong>{reviewStageDescriptions[stage.id]}</p>)}
    </div></details>
    <section className="pipeline-board" aria-label="申込み審査の進捗一覧">
      <div className="pipeline-row pipeline-heading"><span>譲渡者・団体</span><span>対象のペット</span><span>申込者</span>{stages.map(stage => <span key={stage.id}>{stage.short}</span>)}<span>自動チェック</span><span aria-label="開く" /></div>
      {applications.map(application => {
        const current = stages.findIndex(stage => stage.id === application.stage);
        const pending = Object.values(application.verification).filter(value => value !== "verified").length;
        const needsAttention = pending > 0 || application.risks.length > 0;
        const automatedCheckLabel = needsAttention ? "自動チェック：要確認" : "自動チェック：OK";
        const declined = application.review?.decisionRecorded && application.review.decision === "decline";
        const adopted = application.review?.decisionRecorded && application.review.decision === "approve";
        const pet = pets.find(item => item.id === application.petId);
        const owner = demoUsers.find(person => person.id === pet?.ownerId);
        return <Link href={`/reviews/${application.id}`} className="pipeline-row" key={application.id}>
          <span className="pipeline-owner"><strong>{owner?.kind === "organization" ? owner.organization : owner?.name ?? "未登録"}</strong><small>{owner?.kind === "organization" ? owner.name : "個人譲渡者"}</small></span>
          <span className="pipeline-pet">{pet?.name}</span>
          <span className="pipeline-applicant"><strong>{application.name}</strong><small>{application.submittedAt}</small></span>
          {stages.map((stage, index) => <span key={stage.id} className={`pipeline-stage ${index < current ? "complete" : index === current ? declined ? "stopped" : "current" : "upcoming"}`}><i>{index < current ? <CheckCircle2 /> : index === current && declined ? <XCircle /> : index + 1}</i><b>{index < current ? "完了" : index === current ? declined ? "見送り" : adopted ? "譲渡済" : "現在" : "—"}</b>{index < stages.length - 1 && <ArrowRight className="pipeline-arrow" />}</span>)}
          <span className={`pipeline-alert ${needsAttention ? "has-alert" : ""}`} role="img" aria-label={automatedCheckLabel} title={automatedCheckLabel}>
            {needsAttention ? <AlertTriangle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
          </span>
          <span className="pipeline-open">開く <ArrowRight size={18} /></span>
        </Link>;
      })}
      {!applications.length && <p className="pipeline-empty">条件に一致する申込みはありません。</p>}
    </section>
  </div>;
}
