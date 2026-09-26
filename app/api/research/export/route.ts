import { apiAccess } from "@/lib/access-control";
import { getResearch } from "@/lib/research/store";
import { resultsCsv } from "@/lib/research/analysis";
import { scenarios } from "@/lib/research/scenarios";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const access = await apiAccess("admin", request); if (access.error) return access.error;

  const url = new URL(request.url);
  const store = await getResearch();
  if (url.searchParams.get("format") === "dataset") return Response.json({ datasetVersion: "proposal-scenarios-1", config: store.config, scenarios }, { headers: { "Content-Disposition": 'attachment; filename="pawmatch-synthetic-dataset.json"' } });
  const source = url.searchParams.get("source") === "simulation" ? "simulation" : "participant";
  if (url.searchParams.get("format") === "json") {
    const sessions = store.sessions.filter(s => s.source === source && !s.withdrawnAt).map(({ id: _id, ...rest }) => { void _id; return rest; });
    return Response.json({ source, sessions }, { headers: { "Content-Disposition": 'attachment; filename="pawmatch-' + source + '-snapshot.json"' } });
  }
  return new Response(resultsCsv(store.sessions, source), { headers: {
    "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="pawmatch-' + source + '.csv"',
  } });
}
