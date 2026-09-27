import { NextResponse } from "next/server";
import { apiAccess } from "@/lib/access-control";
import { requestIdentityReview } from "@/lib/adopter-profile";

export async function POST(request: Request) {
  const { user, error } = await apiAccess("consult", request);
  if (error || !user) return error!;
  return NextResponse.json({ profile: await requestIdentityReview(user) }, { headers: { "Cache-Control": "no-store" } });
}
