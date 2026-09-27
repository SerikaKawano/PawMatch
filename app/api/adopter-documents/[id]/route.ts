import { NextResponse } from "next/server";
import { apiAccess } from "@/lib/access-control";
import { getAdopterDocument, removeAdopterDocument } from "@/lib/adopter-documents";
import { currentDemoUser } from "@/lib/demo-session-server";
import { getApplicants, getPets } from "@/lib/repository";
import { visibleApplications } from "@/lib/ownership";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentDemoUser();
  if (!user) return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  const record = await getAdopterDocument((await params).id);
  if (!record) return NextResponse.json({ error: "書類が見つかりません。" }, { status: 404 });
  if (record.userId !== user.id && user.role !== "reviewer" && user.role !== "admin") {
    const [applications,pets]=await Promise.all([getApplicants(),getPets()]);
    if (user.role!=="rehomer"||!visibleApplications(user,applications,pets).some(item=>item.userId===record.userId)) return NextResponse.json({ error: "書類が見つかりません。" }, { status: 404 });
  }
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
