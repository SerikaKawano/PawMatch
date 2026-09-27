import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { requirePageAccess } from "@/lib/access-control";
import { getAllConsultations } from "@/lib/consultations";
import { demoUsers } from "@/lib/demoUsers";
import { visiblePets } from "@/lib/ownership";
import { getPets } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function RehomerConsultationsPage() {
  const user = await requirePageAccess("rehome", "/rehoming/consultations");
  const [allPets, allConsultations] = await Promise.all([getPets(), getAllConsultations()]);
  const pets = visiblePets(user, allPets);
  const petNames = new Map(pets.map(pet => [pet.id, pet.name]));
  const consultations = allConsultations.filter(item => petNames.has(item.petId));

  return <div className="page-wrap rehomer-consultations-page">
    <header className="role-page-heading"><p>掲載ペットに届いた相談の内容と、その後の対応状況を確認できます。</p></header>
    <div className="rehomer-consultation-list">{consultations.map(item => {
      const applicant = demoUsers.find(account => account.id === item.userId);
      return <Link key={item.id} href={`/consultations/${item.id}`} className="rehomer-consultation-row">
        <MessageCircle aria-hidden="true" />
        <span><strong>{petNames.get(item.petId)}への相談</strong><small>相談者：{applicant?.name ?? "里親希望者"} · {new Date(item.createdAt).toLocaleDateString("ja-JP")}</small></span>
        <span className={`consultation-status ${item.status ?? "received"}`}>{item.status === "closed" ? "相談終了" : item.status === "profile_requested" ? "事前情報を依頼済み" : "担当者返信待ち"}</span>
        <ArrowRight aria-hidden="true" />
      </Link>;
    })}</div>
    {!consultations.length && <p className="consultation-empty">届いた相談はまだありません。</p>}
  </div>;
}
