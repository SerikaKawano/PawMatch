import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAccess } from "@/lib/access-control";
import { appendConsultationMessage, getAllConsultations, updateConsultationStatus } from "@/lib/consultations";
import { currentDemoUser, isSameOrigin } from "@/lib/demo-session-server";
import { getPets } from "@/lib/repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await apiAccess("review", request);
  if (error || !user) return error!;
  if (user.role !== "reviewer" && user.role !== "admin") {
    return NextResponse.json({ error: "審査担当者のみ操作できます。" }, { status: 403 });
  }
  const parsed = z.object({ status: z.enum(["profile_requested", "closed"]) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "操作を確認してください。" }, { status: 400 });
  const { id } = await params;
  if (!z.union([z.string().uuid(), z.string().regex(/^sample-consultation-\d+$/)]).safeParse(id).success) return NextResponse.json({ error: "相談が見つかりません。" }, { status: 404 });
  const consultation = await updateConsultationStatus(id, parsed.data.status, user.id);
  if (!consultation) return NextResponse.json({ error: "相談が見つからないか、すでに対応済みです。" }, { status: 409 });
  return NextResponse.json({ consultation }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentDemoUser();
  if (!user) return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "このサイトから操作してください。" }, { status: 403 });

  const { id } = await params;
  const consultation = (await getAllConsultations()).find(item => item.id === id);
  if (!consultation) return NextResponse.json({ error: "相談が見つかりません。" }, { status: 404 });
  const pet = (await getPets()).find(item => item.id === consultation.petId);
  const mayParticipate = consultation.userId === user.id
    || (user.role === "rehomer" && pet?.ownerId === user.id)
    || user.role === "reviewer"
    || user.role === "admin";
  if (!mayParticipate) return NextResponse.json({ error: "この相談には参加できません。" }, { status: 403 });

  const parsed = z.object({ message: z.string().trim().min(1).max(2000) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "2,000文字以内でメッセージを入力してください。" }, { status: 400 });
  const updated = await appendConsultationMessage(id, user.id, parsed.data);
  if (!updated) return NextResponse.json({ error: "終了した相談には返信できません。" }, { status: 409 });
  return NextResponse.json({ consultation: updated }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
