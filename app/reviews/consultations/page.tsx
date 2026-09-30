import { redirect } from "next/navigation";
import { requirePageAccess } from "@/lib/access-control";
import { getAllConsultations } from "@/lib/consultations";
import { demoUsers } from "@/lib/demoUsers";
import { getApplicants, getPets } from "@/lib/repository";
import { groupConsultations } from "@/lib/consultation-groups";
import { ConsultationTriage } from "@/components/ConsultationTriage";
import { getPendingIdentityProfiles } from "@/lib/adopter-profile";
import { IdentityReviewQueue } from "@/components/IdentityReviewQueue";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ConsultationQueuePage() {
  const user = await requirePageAccess("review", "/reviews/consultations");
  if (user.role !== "reviewer" && user.role !== "admin") redirect("/access-denied");
  const [records, pets, applications, pendingIdentities] = await Promise.all([getAllConsultations(), getPets(), getApplicants(), getPendingIdentityProfiles()]);
  const groups = groupConsultations(records, applications);
  return <div className="page-wrap consultation-queue-page"><div className="role-page-actions"><Link href="/reviews/adopters" className="task-secondary">里親希望者のプロファイル・書類を見る →</Link><Link href="/reviews/rehomers" className="task-secondary">譲渡者のプロファイルを見る →</Link></div><ConsultationTriage initialGroups={groups} names={Object.fromEntries(pets.map(pet => [pet.id, pet.name]))} applicants={Object.fromEntries(demoUsers.map(item => [item.id, item.name]))} /><IdentityReviewQueue initialProfiles={pendingIdentities} /></div>;
}
