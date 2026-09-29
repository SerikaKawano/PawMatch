import { redirect } from "next/navigation";
import { PetListingForm } from "@/components/PetListingForm";
import { requirePageAccess } from "@/lib/access-control";

export default async function NewPetListingPage() {
  const user = await requirePageAccess("rehome", "/rehoming/new");
  if (user.role !== "rehomer") redirect("/access-denied");
  return <div className="page-wrap pet-listing-page"><PetListingForm /></div>;
}
