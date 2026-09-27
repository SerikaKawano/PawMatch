import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { requirePageAccess } from "@/lib/access-control";
import { getAllConsultations } from "@/lib/consultations";
import { linkedApplication } from "@/lib/consultation-journey";
import { demoUsers } from "@/lib/demoUsers";
import { visiblePets } from "@/lib/ownership";
import { getApplicants, getPets } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function RehomerConsultationsPage() {
  const user = await requirePageAccess("rehome", "/rehoming/consultations");
  const [allPets, allConsultations, applications] = await Promise.all([getPets(), getAllConsultations(), getApplicants()]);
  const pets = visiblePets(user, allPets);
  const petNames = new Map(pets.map(pet => [pet.id, pet.name]));
  const consultations = allConsultations.filter(item => petNames.has(item.petId));

  const reviewConsultations = consultations.filter(item => linkedApplication(item, applications));
  const enquiryConsultations = consultations.filter(item => !linkedApplication(item, applications));
  const renderRows = (items: typeof consultations) => <div className="rehomer-consultation-list">{items.map(item => {
    const applicant = demoUsers.find(account => account.id === item.userId);
    const application = linkedApplication(item, applications);
    return <Link key={item.id} href={`/consultations/${item.id}`} className="rehomer-consultation-row">
      <MessageCircle aria-hidden="true" />
      <span><strong>{petNames.get(item.petId)}への相談</strong><small>相談者：{applicant?.name ?? "里親希望者"} · {new Date(item.createdAt).toLocaleDateString("ja-JP")}</small></span>
      <span className={`consultation-status ${item.status ?? "received"}`}>{application ? "審査中" : item.status === "closed" ? "相談終了" : item.status === "profile_requested" ? "審査準備中" : "担当者返信待ち"}</span>
      <ArrowRight aria-hidden="true" />
    </Link>;
  })}</div>;

  return <div className="page-wrap rehomer-consultations-page">
    <header className="role-page-heading"><p>掲載ペットに届いた相談の内容と、その後の対応状況を確認できます。</p></header>
    {reviewConsultations.length > 0 && <section className="rehomer-consultation-group"><h2>審査へ進んだ相談 <span>{reviewConsultations.length}件</span></h2>{renderRows(reviewConsultations)}</section>}
    {enquiryConsultations.length > 0 && <section className="rehomer-consultation-group"><h2>審査前の相談 <span>{enquiryConsultations.length}件</span></h2>{renderRows(enquiryConsultations)}</section>}
    {!consultations.length && <p className="consultation-empty">届いた相談はまだありません。</p>}
  </div>;
}
