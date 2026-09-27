import { z } from "zod";
import { mutateStore, readStore } from "./persistence";
import type { DemoUser, DemoUserId } from "./demoUsers";

export const adopterProfileInput = z.object({
  fullName: z.string().trim().min(2).max(80),
  region: z.string().trim().min(2).max(50),
  gender: z.string().trim().min(1).max(50),
  ageRange: z.string().trim().min(1).max(50),
  employment: z.string().trim().min(2).max(200),
  contact: z.string().trim().min(3).max(254),
  household: z.string().trim().max(300),
  householdConsent: z.string().trim().max(300),
  allergies: z.string().trim().max(300),
  existingPets: z.string().trim().max(300),
  housing: z.string().trim().max(300),
  housingPermission: z.string().trim().max(300),
  timeAway: z.string().trim().max(300),
  primaryCarer: z.string().trim().max(300),
  careExperience: z.string().trim().max(500),
  dailyCare: z.string().trim().max(500),
  veterinaryPlan: z.string().trim().max(500),
  careBudget: z.string().trim().max(500),
  adoptionReason: z.string().trim().max(500),
  emergencyPlan: z.string().trim().max(500),
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
const sharedDefaults: Omit<AdopterProfileFields, "fullName" | "region" | "contact"> = {
  gender: "回答しない", ageRange: "30代", employment: "フルタイム勤務・週3日在宅",
  household: "大人2名で暮らしています。", householdConsent: "同居者全員が迎えることに同意しています。",
  allergies: "同居者に動物アレルギーの申告はありません。", existingPets: "先住動物はいません。",
  housing: "ペット飼育可能な住居です。玄関と窓の脱走防止を計画しています。",
  housingPermission: "飼育規約を確認済みです。", timeAway: "平日は4～6時間程度。不在時は家族が対応します。",
  primaryCarer: "本人が主に担当し、同居者が代わりに世話をします。",
  careExperience: "過去に犬または猫と暮らした経験があります。",
  dailyCare: "食事・運動・健康観察の時間を朝夕に確保します。",
  veterinaryPlan: "通院できる動物病院を確認し、夜間の連絡先も控えています。",
  careBudget: "毎月の飼育費と急な受診費用を分けて備えています。",
  adoptionReason: "家族として迎え、必要なケアを続けたいと考えています。",
  emergencyPlan: "旅行・入院時は近隣の家族が世話を担当します。",
};
const defaults: Partial<Record<DemoUserId, Partial<Omit<AdopterProfileFields, "fullName">>>> = {
  adopter: {
    region: "東京都", gender: "男性", ageRange: "30代", employment: "会社員・週3日在宅", household: "大人2名で暮らしています。", housing: "ペット飼育可能な集合住宅です。",
    careExperience: "シニア猫のケア経験12年。朝夕の投薬手順を説明できる。",
    dailyCare: "朝夕のお世話を分担し、外出時は家族が対応します。",
    emergencyPlan: "近隣の家族に協力を依頼でき、通院先を探しています。",
  },
  "adopter-olivia": {
    region: "神奈川県", gender: "女性", ageRange: "40代", employment: "自営業・在宅勤務", household: "大人1名で暮らし、近隣に支援者がいます。", householdConsent: "本人が迎えることを希望し、近隣の支援者にも相談済みです。", primaryCarer: "本人が主に担当し、不在時は近隣の家族が世話をします。", housing: "ペット飼育可能な戸建てです。",
    careExperience: "保護猫と暮らした経験があります。", dailyCare: "在宅勤務を中心に、食事と遊びの時間を確保します。",
    emergencyPlan: "旅行・入院時は近隣の家族が世話を担当します。",
  },
  "adopter-amelia": { region: "大阪府", gender: "女性", ageRange: "20代", employment: "会社員・シフト勤務", timeAway: "日によって8時間ほど。交代で世話をする家族がいます。", primaryCarer: "本人とパートナーが交代で担当します。", careExperience: "犬のトレーニング経験あり。報酬を使った練習計画を作成済み。", dailyCare: "朝夕に45分の散歩。遅くなる日は依頼済みの支援者が対応。" },
  "adopter-ethan": { region: "愛知県", gender: "男性", ageRange: "50代", employment: "会社員・日勤", careExperience: "大型犬の体重管理について面談で助言を受けたい。日常ケアの計画はある。", dailyCare: "朝夕に散歩を各40分、週末は長めに運動します。" },
  "adopter-grace": { region: "宮城県", gender: "女性", ageRange: "30代", employment: "パート勤務", housingPermission: "管理規約の写しを提出予定です。", existingPets: "犬1匹。猫との同居経験はなく、安全に分離する方法は未計画。" },
  "adopter-oliver": { region: "北海道", gender: "男性", ageRange: "40代", employment: "在宅勤務", veterinaryPlan: "継続して受診できる近所の動物病院を確認済みです。" },
  "adopter-ava": { region: "福岡県", gender: "女性", ageRange: "20代", employment: "学生・アルバイト", household: "大人2名で暮らしています。", timeAway: "授業の日は6時間程度で、同居者が在宅しています。", careBudget: "飼育費の目安を調べ、同居者と分担します。" },
  "adopter-liam": { region: "東京都", gender: "男性", ageRange: "60代", employment: "退職後・非常勤", household: "シニア世代の大人1名。日常の世話と緊急時の支援を確保。", householdConsent: "本人が迎えることを希望し、近隣の娘にも相談済みです。", primaryCarer: "本人が中心。急病時は近隣の娘が支援します。", emergencyPlan: "入院時は娘が一時預かりを引き受ける予定です。" },
  "adopter-mia": { region: "香川県", gender: "女性", ageRange: "30代", employment: "会社員・在宅勤務", existingPets: "成猫4匹と同居予定。静養部屋と段階的な導入計画はまだない。" },
  "adopter-jack": { region: "京都府", gender: "男性", ageRange: "40代", employment: "会社員・シフト勤務", household: "大人1名。勤務時間に合わせて支援者と役割を分担。", primaryCarer: "本人が中心。勤務時は決めた支援者が代わります。", timeAway: "交代勤務だが日課に合わせた散歩担当と代替支援者を確保済み。", housing: "ペット可の戸建てで庭はフェンスで囲っています。", dailyCare: "朝夕の給餌と散歩を本人が担当します。" },
};
export function initialAdopterProfile(user: DemoUser): AdopterProfile {
  const preset = defaults[user.id];
  const fields = { ...sharedDefaults, ...preset, region: preset?.region ?? "東京都", contact: user.email };
  return {
    userId: user.id, fullName: user.name, ...fields, updatedAt: null,
    identityStatus: user.id === "adopter" ? "not_requested" : "verified",
    ...(user.id === "adopter" ? {} : { identityVerifiedAt: "2026-09-01T09:00:00.000Z", identityVerifiedBy: "reviewer" as DemoUserId }),
  };
}
export async function getAdopterProfile(user: DemoUser): Promise<AdopterProfile> {
  const saved = (await readStore<Record<string, AdopterProfile>>(key, () => ({})))[user.id];
  return { ...initialAdopterProfile(user), ...saved };
}
export async function saveAdopterProfile(user: DemoUser, input: unknown): Promise<AdopterProfile> {
  return mutateStore<Record<string, AdopterProfile>, AdopterProfile>(key, () => ({}), records => {
    const current = { ...initialAdopterProfile(user), ...records[user.id] };
    const fields = adopterProfileInput.parse({ ...current, ...input as object });
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
    const current = { ...initialAdopterProfile(user), ...records[user.id] };
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
