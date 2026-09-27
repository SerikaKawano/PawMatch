import { randomUUID } from "node:crypto";
import { z } from "zod";
import { mutateStore, readStore } from "./persistence";
import type { DemoUserId } from "./demoUsers";

export const consultationInput = z.object({
  petId: z.string().regex(/^[a-zA-Z0-9-]+$/).max(80),
  message: z.string().trim().min(1, "相談内容を入力してください。").max(2000),
  contactEmail: z.string().email().max(254).refine(value => value.toLowerCase().endsWith(".test"), "テスト用メールアドレス（.test）を入力してください。"),
  requestId: z.string().uuid(),
});
export type ConsultationStatus = "received" | "profile_requested" | "closed";
export type Consultation = z.infer<typeof consultationInput> & {
  id: string; userId: DemoUserId; createdAt: string;
  topic?: string; status?: ConsultationStatus; reviewedAt?: string; reviewedBy?: DemoUserId;
};
const key = "consultations-v1";
export async function getAllConsultations() {
  return (await readStore<Consultation[]>(key, () => []))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function getConsultations(userId: DemoUserId, petId?: string) {
  return (await getAllConsultations())
    .filter(item => item.userId === userId && (!petId || item.petId === petId))
}
export async function saveConsultation(userId: DemoUserId, input: unknown) {
  const data = consultationInput.parse(input);
  return mutateStore<Consultation[], Consultation>(key, () => [], records => {
    const existing = records.find(item => item.userId === userId && item.requestId === data.requestId);
    if (existing) return existing;
    const record = { ...data, userId, id: randomUUID(), createdAt: new Date().toISOString(), status: "received" as const };
    records.push(record);
    return record;
  });
}
export async function updateConsultationStatus(id: string, status: Exclude<ConsultationStatus, "received">, reviewerId: DemoUserId) {
  return mutateStore<Consultation[], Consultation | null>(key, () => [], records => {
    const record = records.find(item => item.id === id);
    if (!record || (record.status ?? "received") !== "received") return null;
    record.status = status;
    record.reviewedAt = new Date().toISOString();
    record.reviewedBy = reviewerId;
    return record;
  });
}
