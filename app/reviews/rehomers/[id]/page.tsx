import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Building2, ExternalLink, Mail, PawPrint, UserRound } from "lucide-react";
import { requirePageAccess } from "@/lib/access-control";
import { demoUsers } from "@/lib/demoUsers";
import { getApplicants, getPets } from "@/lib/repository";
import { petPath } from "@/lib/pet-routes";
import { stageLabels } from "@/lib/review-store";

export const dynamic = "force-dynamic";

export default async function RehomerRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageAccess("review", "/reviews/rehomers");
  if (user.role !== "reviewer" && user.role !== "admin") redirect("/access-denied");
  const { id } = await params;
  const rehomer = demoUsers.find(item => item.id === id && item.role === "rehomer");
  if (!rehomer) notFound();
  const [pets, applications] = await Promise.all([getPets(), getApplicants()]);
  const listedPets = pets.filter(pet => pet.ownerId === rehomer.id);
  const petIds = new Set(listedPets.map(pet => pet.id));
  const relatedApplications = applications.filter(application => petIds.has(application.petId));
  return <div className="page-wrap rehomer-review-page rehomer-review-detail">
    <header className="rehomer-review-heading"><span>{rehomer.kind === "organization" ? <Building2 aria-hidden="true" /> : <UserRound aria-hidden="true" />}</span><div><small>{rehomer.kind === "organization" ? "譲渡団体" : "個人譲渡者"}</small><h2>{rehomer.name}</h2><p>{rehomer.organization}</p></div></header>
    <div className="rehomer-review-surface">
      <section><h3>登録情報</h3><dl className="adopter-profile-facts"><div><dt>氏名・担当者名</dt><dd>{rehomer.name}</dd></div><div><dt>アカウント区分</dt><dd>{rehomer.kind === "organization" ? "団体" : "個人"}</dd></div><div><dt>所属・活動名</dt><dd>{rehomer.organization}</dd></div><div><dt><Mail aria-hidden="true" /> 連絡先</dt><dd>{rehomer.email}</dd></div><div><dt>登録内容</dt><dd>{rehomer.description}</dd></div>{rehomer.websiteUrl ? <div><dt>Webサイト</dt><dd><a href={rehomer.websiteUrl} target="_blank" rel="noreferrer">サイトを開く <ExternalLink aria-hidden="true" /></a></dd></div> : null}{rehomer.socialUrl ? <div><dt>SNS</dt><dd><a href={rehomer.socialUrl} target="_blank" rel="noreferrer">SNSを開く <ExternalLink aria-hidden="true" /></a></dd></div> : null}</dl></section>
      <section><h3>掲載ペット</h3><p>この譲渡者が掲載しているペットと、関連する審査件数です。</p><ul className="rehomer-pet-list">{listedPets.length ? listedPets.map(pet => {
        const cases = relatedApplications.filter(application => application.petId === pet.id);
        return <li key={pet.id}><div><PawPrint aria-hidden="true" /><span><strong>{pet.name}</strong><small>掲載番号 {pet.listingNumber}</small></span></div><span>審査 {cases.length}件</span><Link href={petPath(pet)}>ペットの詳細を見る →</Link></li>;
      }) : <li>掲載中のペットはありません。</li>}</ul></section>
      <section><h3>関連する審査ケース</h3><ul className="adopter-document-list">{relatedApplications.length ? relatedApplications.map(application => <li key={application.id}><div><strong>{listedPets.find(pet => pet.id === application.petId)?.name ?? "ペット"}</strong><span>{stageLabels[application.stage]}</span></div><Link href={`/reviews/${application.id}`}>審査を開く →</Link></li>) : <li>関連する審査ケースはありません。</li>}</ul></section>
    </div>
  </div>;
}
