import { randomUUID } from "node:crypto";
import { z } from "zod";
import { mutateStore, readStore } from "./persistence";
import type { DemoUserId } from "./demoUsers";

export const consultationInput = z.object({
  petId: z.string().regex(/^[a-zA-Z0-9-]+$/).max(80),
  topic: z.enum(["譲渡の条件", "健康・お世話", "面談・見学", "その他"]),
  message: z.string().trim().min(1, "相談内容を入力してください。").max(2000),
  requestId: z.string().uuid(),
});
export type Consultation = z.infer<typeof consultationInput> & {
  id: string; userId: DemoUserId; createdAt: string;
};
const key = "consultations-v1";
export async function getConsultations(userId: DemoUserId, petId?: string) {
  return (await readStore<Consultation[]>(key, () => []))
    .filter(item => item.userId === userId && (!petId || item.petId === petId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function saveConsultation(userId: DemoUserId, input: unknown) {
  const data = consultationInput.parse(input);
  return mutateStore<Consultation[], Consultation>(key, () => [], records => {
    const existing = records.find(item => item.userId === userId && item.requestId === data.requestId);
    if (existing) return existing;
    const record = { ...data, userId, id: randomUUID(), createdAt: new Date().toISOString() };
    records.push(record);
    return record;
  });
}
