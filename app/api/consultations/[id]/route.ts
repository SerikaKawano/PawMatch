import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAccess } from "@/lib/access-control";
import { appendConsultationMessage, getAllConsultations, updateConsultationStatus } from "@/lib/consultations";
import { currentDemoUser, isSameOrigin } from "@/lib/demo-session-server";
import { getPets } from "@/lib/repository";
import { getApplicants } from "@/lib/repository";
import { createApplicationFromConsultation } from "@/lib/application-intakes";
import { getAdopterProfile } from "@/lib/adopter-profile";
import { listAdopterDocuments } from "@/lib/adopter-documents";
import { demoUsers } from "@/lib/demoUsers";
import { linkedApplication } from "@/lib/consultation-journey";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await apiAccess("review", request);
  if (error || !user) return error!;
  if (user.role !== "reviewer" && user.role !== "admin") {
    return NextResponse.json({ error: "審査担当者のみ操作できます。" }, { status: 403 });
  }
  const parsed = z.union([
    z.object({ status: z.enum(["profile_requested", "closed"]) }).strict(),
    z.object({ action: z.literal("start_review") }).strict(),
  ]).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "操作を確認してください。" }, { status: 400 });
  const { id } = await params;
  if (!z.union([z.string().uuid(), z.string().regex(/^sample-consultation-\d+$/)]).safeParse(id).success) return NextResponse.json({ error: "相談が見つかりません。" }, { status: 404 });
  if ("action" in parsed.data) {
    const consultation = (await getAllConsultations()).find(item => item.id === id);
    if (!consultation || consultation.status !== "profile_requested") return NextResponse.json({ error: "事前情報の提出待ちとなっている相談だけ審査へ進められます。" }, { status: 409 });
    const adopter = demoUsers.find(item => item.id === consultation.userId && item.role === "adopter");
    const pet = (await getPets()).find(item => item.id === consultation.petId);
    if (!adopter || !pet) return NextResponse.json({ error: "申込者またはペットの情報が見つかりません。" }, { status: 404 });
    const existing = linkedApplication(consultation, await getApplicants());
    if (existing) return NextResponse.json({ application: existing }, { headers: { "Cache-Control": "no-store" } });
    const documents = await listAdopterDocuments(adopter.id);
    if (!documents.length) return NextResponse.json({ error: "里親希望者の書類がまだ提出されていません。" }, { status: 409 });
    const application = await createApplicationFromConsultation(consultation, await getAdopterProfile(adopter), pet);
    await appendConsultationMessage(id, user.id, { message: "プロファイルと登録済み書類を受領し、申込みを受け付けました。適合性確認を開始します。" });
    return NextResponse.json({ application }, { status: 201, headers: { "Cache-Control": "no-store" } });
  }
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
