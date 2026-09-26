import { apiAccess } from "@/lib/access-control";
import { getResearch, saveConfig } from "@/lib/research/store";
import { errorResponse, readJson } from "@/lib/research/validation";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const access = await apiAccess("admin", request); if (access.error) return access.error;
 return Response.json((await getResearch()).config); }
export async function PUT(request: Request) {
  const access = await apiAccess("admin", request); if (access.error) return access.error;

  try { return Response.json(await saveConfig(await readJson(request))); } catch(error) { return errorResponse(error); }
}
