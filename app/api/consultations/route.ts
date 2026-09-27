import { NextResponse } from "next/server";
import { apiAccess } from "@/lib/access-control";
import { consultationInput, getConsultations, saveConsultation } from "@/lib/consultations";
import { getPets } from "@/lib/repository";

export async function GET(request: Request) {
  const { user, error } = await apiAccess("consult", request);
  if (error || !user) return error!;
  return NextResponse.json({ consultations: await getConsultations(user.id, new URL(request.url).searchParams.get("petId") || undefined) }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  const { user, error } = await apiAccess("consult", request);
  if (error || !user) return error!;
  const parsed = consultationInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "相談内容と連絡先を確認してください。" }, { status: 400 });
  if (!(await getPets()).some(pet => pet.id === parsed.data.petId)) return NextResponse.json({ error: "ペットが見つかりません。" }, { status: 404 });
  try {
    return NextResponse.json({ consultation: await saveConsultation(user.id, parsed.data) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "保存できませんでした。入力を残したまま再試行できます。" }, { status: 500 });
  }
}
