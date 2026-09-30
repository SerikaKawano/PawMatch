import { mutateStore, readStore } from "./persistence";
import { assess } from "./research/scoring";
import type { AdopterProfile } from "./adopter-profile";
import type { Consultation } from "./consultations";
import type { Applicant, Pet, VerificationStatus } from "./types";
import type { ResearchCandidate } from "./research/types";

const key = "application-intakes-v1";

export async function getApplicationIntakes() {
  return readStore<Applicant[]>(key, () => []);
}

function evidence(detail: string, nextCheck: string, critical = false): ResearchCandidate["evidence"]["housing"] {
  return { state: detail.trim() ? "partial" : "unknown", detail: detail.trim() || "情報がまだ登録されていません。", nextCheck, critical };
}

export async function createApplicationFromConsultation(consultation: Consultation, profile: AdopterProfile, pet: Pet) {
  return mutateStore<Applicant[], Applicant>(key, () => [], records => {
    const existing = records.find(item => item.userId === consultation.userId && item.petId === consultation.petId && item.submittedAt >= consultation.createdAt.slice(0, 10));
    if (existing) return existing;
    const verification: VerificationStatus = {
      identity: profile.identityStatus === "verified" ? "verified" : profile.identityStatus === "pending" ? "pending" : "not_provided",
      housing: profile.housingPermission.trim() ? "pending" : "not_provided",
      cohabitantConsent: profile.householdConsent.trim() ? "pending" : "not_provided",
      lifelongCare: profile.adoptionReason.trim() ? "pending" : "not_provided",
      followUp: "pending",
    };
    const researchCandidate: ResearchCandidate = {
      id: `intake-${consultation.id}`,
      name: profile.fullName,
      household: profile.household,
      preferences: profile.adoptionReason,
      evidence: {
        housing: evidence(`${profile.housing} ${profile.housingPermission}`, "住居の飼育条件と脱走防止策を確認する", !profile.housingPermission.trim()),
        time: evidence(`${profile.timeAway} ${profile.primaryCarer}`, "日々のお世話時間と不在時の担当者を確認する"),
        care: evidence(`${profile.careExperience} ${profile.dailyCare}`, `${pet.name}に必要なケアを継続できるか確認する`),
        medical: evidence(`${profile.veterinaryPlan} ${profile.careBudget}`, "通院手段と医療費への備えを確認する"),
        integration: evidence(`${profile.householdConsent} ${profile.existingPets}`, "家族の同意と先住動物との導入計画を確認する"),
        continuity: evidence(profile.emergencyPlan, "緊急時や長期不在時の支援体制を確認する"),
      },
      verification,
    };
    const assessment = assess(researchCandidate);
    const now = new Date();
    const startedAt = now.toISOString();
    const screeningStartedAt = new Date(now.getTime() - 60_000).toISOString();
    const application: Applicant = {
      id: `intake-${consultation.id}`,
      userId: consultation.userId,
      petId: consultation.petId,
      name: profile.fullName,
      submittedAt: startedAt.slice(0, 10),
      household: profile.household,
      housing: `${profile.housing} ${profile.housingPermission}`.trim(),
      experience: profile.careExperience,
      availability: `${profile.timeAway} ${profile.primaryCarer}`.trim(),
      existingPets: profile.existingPets,
      veterinaryAccess: profile.veterinaryPlan,
      financialReadiness: profile.careBudget,
      score: assessment.score,
      strengths: [profile.dailyCare, profile.emergencyPlan].filter(Boolean),
      risks: assessment.risks,
      nextActions: assessment.nextActions,
      verification,
      stage: "risk_review",
      stageTimeline: {
        screening: { startedAt: screeningStartedAt, completedAt: startedAt },
        risk_review: { startedAt },
      },
      researchCandidate,
    };
    records.push(application);
    return application;
  });
}
