import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/access-control";
import { demoUsers } from "@/lib/demoUsers";
import { getAdopterProfile, type AdopterProfileFields } from "@/lib/adopter-profile";
import { listAdopterDocuments } from "@/lib/adopter-documents";
import { getApplicants, getPets } from "@/lib/repository";
import { stageLabels } from "@/lib/review-store";
import { visibleApplications } from "@/lib/ownership";

export const dynamic = "force-dynamic";
const labels: Record<string, string> = {
  gender: "性別", ageRange: "年代", employment: "仕事の状況", contact: "連絡先", region: "お住まいの地域",
  household: "一緒に暮らす人", householdConsent: "同居者の同意", allergies: "家族のアレルギー", existingPets: "先住動物",
  housing: "住まいと飼育環境", housingPermission: "住居の飼育許可", timeAway: "留守にする時間", primaryCarer: "主なお世話の担当",
  careExperience: "飼育経験", dailyCare: "日々のお世話", veterinaryPlan: "通院・健康管理の計画", careBudget: "飼育費・医療費への備え",
  adoptionReason: "お迎えを希望する理由", emergencyPlan: "緊急時の対応",
};

export default async function AdopterRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const reviewer = await requirePageAccess("review", "/reviews/adopters");
  const { id } = await params;
  const adopter = demoUsers.find(user => user.id === id && user.role === "adopter");
  if (!adopter) notFound();
  const [applications, pets] = await Promise.all([getApplicants(), getPets()]);
  const ownApplications = visibleApplications(reviewer, applications, pets).filter(item => item.userId === id);
  if (reviewer.role === "rehomer" && !ownApplications.length) notFound();
  const [profile, documents] = await Promise.all([getAdopterProfile(adopter), reviewer.role === "rehomer" ? Promise.resolve([]) : listAdopterDocuments(adopter.id)]);
  return <div className="page-wrap adopter-review-page"><Link href={reviewer.role === "rehomer" ? "/reviews/progress" : "/reviews/adopters"} className="back-link">← {reviewer.role === "rehomer" ? "審査進捗ボード" : "里親希望者の一覧"}</Link><span className="section-kicker">里親希望者の情報</span><h1>{profile.fullName}</h1><p className={`identity-state ${profile.identityStatus}`}>{profile.identityStatus === "verified" ? "本人確認済み" : profile.identityStatus === "pending" ? "本人確認待ち" : "本人確認未申請"}</p><div className="adopter-home-grid"><section className="adopter-profile-card"><h2>プロフィール</h2><dl className="adopter-profile-facts">{Object.entries(labels).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{profile[key as keyof AdopterProfileFields] || "未入力"}</dd></div>)}</dl></section><div className="adopter-home-side">{reviewer.role !== "rehomer" && <section className="adopter-documents-card"><h2>登録済み書類</h2><p>本人確認書類や住所の証明は保存していません。資料の内容と確認状況を区別して確認してください。</p><ul className="adopter-document-list">{documents.map(document => <li key={document.id}><div><strong>{document.label}</strong><a href={`/api/adopter-documents/${document.id}`}>{document.filename}</a></div></li>)}</ul></section>}<section className="adopter-documents-card"><h2>申込みの進捗</h2><ul className="adopter-document-list">{ownApplications.map(application => <li key={application.id}><div><strong>{pets.find(pet => pet.id === application.petId)?.name}</strong><span>{stageLabels[application.stage]}</span></div><Link href={`/reviews/${application.id}`}>審査を開く →</Link></li>)}</ul></section></div></div></div>;
}
