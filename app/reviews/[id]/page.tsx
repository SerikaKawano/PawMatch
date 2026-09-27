import { requirePageAccess } from "@/lib/access-control";
import { notFound } from "next/navigation";
import { ApplicationReviewProcess } from "@/components/ApplicationReviewProcess";
import { getApplicants, getPets } from "@/lib/repository";
import { visibleApplications } from "@/lib/ownership";
import { listAdopterDocuments } from "@/lib/adopter-documents";
import { requestsForApplication } from "@/lib/document-requests";
import { demoUsers } from "@/lib/demoUsers";
export const dynamic = "force-dynamic";

export default async function ApplicationReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageAccess("review", "/reviews/progress");
  const { id } = await params;
  const [allApplications, pets] = await Promise.all([getApplicants(), getPets()]);
  const applications = visibleApplications(user, allApplications, pets);
  const application = applications.find(item => item.id === id);
  if (!application) notFound();
  const pet = pets.find(item => item.id === application.petId);
  if (!pet) notFound();
  const [documents, requests] = await Promise.all([application.userId ? listAdopterDocuments(application.userId) : [], requestsForApplication(id)]);
  const owner=demoUsers.find(person=>person.id===pet.ownerId);
  return <div className="page-wrap review-process-page"><ApplicationReviewProcess application={application} pet={pet} role={user.role} ownerName={owner?.name??"未登録"} canInspectAdopter={Boolean(application.userId)} initialDocuments={documents} initialRequests={requests} /></div>;
}
