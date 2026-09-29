import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { requirePageAccess } from "@/lib/access-control";
import { getAllConsultations } from "@/lib/consultations";
import { demoUsers } from "@/lib/demoUsers";
import { visiblePets } from "@/lib/ownership";
import { getApplicants, getPets } from "@/lib/repository";
import { groupConsultations } from "@/lib/consultation-groups";

export const dynamic = "force-dynamic";

export default async function RehomerConsultationsPage() {
  const user = await requirePageAccess("rehome", "/rehoming/consultations");
  const [allPets, allConsultations, applications] = await Promise.all([getPets(), getAllConsultations(), getApplicants()]);
  const pets = visiblePets(user, allPets);
  const petNames = new Map(pets.map(pet => [pet.id, pet.name]));
  const consultations = allConsultations.filter(item => petNames.has(item.petId));
  const consultationGroups = groupConsultations(consultations, applications);

  const reviewConsultations = consultationGroups.filter(item => item.application);
  const enquiryConsultations = consultationGroups.filter(item => !item.application);
  const renderRows = (items: typeof consultationGroups) => <div className="rehomer-consultation-list">{items.map(item => {
    const applicant = demoUsers.find(account => account.id === item.userId);
    const decision = item.application?.review?.decisionRecorded ? item.application.review.decision : null;
    const statusLabel = decision === "decline" ? "今回は見送り" : decision === "approve" ? "譲渡済" : decision === "hold" ? "追加確認・保留" : item.application ? "審査中" : item.status === "closed" ? "相談終了" : item.status === "profile_requested" ? "審査準備中" : "相談対応中";
    const statusClass = decision === "decline" ? "closed" : decision === "approve" ? "profile_requested" : item.status;
    return <Link key={item.key} href={`/consultations/${item.representative.id}`} className="rehomer-consultation-row">
      <MessageCircle aria-hidden="true" />
      <span><strong>{petNames.get(item.petId)}への相談</strong><small>相談者：{applicant?.name ?? "里親希望者"} · 最終更新 {new Date(item.latestAt).toLocaleDateString("ja-JP")}{item.records.length > 1 ? ` · ${item.records.length}件を統合` : ""}</small></span>
      <span className={`consultation-status ${statusClass}`}>{statusLabel}</span>
      <ArrowRight aria-hidden="true" />
    </Link>;
  })}</div>;

  return <div className="page-wrap rehomer-consultations-page">
    {reviewConsultations.length > 0 && <section className="rehomer-consultation-group"><h2>審査へ進んだ相談 <span>{reviewConsultations.length}件</span></h2>{renderRows(reviewConsultations)}</section>}
    {enquiryConsultations.length > 0 && <section className="rehomer-consultation-group"><h2>審査前の相談 <span>{enquiryConsultations.length}件</span></h2>{renderRows(enquiryConsultations)}</section>}
    {!consultationGroups.length && <p className="consultation-empty">届いた相談はまだありません。</p>}
  </div>;
}
