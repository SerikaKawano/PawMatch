import { requirePageAccess } from "@/lib/access-control";
import { getConsultations } from "@/lib/consultations";
import { getApplicants, getPets } from "@/lib/repository";
import { ConsultationHistory } from "@/components/ConsultationHistory";
import { stageLabels } from "@/lib/review-labels";
export const dynamic = "force-dynamic";

export default async function AdopterHistoryPage() {
  const user = await requirePageAccess("consult", "/adopter/history");
  const [consultations, allApplications, pets] = await Promise.all([getConsultations(user.id), getApplicants(), getPets()]);
  const applications = allApplications.filter(application => application.userId === user.id);
  const names = Object.fromEntries(pets.map(pet => [pet.id, pet.name]));
  return <div className="dashboard-page adopter-home adopter-history-page">
    <ConsultationHistory records={consultations} names={names} applications={applications} title="相談・申込履歴" />
    <section className="adopter-application-history"><h2>審査の進捗</h2>{applications.length ? <ul>{applications.map(application => <li key={application.id}><strong>{names[application.petId] ?? application.petId}</strong><span className={`application-stage ${application.review?.decisionRecorded && application.review.decision === "decline" ? "stopped" : application.review?.decisionRecorded && application.review.decision === "approve" ? "done" : "active"}`}>{application.review?.decisionRecorded ? application.review.decision === "approve" ? "譲渡へ進める判断" : application.review.decision === "decline" ? "今回は見送り" : "追加確認中" : stageLabels[application.stage]}</span><small>{`申込日：${application.submittedAt}`}</small></li>)}</ul> : <p>審査中の申込みはありません。</p>}</section>
  </div>;
}
