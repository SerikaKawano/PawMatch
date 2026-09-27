import { NextResponse } from "next/server";
import { apiAccess } from "@/lib/access-control";
import { getAdopterDocument, removeAdopterDocument } from "@/lib/adopter-documents";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await apiAccess("consult");
  if (error || !user) return error!;
  const record = await getAdopterDocument((await params).id);
  if (!record || record.userId !== user.id) return NextResponse.json({ error: "書類が見つかりません。" }, { status: 404 });
  return new Response(Buffer.from(record.base64, "base64"), { headers: {
    "Content-Type": record.mimeType,
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(record.filename)}`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await apiAccess("consult", request);
  if (error || !user) return error!;
  const removed = await removeAdopterDocument(user.id, (await params).id);
  if (!removed) return NextResponse.json({ error: "書類が見つかりません。" }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
