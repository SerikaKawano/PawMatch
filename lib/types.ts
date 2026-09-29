import type { Assessment, ResearchCandidate } from "./research/types";
import type { DemoUserId } from "./demoUsers";

export type VerificationState = "verified" | "pending" | "not_provided";
export type ReviewStage = "screening" | "risk_review" | "verification" | "meeting" | "trial" | "final_review";

export interface Pet {
  id: string;
  listedAt: string;
  listingNumber: string;
  birthDate: string;
  birthDateApproximate: boolean;
  ownerId: DemoUserId;
  name: string;
  species: "Dog" | "Cat";
  breed: string;
  age: string;
  sex: "Female" | "Male";
  location: string;
  temperament: string[];
  careNeeds: string[];
  summary: string;
  emoji: string;
  imageUrl?: string;
  accent: string;
  applications: number;
  urgent?: boolean;
  health?: {
    medicalHistory: string;
    medicalRecords: string[];
    vaccinations: string;
    vaccinationHistory?: string[];
    recordEvidence?: string[];
    medication: string;
    spayNeuter: string;
    microchip: string;
    evidenceStatus: string;
  };
  rehoming?: {
    origin: string;
    pedigree: string;
    houseTraining: string;
    compatibility: string;
    requirements: string[];
    trial: string;
    fees: string;
    story?: string;
    conditionsMessage?: string;
    livingPoints?: {
      housing: string;
      time: string;
      care: string;
      medical: string;
      integration: string;
      continuity: string;
    };
  };
}

export interface VerificationStatus {
  identity: VerificationState;
  housing: VerificationState;
  cohabitantConsent: VerificationState;
  lifelongCare: VerificationState;
  followUp: VerificationState;
}

export interface Applicant {
  userId?: DemoUserId;
  researchCandidate?: ResearchCandidate;
  assessment?: Assessment;
  review?: ReviewRecord;
  id: string;
  petId: string;
  name: string;
  submittedAt: string;
  household: string;
  housing: string;
  experience: string;
  availability: string;
  existingPets: string;
  veterinaryAccess: string;
  financialReadiness: string;
  score: number;
  strengths: string[];
  risks: { severity: "high" | "medium" | "low"; label: string; detail: string }[];
  nextActions: string[];
  verification: VerificationStatus;
  stage: ReviewStage;
  stageTimeline?: Partial<Record<ReviewStage, { startedAt: string; completedAt?: string }>>;
}

export interface ReviewRecord {
  revision: number;
  stage: ReviewStage;
  verification: VerificationStatus;
  meetingChecks: boolean[];
  trialChecks: boolean[];
  trial?: { periodFrom: string; periodTo: string; transportFrom: string; transportTo: string; transportMethod: string; result: "pending" | "ok" | "ng"; criteria?: { housing: "pending" | "ok" | "ng"; compatibility: "pending" | "ok" | "ng"; dailyCare: "pending" | "ok" | "ng"; contingency: "pending" | "ok" | "ng" }; memo: string };
  note: string;
  decision: "approve" | "hold" | "decline";
  decisionRecorded: boolean;
  riskAcknowledged: boolean;
  signoffs?: Partial<Record<"meeting" | "trial" | "final_review", { reviewer?: { userId: string; name: string; at: string; note?: string }; rehomer?: { userId: string; name: string; at: string; note?: string } }>>;
  history: { at: string; action: string; note: string; stage: ReviewStage; actorName?: string; actorRole?: "reviewer" | "rehomer" }[];
}
