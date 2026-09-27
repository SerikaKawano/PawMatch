import { randomUUID } from "node:crypto";
import { mutateStore, readStore } from "./persistence";
import type { DemoUserId } from "./demoUsers";

export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;
const MAX_DOCUMENTS_PER_USER = 5;
const key = "adopter-documents-v1";
export type AdopterDocument = {
  id: string; userId: DemoUserId; label: string; filename: string;
  mimeType: "application/pdf" | "image/png" | "image/jpeg"; size: number; uploadedAt: string; base64: string;
};
export type AdopterDocumentSummary = Omit<AdopterDocument, "base64">;
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
  return (await readStore<AdopterDocument[]>(key, () => []))
    .filter(item => item.userId === userId).map(publicDocument).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}
export async function getAdopterDocument(id: string) {
  return (await readStore<AdopterDocument[]>(key, () => [])).find(item => item.id === id) ?? null;
}
export async function addAdopterDocument(userId: DemoUserId, label: string, filename: string, bytes: Buffer) {
  const mimeType = detectDocumentType(bytes);
  if (!mimeType || bytes.length === 0 || bytes.length > MAX_DOCUMENT_BYTES) throw new Error("PDF・PNG・JPEGの2MB以下のファイルを選んでください。");
  const cleanLabel = label.trim().slice(0, 80);
  if (!cleanLabel) throw new Error("書類名を入力してください。");
  const cleanFilename = filename.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 120) || "document";
  return mutateStore<AdopterDocument[], AdopterDocumentSummary>(key, () => [], records => {
    if (records.filter(item => item.userId === userId).length >= MAX_DOCUMENTS_PER_USER) throw new Error("登録できる書類は5件までです。");
    const record: AdopterDocument = { id: randomUUID(), userId, label: cleanLabel, filename: cleanFilename, mimeType, size: bytes.length, uploadedAt: new Date().toISOString(), base64: bytes.toString("base64") };
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
