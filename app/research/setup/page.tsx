import { requirePageAccess } from "@/lib/access-control";
import { ResearchNav } from "@/components/research/ResearchNav";
import { ResearchSetup } from "@/components/research/ResearchSetup";
import { getResearch } from "@/lib/research/store";
import { scenarios } from "@/lib/research/scenarios";
export const dynamic = "force-dynamic";
export default async function SetupPage() {
  await requirePageAccess("admin", "/research/setup");
  const store = await getResearch();
  return <div className="research-page"><ResearchNav /><header className="research-heading"><span>研究者用 · SCORING</span><h1>審査項目と重みの設定</h1><p>配点の理由を記録し、通常の審査画面に反映します。</p></header><ResearchSetup initialConfig={store.config} scenarios={scenarios} /></div>;
}
