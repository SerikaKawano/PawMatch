import { randomUUID } from "node:crypto";
import { mutateStore, readStore } from "./persistence";
import type { DemoUserId } from "./demoUsers";
import { demoUsers } from "./demoUsers";

export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;
const MAX_DOCUMENTS_PER_USER = 5;
const key = "adopter-documents-v1";
export type AdopterDocument = {
  id: string; userId: DemoUserId; label: string; filename: string;
  requestId?: string;
  mimeType: "application/pdf" | "image/png" | "image/jpeg"; size: number; uploadedAt: string; base64: string;
};
export type AdopterDocumentSummary = Omit<AdopterDocument, "base64">;
function examplePdf(title: string): Buffer {
  const line = title.replace(/[\\()]/g, "\\$&");
  const stream = `BT /F1 18 Tf 48 748 Td (${line}) Tj /F1 12 Tf 0 -34 Td (Example record for interface review only.) Tj 0 -20 Td (No identity document or private address is included.) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, body] of objects.entries()) { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${body}\nendobj\n`; }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}
const sampleDocuments: AdopterDocument[] = demoUsers.filter(user => user.role === "adopter").flatMap(user => [
  { id: `sample-${user.id}-care`, label: "飼育計画書", filename: "care-plan-example.pdf", title: "Care plan" },
  { id: `sample-${user.id}-home`, label: "住居・お世話の確認メモ", filename: "home-care-example.pdf", title: "Housing and care notes" },
].map((item, index) => {
  const bytes = examplePdf(item.title);
  return { id: item.id, userId: user.id, label: item.label, filename: item.filename, mimeType: "application/pdf" as const,
    size: bytes.length, uploadedAt: `2026-09-${index ? "02" : "01"}T09:00:00.000Z`, base64: bytes.toString("base64") };
}));
export function publicDocument(record: AdopterDocument): AdopterDocumentSummary {
  const { base64: _base64, ...summary } = record;
  void _base64;
  return summary;
}
export function detectDocumentType(bytes: Buffer): AdopterDocument["mimeType"] | null {
  if (bytes.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  return null;
}
export async function listAdopterDocuments(userId: DemoUserId) {
  return [...sampleDocuments, ...await readStore<AdopterDocument[]>(key, () => [])]
    .filter(item => item.userId === userId).map(publicDocument).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}
export async function getAdopterDocument(id: string) {
  return (await readStore<AdopterDocument[]>(key, () => [])).find(item => item.id === id) ?? sampleDocuments.find(item => item.id === id) ?? null;
}
export async function addAdopterDocument(userId: DemoUserId, label: string, filename: string, bytes: Buffer, requestId?: string) {
  const mimeType = detectDocumentType(bytes);
  if (!mimeType || bytes.length === 0 || bytes.length > MAX_DOCUMENT_BYTES) throw new Error("PDF・PNG・JPEGの2MB以下のファイルを選んでください。");
  const cleanLabel = label.trim().slice(0, 80);
  if (!cleanLabel) throw new Error("書類名を入力してください。");
  const cleanFilename = filename.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 120) || "document";
  return mutateStore<AdopterDocument[], AdopterDocumentSummary>(key, () => [], records => {
    if (records.filter(item => item.userId === userId).length + sampleDocuments.filter(item => item.userId === userId).length >= MAX_DOCUMENTS_PER_USER) throw new Error("登録できる書類は5件までです。");
    const record: AdopterDocument = { id: randomUUID(), userId, label: cleanLabel, filename: cleanFilename, requestId, mimeType, size: bytes.length, uploadedAt: new Date().toISOString(), base64: bytes.toString("base64") };
    records.push(record);
    return publicDocument(record);
  });
}
export async function removeAdopterDocument(userId: DemoUserId, id: string) {
  return mutateStore<AdopterDocument[], boolean>(key, () => [], records => {
    const index = records.findIndex(item => item.id === id && item.userId === userId);
    if (index < 0) return false;
    records.splice(index, 1);
    return true;
  });
}
