import { apiAccess } from "@/lib/access-control";
import { saveCoding } from "@/lib/research/store";
import { errorResponse, readJson } from "@/lib/research/validation";
export async function PUT(request: Request) {
  const access = await apiAccess("admin", request); if (access.error) return access.error;

  try { return Response.json(await saveCoding(await readJson(request))); } catch(error) { return errorResponse(error); }
}
