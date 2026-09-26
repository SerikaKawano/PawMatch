import { apiAccess } from "@/lib/access-control";
import { NextRequest, NextResponse } from "next/server";
import { updateApplicationReview } from "@/lib/repository";
import { getApplicants, getPets } from "@/lib/repository";
import { visibleApplications } from "@/lib/ownership";
import { errorResponse, readJson } from "@/lib/research/validation";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await apiAccess("review", request); if (access.error) return access.error;

  try {
    const { id } = await params;
    const [applications, pets] = await Promise.all([getApplicants(), getPets()]);
    if (!visibleApplications(access.user!, applications, pets).some(application => application.id === id))
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    const result = await updateApplicationReview(id, await readJson(request));
    return result ? NextResponse.json({ data: result }) : NextResponse.json({ error: "Application not found" }, { status: 404 });
  } catch(error) { return errorResponse(error); }
}
