import { NextResponse } from "next/server";
import { getPets } from "@/lib/repository";
import { apiAccess } from "@/lib/access-control";
import { createPetListing, petListingInput } from "@/lib/pet-listings";
export async function GET() { return NextResponse.json({ data: (await getPets()).filter(pet => pet.listingStatus !== "stopped") }); }

export async function POST(request: Request) {
  const { user, error } = await apiAccess("rehome", request);
  if (error || !user) return error!;
  if (user.role !== "rehomer") return NextResponse.json({ error: "譲渡者アカウントで操作してください。" }, { status: 403 });
  const parsed = petListingInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "必須項目と入力内容を確認してください。" }, { status: 400 });
  try {
    const current = await getPets();
    const pet = await createPetListing(user.id, parsed.data, current.map(item => item.listingNumber));
    return NextResponse.json({ pet }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "掲載内容を保存できませんでした。入力内容を残したまま再試行してください。" }, { status: 500 });
  }
}
