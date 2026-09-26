import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/access-control";
import { getPets } from "@/lib/repository";
import { getConsultations } from "@/lib/consultations";
import { ConsultationForm } from "@/components/ConsultationForm";
import { ConsultationHistory } from "@/components/ConsultationHistory";

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageAccess("consult", "/pets/" + id + "/consult");
  const pet = (await getPets()).find(item => item.id === id);
  if (!pet) notFound();

  const records = await getConsultations(user.id, id);
  return <div className="consultation-page">
    <Link className="back-link" href={`/pets/${id}`}>← {pet.name}の詳細へ戻る</Link>
    <span className="section-kicker">譲渡についてのご相談</span>
    <h1>{pet.name}との暮らしに向けて</h1>
    <p>{pet.breed} · {pet.age} · {pet.location}</p>
    <ConsultationForm petId={id} petName={pet.name} userName={user.name} />
    <ConsultationHistory records={records} names={{ [id]: pet.name }} />
    <Link href="/dashboard#consultations">マイページですべての相談を見る →</Link>
  </div>;
}
