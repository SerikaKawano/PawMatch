import { NextResponse } from "next/server";
import { apiAccess } from "@/lib/access-control";
import { demoUsers, type DemoUserId } from "@/lib/demoUsers";
import { verifyIdentityReview } from "@/lib/adopter-profile";

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { user, error } = await apiAccess("review", request);
  if (error || !user) return error!;
  if (user.role !== "reviewer" && user.role !== "admin") return NextResponse.json({ error: "審査担当者のみ操作できます。" }, { status: 403 });
  const { userId } = await params;
  if (!demoUsers.some(item => item.id === userId && item.role === "adopter")) return NextResponse.json({ error: "対象が見つかりません。" }, { status: 404 });
  const profile = await verifyIdentityReview(userId as DemoUserId, user.id);
  if (!profile) return NextResponse.json({ error: "確認待ちの申請が見つかりません。" }, { status: 409 });
  return NextResponse.json({ profile });
}
