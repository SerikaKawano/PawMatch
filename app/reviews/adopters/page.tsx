import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePageAccess } from "@/lib/access-control";
import { demoUsers } from "@/lib/demoUsers";
import { getAdopterProfile } from "@/lib/adopter-profile";
import { getApplicants, getPets } from "@/lib/repository";
import { stageLabels } from "@/lib/review-store";

export const dynamic = "force-dynamic";

export default async function AdopterRecordsPage() {
  const reviewer = await requirePageAccess("review", "/reviews/adopters");
  if (reviewer.role !== "reviewer" && reviewer.role !== "admin") redirect("/access-denied");
  const adopters = demoUsers.filter(user => user.role === "adopter");
  const [profiles, applications, pets] = await Promise.all([Promise.all(adopters.map(getAdopterProfile)), getApplicants(), getPets()]);
  return <div className="page-wrap adopter-review-page"><div className="adopter-review-list">{profiles.map(profile => {
    const application = applications.find(item => item.userId === profile.userId);
    return <Link href={`/reviews/adopters/${profile.userId}`} key={profile.userId}><strong>{profile.fullName}</strong><span>{profile.region}</span><span className={`identity-state ${profile.identityStatus}`}>{profile.identityStatus === "verified" ? "本人確認済み" : profile.identityStatus === "pending" ? "本人確認待ち" : "本人確認未申請"}</span><span>{application ? `${pets.find(pet => pet.id === application.petId)?.name ?? "ペット"} · ${stageLabels[application.stage]}` : "申込みなし"}</span><b>詳細を見る →</b></Link>;
  })}</div></div>;
}
