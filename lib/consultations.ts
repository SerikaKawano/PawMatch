import { randomUUID } from "node:crypto";
import { z } from "zod";
import { mutateStore, readStore } from "./persistence";
import type { DemoUserId } from "./demoUsers";

export const consultationInput = z.object({
  petId: z.string().regex(/^[a-zA-Z0-9-]+$/).max(80),
  message: z.string().trim().min(1, "相談内容を入力してください。").max(2000),
  // Keep the persisted key for existing consultations; it now accepts either contact method.
  contactEmail: z.string().trim().max(254).refine(value => {
    if (z.string().email().safeParse(value).success) return true;
    const digits = value.replace(/\D/g, "");
    return /^\+?[0-9][0-9\s()-]*$/.test(value) && digits.length >= 10 && digits.length <= 15;
  }, "メールアドレスまたは電話番号を入力してください。"),
  requestId: z.string().uuid(),
});
export type ConsultationStatus = "received" | "profile_requested" | "closed";
export type Consultation = z.infer<typeof consultationInput> & {
  id: string; userId: DemoUserId; createdAt: string;
  topic?: string; status?: ConsultationStatus; reviewedAt?: string; reviewedBy?: DemoUserId;
};
const key = "consultations-v1";
const sampleRows: { userId: DemoUserId; petId: string; status: ConsultationStatus; message: string }[] = [
  { userId: "adopter", petId: "momo", status: "profile_requested", message: "投薬の時間と必要な通院について詳しく伺いたいです。" },
  { userId: "adopter-olivia", petId: "yuki", status: "profile_requested", message: "静かな環境で迎えるための準備について相談したいです。" },
  { userId: "adopter-amelia", petId: "sora", status: "profile_requested", message: "朝夕の散歩と面談の日程について相談したいです。" },
  { userId: "adopter-ethan", petId: "kai", status: "received", message: "先住犬との相性を確かめる方法を教えてください。" },
  { userId: "adopter-grace", petId: "hana", status: "profile_requested", message: "住居の飼育規約の確認について質問があります。" },
  { userId: "adopter-oliver", petId: "haru", status: "profile_requested", message: "トライアル中の健康管理について伺いたいです。" },
  { userId: "adopter-ava", petId: "nagi", status: "received", message: "お迎え前に必要な準備を教えてください。" },
  { userId: "adopter-liam", petId: "momo", status: "closed", message: "通院の負担を確認し、今回は相談を終了します。" },
  { userId: "adopter-mia", petId: "yuki", status: "closed", message: "先住犬との同居条件を確認し、相談を終了します。" },
  { userId: "adopter-jack", petId: "sora", status: "profile_requested", message: "朝夕の運動計画について相談したいです。" },
];
export const sampleConsultations: Consultation[] = sampleRows.map((row, index) => ({
  ...row, id: `sample-consultation-${index + 1}`, requestId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  contactEmail: `${row.userId}@pawmatch.test`, createdAt: `2026-09-${String(index + 1).padStart(2, "0")}T09:00:00.000Z`,
  ...(row.status !== "received" ? { reviewedAt: `2026-09-${String(index + 2).padStart(2, "0")}T09:00:00.000Z`, reviewedBy: "reviewer" as DemoUserId } : {}),
}));
function withSamples(records: Consultation[]) {
  return [...records, ...sampleConsultations.filter(sample => !records.some(record => record.id === sample.id))];
}
export async function getAllConsultations() {
  return withSamples(await readStore<Consultation[]>(key, () => []))
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
    records.push(...sampleConsultations.filter(sample => !records.some(record => record.id === sample.id)));
    const record = records.find(item => item.id === id);
    if (!record || (record.status ?? "received") !== "received") return null;
    record.status = status;
    record.reviewedAt = new Date().toISOString();
    record.reviewedBy = reviewerId;
    return record;
  });
}
