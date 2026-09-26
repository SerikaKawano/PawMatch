import { apiAccess } from "@/lib/access-control";
import { NextRequest, NextResponse } from "next/server";
import { getApplicants } from "@/lib/repository";
import { getPets } from "@/lib/repository";
import { visibleApplications } from "@/lib/ownership";
export async function GET(request: NextRequest) {
  const access = await apiAccess("review", request); if (access.error) return access.error;
 const [applications, pets] = await Promise.all([getApplicants(request.nextUrl.searchParams.get("petId") ?? undefined), getPets()]);
 return NextResponse.json({ data: visibleApplications(access.user!, applications, pets) }); }
