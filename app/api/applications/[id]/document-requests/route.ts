import { NextResponse } from "next/server";
import { apiAccess } from "@/lib/access-control";
import { createDocumentRequest } from "@/lib/document-requests";
import { visibleApplications } from "@/lib/ownership";
import { getApplicants, getPets } from "@/lib/repository";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await apiAccess("review", request);
  if (error || !user) return error!;
  const { id } = await params;
  const [applications, pets] = await Promise.all([getApplicants(), getPets()]);
  const application = visibleApplications(user, applications, pets).find(item => item.id === id);
  const pet = pets.find(item => item.id === application?.petId);
  if (!application || !application.userId || !pet) return NextResponse.json({ error: "対象の申込みが見つかりません。" }, { status: 404 });
  if (application.review?.decisionRecorded) return NextResponse.json({ error: "判断済みの審査には依頼できません。" }, { status: 409 });
  try {
    const body = await request.json();
    if (!body || !["document", "consent"].includes(body.kind) || typeof body.label !== "string" || typeof body.detail !== "string") throw new Error("依頼の種類と内容を入力してください。");
    const item = await createDocumentRequest({ applicationId: id, adopterId: application.userId, petName: pet.name, kind: body.kind, label: body.label, detail: body.detail, requestedBy: user.name });
    return NextResponse.json({ request: item }, { status: 201 });
  } catch (cause) { return NextResponse.json({ error: cause instanceof Error ? cause.message : "依頼できませんでした。" }, { status: 400 }); }
}
