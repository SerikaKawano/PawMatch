import { requirePageAccess } from "@/lib/access-control";
import { ResearchSetup } from "@/components/research/ResearchSetup";
import { getResearch } from "@/lib/research/store";
import { scenarios } from "@/lib/research/scenarios";
export const dynamic = "force-dynamic";
export default async function SetupPage() {
  await requirePageAccess("admin", "/research/setup");
  const store = await getResearch();
  return <div className="research-page"><ResearchSetup initialConfig={store.config} scenarios={scenarios} /></div>;
}
