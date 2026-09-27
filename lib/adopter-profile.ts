import { z } from "zod";
import { mutateStore, readStore } from "./persistence";
import type { DemoUser, DemoUserId } from "./demoUsers";

export const adopterProfileInput = z.object({
  fullName: z.string().trim().min(2).max(80),
  region: z.string().trim().min(2).max(50),
  household: z.string().trim().min(2).max(300),
  housing: z.string().trim().min(2).max(300),
  careExperience: z.string().trim().min(2).max(500),
  dailyCare: z.string().trim().min(2).max(500),
  emergencyPlan: z.string().trim().min(2).max(500),
});
export type AdopterProfileFields = z.infer<typeof adopterProfileInput>;
export type IdentityStatus = "not_requested" | "pending" | "verified";
export type AdopterProfile = AdopterProfileFields & {
  userId: DemoUserId;
  updatedAt: string | null;
  identityStatus: IdentityStatus;
  identityRequestedAt?: string;
  identityVerifiedAt?: string;
  identityVerifiedBy?: DemoUserId;
};
const key = "adopter-profiles-v1";
const defaults: Partial<Record<DemoUserId, Omit<AdopterProfileFields, "fullName">>> = {
  adopter: {
    region: "東京都", household: "大人2名で暮らしています。", housing: "ペット飼育可能な集合住宅です。",
    careExperience: "犬の飼育経験があります。猫は初めてです。",
    dailyCare: "朝夕のお世話を分担し、外出時は家族が対応します。",
    emergencyPlan: "近隣の家族に協力を依頼でき、通院先を探しています。",
  },
  "adopter-olivia": {
    region: "神奈川県", household: "大人1名で暮らし、近隣に支援者がいます。", housing: "ペット飼育可能な戸建てです。",
    careExperience: "保護猫と暮らした経験があります。", dailyCare: "在宅勤務を中心に、食事と遊びの時間を確保します。",
    emergencyPlan: "旅行・入院時は近隣の家族が世話を担当します。",
  },
};
export function initialAdopterProfile(user: DemoUser): AdopterProfile {
  const preset = defaults[user.id];
  return {
    userId: user.id, fullName: user.name, region: preset?.region ?? "", household: preset?.household ?? "",
    housing: preset?.housing ?? "", careExperience: preset?.careExperience ?? "", dailyCare: preset?.dailyCare ?? "",
    emergencyPlan: preset?.emergencyPlan ?? "", updatedAt: null, identityStatus: "not_requested",
  };
}
export async function getAdopterProfile(user: DemoUser): Promise<AdopterProfile> {
  const saved = (await readStore<Record<string, AdopterProfile>>(key, () => ({})))[user.id];
  return saved ?? initialAdopterProfile(user);
}
export async function saveAdopterProfile(user: DemoUser, input: unknown): Promise<AdopterProfile> {
  const fields = adopterProfileInput.parse(input);
  return mutateStore<Record<string, AdopterProfile>, AdopterProfile>(key, () => ({}), records => {
    const current = records[user.id] ?? initialAdopterProfile(user);
    const next = { ...current, ...fields, updatedAt: new Date().toISOString() };
    if (current.identityStatus === "verified" && (current.fullName !== fields.fullName || current.region !== fields.region)) {
      next.identityStatus = "pending";
      next.identityRequestedAt = next.updatedAt;
      delete next.identityVerifiedAt;
      delete next.identityVerifiedBy;
    }
    records[user.id] = next;
    return next;
  });
}
export async function requestIdentityReview(user: DemoUser): Promise<AdopterProfile> {
  return mutateStore<Record<string, AdopterProfile>, AdopterProfile>(key, () => ({}), records => {
    const current = records[user.id] ?? initialAdopterProfile(user);
    if (current.identityStatus === "not_requested") {
      current.identityStatus = "pending";
      current.identityRequestedAt = new Date().toISOString();
      records[user.id] = current;
    }
    return current;
  });
}
export async function getPendingIdentityProfiles() {
  const records = await readStore<Record<string, AdopterProfile>>(key, () => ({}));
  return Object.values(records).filter(profile => profile.identityStatus === "pending");
}
export async function verifyIdentityReview(userId: DemoUserId, reviewerId: DemoUserId): Promise<AdopterProfile | null> {
  return mutateStore<Record<string, AdopterProfile>, AdopterProfile | null>(key, () => ({}), records => {
    const current = records[userId];
    if (!current || current.identityStatus !== "pending") return null;
    current.identityStatus = "verified";
    current.identityVerifiedAt = new Date().toISOString();
    current.identityVerifiedBy = reviewerId;
    return current;
  });
}
