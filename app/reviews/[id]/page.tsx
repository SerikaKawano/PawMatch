import { requirePageAccess } from "@/lib/access-control";
import { notFound } from "next/navigation";
import { ApplicationReviewProcess } from "@/components/ApplicationReviewProcess";
import { getApplicants, getPets } from "@/lib/repository";
import { visibleApplications } from "@/lib/ownership";
import { listApplicationDocuments } from "@/lib/adopter-documents";
import { requestsForApplication } from "@/lib/document-requests";
import { demoUsers } from "@/lib/demoUsers";
import { getAdopterProfile } from "@/lib/adopter-profile";
export const dynamic = "force-dynamic";

export default async function ApplicationReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageAccess("reviewCase", `/reviews/${id}`);
  const [allApplications, pets] = await Promise.all([getApplicants(), getPets()]);
  const applications = visibleApplications(user, allApplications, pets);
  const application = applications.find(item => item.id === id);
  if (!application) notFound();
  const pet = pets.find(item => item.id === application.petId);
  if (!pet) notFound();
  const adopter=application.userId?demoUsers.find(person=>person.id===application.userId&&person.role==="adopter"):undefined;
  const [documents, requests, adopterProfile] = await Promise.all([listApplicationDocuments(application), requestsForApplication(id), adopter ? getAdopterProfile(adopter) : undefined]);
  const owner=demoUsers.find(person=>person.id===pet.ownerId);
  const ownerProfileHref=(user.role==="reviewer"||user.role==="admin")&&owner?`/reviews/rehomers/${owner.id}`:undefined;
  return <div className="page-wrap review-process-page"><ApplicationReviewProcess application={application} pet={pet} role={user.role} ownerName={owner?.name??"未登録"} ownerProfileHref={ownerProfileHref} canInspectAdopter={Boolean(application.userId)} adopterProfile={adopterProfile} initialDocuments={documents} initialRequests={requests} /></div>;
}
