import Link from "next/link";
import Image from "next/image";

import { getApplicants, getPets } from "@/lib/repository";
import { requirePageAccess } from "@/lib/access-control";
import { visibleApplications, visiblePets } from "@/lib/ownership";
import { TaskGuide } from "@/components/TaskGuide";
import { demoUsers } from "@/lib/demoUsers";

export default async function RehomingPage() {
  const user = await requirePageAccess("rehome", "/rehoming");
  const [allPets, allApplications] = await Promise.all([getPets(), getApplicants()]);
  const pets = visiblePets(user, allPets);
  const applications = visibleApplications(user, allApplications, allPets);
  return <div className="page-wrap">
    <header className="role-page-heading"><p>{user.role === "admin" ? `全譲渡元の掲載ペットは${pets.length}頭です。` : `${user.name}の掲載ペットは${pets.length}頭です。`}掲載内容と、ペットごとの審査進捗を確認できます。</p></header>
    <TaskGuide title="この画面で行うこと" steps={["掲載中のペットを選ぶ", "掲載内容を見る", "審査進捗を見る"]} />
    <div className="rehoming-list">{pets.map(pet => <article key={pet.id}>
      {pet.imageUrl && <Image src={pet.imageUrl} alt={pet.name + "の写真"} width={160} height={160} unoptimized />}
      <div><span className="listing-status">募集中</span><h2>{pet.name}</h2><p>{pet.breed} · {pet.age}</p><p>掲載元：{demoUsers.find(account => account.id === pet.ownerId)?.name}</p><p>届いた里親申込み <strong>{applications.filter(item => item.petId === pet.id).length}件</strong></p></div>
      <div className="rehoming-actions"><Link className="task-primary" href={`/reviews/progress?pet=${pet.id}`}>この子の審査進捗を見る →</Link><Link href={`/pets/${pet.id}`}>一般向けの掲載内容を見る</Link></div>
    </article>)}</div>
    <p className="privacy-note">掲載の新規作成・実際の譲渡は行いません。既存の合成ケースの里親申込み確認と審査を体験する画面です。</p>
  </div>;
}
