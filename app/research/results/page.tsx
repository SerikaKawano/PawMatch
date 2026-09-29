import { requirePageAccess } from "@/lib/access-control";
import { ResearchResults } from "@/components/research/ResearchResults";
import { getResearch } from "@/lib/research/store";
export const dynamic = "force-dynamic";
export default async function ResultsPage({searchParams}:{searchParams:Promise<{source?:string}>}) {
  await requirePageAccess("admin", "/research/results");
  const source=(await searchParams).source==="simulation"?"simulation":"participant";
  return <div className="research-page"><ResearchResults key={source} initial={(await getResearch()).sessions} source={source} /></div>;
}
