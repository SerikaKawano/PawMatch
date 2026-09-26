import { notFound } from "next/navigation";
import { ResearchSession } from "@/components/research/ResearchSession";
import { getSessionView } from "@/lib/research/store";
export const dynamic = "force-dynamic";
export default async function SessionPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const view=await getSessionView(id).catch(()=>null);
  if(!view) notFound();
  return <ResearchSession initial={view} />;
}
