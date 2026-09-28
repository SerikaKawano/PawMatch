import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePageAccess } from "@/lib/access-control";
import { getApplicants, getPets } from "@/lib/repository";
import { getConsultations } from "@/lib/consultations";
import { ConsultationForm } from "@/components/ConsultationForm";
import { ConsultationHistory } from "@/components/ConsultationHistory";
import { uiCopy } from "@/lib/ui-copy";
import { findPetByRouteKey, isCanonicalPetRoute, petConsultPath } from "@/lib/pet-routes";

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pet = findPetByRouteKey(await getPets(), id);
  if (!pet) notFound();
  if (!isCanonicalPetRoute(pet, id)) redirect(petConsultPath(pet));
  const user = await requirePageAccess("consult", petConsultPath(pet));

  const [records, applications] = await Promise.all([getConsultations(user.id, pet.id), getApplicants(pet.id)]);
  return <div className="consultation-page">
    <h1>{uiCopy.contactPet(pet.name)}</h1>
    <p>{pet.breed} · {pet.age} · {pet.location}</p>
    <ConsultationForm petId={pet.id} listingNumber={pet.listingNumber} userEmail={user.email} />
    <ConsultationHistory records={records} names={{ [pet.id]: pet.name }} applications={applications.filter(application => application.userId === user.id)} />
    <Link href="/adopter/history">相談・申込履歴ですべての相談を見る →</Link>
  </div>;
}
