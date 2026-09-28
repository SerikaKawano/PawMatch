import { redirect } from "next/navigation";
import { requirePageAccess } from "@/lib/access-control";
import { getAllConsultations } from "@/lib/consultations";
import { demoUsers } from "@/lib/demoUsers";
import { getPets } from "@/lib/repository";
import { ConsultationTriage } from "@/components/ConsultationTriage";
import { getPendingIdentityProfiles } from "@/lib/adopter-profile";
import { IdentityReviewQueue } from "@/components/IdentityReviewQueue";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ConsultationQueuePage() {
  const user = await requirePageAccess("review", "/reviews/consultations");
  if (user.role !== "reviewer" && user.role !== "admin") redirect("/access-denied");
  const [records, pets, pendingIdentities] = await Promise.all([getAllConsultations(), getPets(), getPendingIdentityProfiles()]);
  return <div className="page-wrap consultation-queue-page"><div className="role-page-actions"><Link href="/reviews/adopters" className="task-secondary">里親希望者のプロファイル・書類を見る →</Link></div><ConsultationTriage initialRecords={records} names={Object.fromEntries(pets.map(pet => [pet.id, pet.name]))} applicants={Object.fromEntries(demoUsers.map(item => [item.id, item.name]))} /><IdentityReviewQueue initialProfiles={pendingIdentities} /></div>;
}
