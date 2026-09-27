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
  return <div className="page-wrap consultation-queue-page"><header className="role-page-heading"><span className="section-kicker">審査担当者の操作</span><p>内容を確認して、事前情報の提出へ進めるか、相談を終了するかを記録します。プロフィールが揃う前に適合性の判断はしません。</p><Link href="/reviews/adopters" className="task-secondary">里親希望者のプロフィール・書類を見る →</Link></header><ConsultationTriage initialRecords={records} names={Object.fromEntries(pets.map(pet => [pet.id, pet.name]))} applicants={Object.fromEntries(demoUsers.map(item => [item.id, item.name]))} /><IdentityReviewQueue initialProfiles={pendingIdentities} /></div>;
}
