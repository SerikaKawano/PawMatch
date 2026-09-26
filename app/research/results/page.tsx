import { requirePageAccess } from "@/lib/access-control";
import { ResearchNav } from "@/components/research/ResearchNav";
import { ResearchResults } from "@/components/research/ResearchResults";
import { getResearch } from "@/lib/research/store";
export const dynamic = "force-dynamic";
export default async function ResultsPage({searchParams}:{searchParams:Promise<{source?:string}>}) {
  await requirePageAccess("admin", "/research/results");
  const source=(await searchParams).source==="simulation"?"simulation":"participant";
  return <div className="research-page"><ResearchNav /><header className="research-heading"><span>研究者用 · RESULTS</span><h1>審査の比較と評価結果</h1><p>時間短縮とリスクの見落としを一緒に確認し、判断の根拠を読み解きます。</p></header><ResearchResults key={source} initial={(await getResearch()).sessions} source={source} /></div>;
}
