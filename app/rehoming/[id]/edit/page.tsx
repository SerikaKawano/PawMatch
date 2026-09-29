import { redirect } from "next/navigation";

import { PetListingForm } from "@/components/PetListingForm";
import { requirePageAccess } from "@/lib/access-control";
import { getApplicants, getPets } from "@/lib/repository";

export default async function EditPetListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageAccess("rehome", `/rehoming/${id}/edit`);
  if (user.role !== "rehomer") redirect("/access-denied");
  const [pets, applications] = await Promise.all([getPets(), getApplicants()]);
  const pet = pets.find(item => item.id === id && item.ownerId === user.id && item.listingStatus !== "stopped");
  if (!pet) redirect("/rehoming");
  if (applications.some(item => item.petId === pet.id && item.review && !item.review.decisionRecorded)) redirect("/rehoming");
  return <div className="page-wrap pet-listing-page"><PetListingForm initialPet={pet} /></div>;
}
