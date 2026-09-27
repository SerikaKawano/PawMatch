import { NextResponse } from "next/server";
import { apiAccess } from "@/lib/access-control";
import { addAdopterDocument, listAdopterDocuments, MAX_DOCUMENT_BYTES } from "@/lib/adopter-documents";
import { getDocumentRequest } from "@/lib/document-requests";

export async function GET() {
  const { user, error } = await apiAccess("consult");
  if (error || !user) return error!;
  return NextResponse.json({ documents: await listAdopterDocuments(user.id) }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  const { user, error } = await apiAccess("consult", request);
  if (error || !user) return error!;
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_DOCUMENT_BYTES + 20_000) return NextResponse.json({ error: "ファイルは2MB以下にしてください。" }, { status: 413 });
  try {
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ error: "ファイルを選んでください。" }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_DOCUMENT_BYTES + 20_000) {
        await reader.cancel();
        return NextResponse.json({ error: "ファイルは2MB以下にしてください。" }, { status: 413 });
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const form = await new Request(request.url, { method: "POST", headers: request.headers, body: bytes }).formData();
    const file = form.get("file");
    const label = form.get("label");
    const requestId = form.get("requestId");
    if (!(file instanceof File) || typeof label !== "string" || file.size > MAX_DOCUMENT_BYTES) return NextResponse.json({ error: "書類名と2MB以下のファイルを選んでください。" }, { status: 400 });
    if (requestId !== null && typeof requestId !== "string") return NextResponse.json({ error: "依頼の指定が不正です。" }, { status: 400 });
    if (requestId) {
      const item = await getDocumentRequest(requestId);
      if (!item || item.adopterId !== user.id || item.kind !== "document") return NextResponse.json({ error: "書類の依頼が見つかりません。" }, { status: 404 });
    }
    const document = await addAdopterDocument(user.id, label, file.name, Buffer.from(await file.arrayBuffer()), requestId || undefined);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "登録できませんでした。" }, { status: 400 });
  }
}
