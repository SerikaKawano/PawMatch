import { requirePageAccess } from "@/lib/access-control";
import { getAdopterProfile } from "@/lib/adopter-profile";
import { listAdopterDocuments } from "@/lib/adopter-documents";
import { requestsForAdopter } from "@/lib/document-requests";
import { AdopterHome } from "@/components/AdopterHome";
export const dynamic = "force-dynamic";

export default async function AdopterProfilePage() {
  const user = await requirePageAccess("consult", "/adopter/profile");
  const [profile, documents, requests] = await Promise.all([getAdopterProfile(user), listAdopterDocuments(user.id), requestsForAdopter(user.id)]);
  return <AdopterHome initialProfile={profile} initialDocuments={documents} initialRequests={requests} />;
}
