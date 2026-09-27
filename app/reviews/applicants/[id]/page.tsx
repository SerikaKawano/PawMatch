import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/access-control";
import { visibleApplications } from "@/lib/ownership";
import { getApplicants, getPets } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ApplicantCaseProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageAccess("review", "/reviews/applicants");
  const { id } = await params;
  const [allApplications, pets] = await Promise.all([getApplicants(), getPets()]);
  const application = visibleApplications(user, allApplications, pets).find(item => item.id === id);
  if (!application) notFound();
  const pet = pets.find(item => item.id === application.petId);
  const fields = [
    ["家族・支援体制", application.household],
    ["住まいと飼育環境", application.housing],
    ["お世話に使える時間", application.availability],
    ["飼育経験・必要なケア", application.experience],
    ["先住動物との生活", application.existingPets],
    ["通院と健康管理", application.veterinaryAccess],
    ["飼育費・医療費の備え", application.financialReadiness],
  ];
  return <div className="page-wrap applicant-case-profile">
    <Link className="back-link" href={`/reviews/${application.id}`}>← 審査ケースに戻る</Link>
    <h2>{application.name}</h2>
    <p>{pet?.name ?? "ペット"}への申込み時に記録された内容です。</p>
    <dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "情報なし"}</dd></div>)}</dl>
  </div>;
}
