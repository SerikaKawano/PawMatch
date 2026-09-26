import { apiAccess } from "@/lib/access-control";
import { createSession } from "@/lib/research/store";
import { errorResponse, readJson } from "@/lib/research/validation";
export async function POST(request: Request) {
  const access = await apiAccess("admin", request); if (access.error) return access.error;

  try { return Response.json(await createSession(await readJson(request)), { status: 201 }); } catch(error) { return errorResponse(error); }
}
