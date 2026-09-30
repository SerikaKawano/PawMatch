import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, PawPrint, UserRound } from "lucide-react";
import { requirePageAccess } from "@/lib/access-control";
import { demoUsers } from "@/lib/demoUsers";
import { getPets } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function RehomerRecordsPage() {
  const user = await requirePageAccess("review", "/reviews/rehomers");
  if (user.role !== "reviewer" && user.role !== "admin") redirect("/access-denied");
  const pets = await getPets();
  const rehomers = demoUsers.filter(item => item.role === "rehomer");
  return <div className="page-wrap rehomer-review-page"><div className="rehomer-review-list">{rehomers.map(rehomer => {
    const listedPets = pets.filter(pet => pet.ownerId === rehomer.id);
    return <Link href={`/reviews/rehomers/${rehomer.id}`} key={rehomer.id}>
      <span className="rehomer-review-icon">{rehomer.kind === "organization" ? <Building2 aria-hidden="true" /> : <UserRound aria-hidden="true" />}</span>
      <span><strong>{rehomer.name}</strong><small>{rehomer.organization}</small></span>
      <span>{rehomer.kind === "organization" ? "団体" : "個人"}</span>
      <span><PawPrint aria-hidden="true" /> 掲載ペット {listedPets.length}頭</span>
      <b>詳細を見る →</b>
    </Link>;
  })}</div></div>;
}
