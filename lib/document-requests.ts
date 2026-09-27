import { randomUUID } from "node:crypto";
import { mutateStore, readStore } from "./persistence";
import type { DemoUserId } from "./demoUsers";

export type DocumentRequest = {
  id: string; applicationId: string; adopterId: DemoUserId; petName: string;
  kind: "document" | "consent"; label: string; detail: string;
  requestedAt: string; requestedBy: string; acknowledgedAt?: string;
};
const key = "document-requests-v1";
export async function requestsForApplication(applicationId: string) {
  return (await readStore<DocumentRequest[]>(key, () => [])).filter(item => item.applicationId === applicationId);
}
export async function requestsForAdopter(adopterId: DemoUserId) {
  return (await readStore<DocumentRequest[]>(key, () => [])).filter(item => item.adopterId === adopterId);
}
export async function getDocumentRequest(id: string) {
  return (await readStore<DocumentRequest[]>(key, () => [])).find(item => item.id === id) ?? null;
}
export async function createDocumentRequest(input: Omit<DocumentRequest, "id" | "requestedAt" | "acknowledgedAt">) {
  const label = input.label.trim(), detail = input.detail.trim();
  if (!label || label.length > 80 || detail.length > 500) throw new Error("依頼内容を80文字以内、補足を500文字以内で入力してください。");
  return mutateStore<DocumentRequest[], DocumentRequest>(key, () => [], records => {
    const record: DocumentRequest = { ...input, label, detail, id: randomUUID(), requestedAt: new Date().toISOString() };
    records.push(record); return record;
  });
}
export async function acknowledgeConsentRequest(id: string, adopterId: DemoUserId) {
  return mutateStore<DocumentRequest[], DocumentRequest>(key, () => [], records => {
    const record = records.find(item => item.id === id && item.adopterId === adopterId && item.kind === "consent");
    if (!record) throw new Error("確認依頼が見つかりません。");
    if (!record.acknowledgedAt) record.acknowledgedAt = new Date().toISOString();
    return record;
  });
}
