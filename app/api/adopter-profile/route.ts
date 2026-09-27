import { NextResponse } from "next/server";
import { apiAccess } from "@/lib/access-control";
import { getAdopterProfile, saveAdopterProfile } from "@/lib/adopter-profile";

export async function GET() {
  const { user, error } = await apiAccess("consult");
  if (error || !user) return error!;
  return NextResponse.json({ profile: await getAdopterProfile(user) }, { headers: { "Cache-Control": "no-store" } });
}
export async function PUT(request: Request) {
  const { user, error } = await apiAccess("consult", request);
  if (error || !user) return error!;
  try {
    const profile = await saveAdopterProfile(user, await request.json());
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "入力内容を確認してください。" }, { status: 400 });
  }
}
