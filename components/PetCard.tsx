import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import type { Pet } from "@/lib/types";
import { demoUsers } from "@/lib/demoUsers";
import { uiCopy } from "@/lib/ui-copy";
import { petPath } from "@/lib/pet-routes";

export function PetCard({ pet, showListingNumber = true }: { pet: Pet; showListingNumber?: boolean }) {
  const owner = demoUsers.find(account => account.id === pet.ownerId);
  const detailPath = petPath(pet);
  return <article className="pet-card">
    <Link href={detailPath} className={`pet-photo-link pet-visual ${pet.accent}`} aria-label={pet.name + "の" + uiCopy.seeDetails}>
      {pet.imageUrl ? <Image src={pet.imageUrl} alt={pet.breed + "の" + pet.name} width={640} height={640} unoptimized /> : <span>{pet.emoji}</span>}
      {pet.urgent && <b>優先して募集中</b>}
    </Link>
    <div className="pet-card-body">
      <div className="pet-title"><div><h3><Link href={detailPath}>{pet.name}</Link></h3><p>{pet.breed} · {pet.birthDateApproximate ? `約${pet.age}` : pet.age}</p></div></div>
      <p className="pet-card-facts">{showListingNumber && <>掲載番号 {pet.listingNumber}<br /></>}出生年月日 {pet.birthDate}<br />血統書 {pet.rehoming?.pedigree ?? "未確認"}</p>
      <p className="location"><MapPin size={18} />{pet.location}</p>
      <p className="pet-card-owner">譲渡元：{owner?.kind === "organization" ? owner.name : owner ? `${owner.name}さん（個人）` : "確認中"}</p>
      <div className="tag-row">{pet.temperament.slice(0, 2).map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>
      <Link href={detailPath} className="pet-card-action">{uiCopy.seeDetails}<ArrowRight size={21} /></Link>
    </div>
  </article>;
}
