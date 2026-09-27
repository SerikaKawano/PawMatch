import { redirect } from "next/navigation";
import { requirePageAccess } from "@/lib/access-control";
import { getAllConsultations } from "@/lib/consultations";
import { demoUsers } from "@/lib/demoUsers";
import { getPets } from "@/lib/repository";
import { ConsultationTriage } from "@/components/ConsultationTriage";

export const dynamic = "force-dynamic";

export default async function ConsultationQueuePage() {
  const user = await requirePageAccess("review", "/reviews/consultations");
  if (user.role !== "reviewer" && user.role !== "admin") redirect("/access-denied");
  const [records, pets] = await Promise.all([getAllConsultations(), getPets()]);
  return <div className="page-wrap consultation-queue-page"><header className="role-page-heading"><span className="section-kicker">審査担当者の操作</span><h1>届いた相談を確認する</h1><p>内容を確認して、事前情報の提出へ進めるか、相談を終了するかを記録します。プロフィールが揃う前に適合性の判断はしません。</p></header><ConsultationTriage initialRecords={records} names={Object.fromEntries(pets.map(pet => [pet.id, pet.name]))} applicants={Object.fromEntries(demoUsers.map(item => [item.id, item.name]))} /></div>;
}
