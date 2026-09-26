import { requirePageAccess } from "@/lib/access-control";
import { TaskGuide } from "@/components/TaskGuide";
import { PageHeader } from "@/components/PageHeader";
import { ReviewWorkbench } from "@/components/ReviewWorkbench";
import { getApplicants, getPets } from "@/lib/repository";
import { visibleApplications, visiblePets } from "@/lib/ownership";
import Link from "next/link";
import { ArrowRight, Rows3 } from "lucide-react";
export const dynamic = "force-dynamic";

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ pet?: string }> }) {
  const user = await requirePageAccess("review", "/reviews");
  const { pet } = await searchParams;
  const [allPets, allApplications] = await Promise.all([getPets(), getApplicants()]);
  const petList = visiblePets(user, allPets);
  const applications = visibleApplications(user, allApplications, allPets);
  return <div className="page-wrap"><PageHeader eyebrow="申込み内容の確認" title="応募者の条件を比較する" description="気になる点の理由と必要な確認を整理します。点数だけで合否を決めることはありません。" /><TaskGuide title="この画面で行うこと" steps={["確認するペットを選ぶ", "応募者を選び内容を読む", "「この申込みの確認・記録へ」を押す"]} /><div className="review-view-switch"><span><Rows3 />全ケースの現在地を横並びで確認できます</span><Link href="/reviews/progress">審査進捗ボードを開く <ArrowRight /></Link></div><ReviewWorkbench pets={petList} initialApplicants={applications} initialPetId={pet} /></div>;
}
