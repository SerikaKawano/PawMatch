import { changeSession, getSessionView } from "@/lib/research/store";
import { errorResponse, readJson } from "@/lib/research/validation";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return Response.json(await getSessionView((await params).id)); } catch { return Response.json({ error: "セッションが見つかりません。" }, { status: 404 }); }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await readJson(request);
    return Response.json(await changeSession((await params).id, body.action, body.response));
  } catch(error) { return errorResponse(error); }
}
