import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAccess } from "@/lib/access-control";
import { updateConsultationStatus } from "@/lib/consultations";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await apiAccess("review", request);
  if (error || !user) return error!;
  if (user.role !== "reviewer" && user.role !== "admin") {
    return NextResponse.json({ error: "審査担当者のみ操作できます。" }, { status: 403 });
  }
  const parsed = z.object({ status: z.enum(["profile_requested", "closed"]) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "操作を確認してください。" }, { status: 400 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "相談が見つかりません。" }, { status: 404 });
  const consultation = await updateConsultationStatus(id, parsed.data.status, user.id);
  if (!consultation) return NextResponse.json({ error: "相談が見つからないか、すでに対応済みです。" }, { status: 409 });
  return NextResponse.json({ consultation }, { headers: { "Cache-Control": "no-store" } });
}
