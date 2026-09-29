import { NextResponse } from "next/server";

import { apiAccess } from "@/lib/access-control";
import { petListingInput, stopPetListing, updatePetListing } from "@/lib/pet-listings";
import { getApplicants, getPets } from "@/lib/repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await apiAccess("rehome", request);
  if (error || !user) return error!;
  if (user.role !== "rehomer") return NextResponse.json({ error: "譲渡者アカウントで操作してください。" }, { status: 403 });
  const { id } = await params;
  const [pets, applications] = await Promise.all([getPets(), getApplicants()]);
  const pet = pets.find(item => item.id === id);
  if (!pet || pet.ownerId !== user.id) return NextResponse.json({ error: "対象の掲載が見つかりません。" }, { status: 404 });
  const hasActiveReview = applications.some(item => item.petId === pet.id && item.review && !item.review.decisionRecorded);
  if (hasActiveReview) return NextResponse.json({ error: "進行中の審査があるため、編集・掲載停止はできません。" }, { status: 409 });
  const body = await request.json().catch(() => null) as { action?: string; input?: unknown } | null;
  try {
    if (body?.action === "stop") { await stopPetListing(pet, user.id); return NextResponse.json({ stopped: true }); }
    if (body?.action === "update") {
      const parsed = petListingInput.safeParse(body.input);
      if (!parsed.success) return NextResponse.json({ error: "必須項目と入力内容を確認してください。" }, { status: 400 });
      return NextResponse.json({ pet: await updatePetListing(pet, user.id, parsed.data) });
    }
    return NextResponse.json({ error: "操作を確認できませんでした。" }, { status: 400 });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "掲載内容を更新できませんでした。" }, { status: 400 });
  }
}
