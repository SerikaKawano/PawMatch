import Link from "next/link";
import Image from "next/image";

import { getApplicants, getPets } from "@/lib/repository";
import { requirePageAccess } from "@/lib/access-control";
import { visibleApplications, visiblePets } from "@/lib/ownership";
import { demoUsers } from "@/lib/demoUsers";
import { petPath } from "@/lib/pet-routes";
import { ListingManagementActions } from "@/components/ListingManagementActions";

export default async function RehomingPage() {
  const user = await requirePageAccess("rehome", "/rehoming");
  const [allPets, allApplications] = await Promise.all([getPets(), getApplicants()]);
  const pets = visiblePets(user, allPets).filter(pet => pet.listingStatus !== "stopped");
  const applications = visibleApplications(user, allApplications, allPets);
  return <div className="page-wrap">
    {user.role === "rehomer" && <div className="rehoming-create-action"><Link className="task-primary" href="/rehoming/new">新しいペットを掲載する</Link></div>}
    <div className="rehoming-list">{pets.map(pet => {
      const petApplications = applications.filter(item => item.petId === pet.id);
      const hasActiveReview = petApplications.some(item => item.review && !item.review.decisionRecorded);
      return <article key={pet.id}>
      {pet.imageUrl && <Image src={pet.imageUrl} alt={pet.name + "の写真"} width={160} height={160} unoptimized />}
      <div><span className="listing-status">募集中</span><h2>{pet.name}</h2><p>{pet.breed} · {pet.age}</p><p>掲載元：{demoUsers.find(account => account.id === pet.ownerId)?.name}</p><p>届いた里親申込み <strong>{petApplications.length}件</strong></p>{user.role === "rehomer" && <ListingManagementActions petId={pet.id} canManage={!hasActiveReview} />}</div>
      <div className="rehoming-actions"><Link className="task-primary" href={`/reviews/progress?pet=${pet.id}`}>この子の審査進捗を見る →</Link><Link href={petPath(pet)}>一般向けの掲載内容を見る</Link></div>
    </article>})}</div>
  </div>;
}
