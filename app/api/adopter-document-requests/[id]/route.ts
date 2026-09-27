import { NextResponse } from "next/server";
import { apiAccess } from "@/lib/access-control";
import { acknowledgeConsentRequest } from "@/lib/document-requests";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await apiAccess("consult", request);
  if (error || !user) return error!;
  try {
    const item = await acknowledgeConsentRequest((await params).id, user.id);
    return NextResponse.json({ request: item });
  } catch { return NextResponse.json({ error: "確認依頼が見つかりません。" }, { status: 404 }); }
}
