import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/access-control";
import { getApplicants, getPets } from "@/lib/repository";
import { getConsultations } from "@/lib/consultations";
import { ConsultationForm } from "@/components/ConsultationForm";
import { ConsultationHistory } from "@/components/ConsultationHistory";
import { uiCopy } from "@/lib/ui-copy";

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageAccess("consult", "/pets/" + id + "/consult");
  const pet = (await getPets()).find(item => item.id === id);
  if (!pet) notFound();

  const [records, applications] = await Promise.all([getConsultations(user.id, id), getApplicants(id)]);
  return <div className="consultation-page">
    <Link className="back-link" href={`/pets/${id}`}>← {pet.name}の詳細へ戻る</Link>
    <h1>{uiCopy.contactPet(pet.name)}</h1>
    <p>{pet.breed} · {pet.age} · {pet.location}</p>
    <ConsultationForm petId={id} userEmail={user.email} />
    <ConsultationHistory records={records} names={{ [id]: pet.name }} applications={applications.filter(application => application.userId === user.id)} />
    <Link href="/adopter/history">相談・申込履歴ですべての相談を見る →</Link>
  </div>;
}
