import { requirePageAccess } from "@/lib/access-control";
import { notFound } from "next/navigation";
import { ApplicationReviewProcess } from "@/components/ApplicationReviewProcess";
import { getApplicants, getPets } from "@/lib/repository";
import { visibleApplications } from "@/lib/ownership";
export const dynamic = "force-dynamic";

export default async function ApplicationReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageAccess("review", "/reviews");
  const { id } = await params;
  const [allApplications, pets] = await Promise.all([getApplicants(), getPets()]);
  const applications = visibleApplications(user, allApplications, pets);
  const application = applications.find(item => item.id === id);
  if (!application) notFound();
  const pet = pets.find(item => item.id === application.petId);
  if (!pet) notFound();
  return <div className="page-wrap review-process-page"><ApplicationReviewProcess application={application} pet={pet} isAdmin={user.id === "admin"} canInspectAdopter={Boolean(application.userId)} /></div>;
}
