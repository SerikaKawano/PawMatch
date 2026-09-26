export const criteria = ["housing", "time", "care", "medical", "integration", "continuity"] as const;
export type Criterion = typeof criteria[number];
export type EvidenceState = "ready" | "partial" | "unknown" | "conflict";
export type Mode = "baseline" | "risk";
export type Decision = "proceed" | "check" | "hold" | "decline";
export type Weights = Record<Criterion, number>;
export type Evidence = { state: EvidenceState; detail: string; nextCheck: string; critical?: boolean };
export type ResearchCandidate = {
  id: string; name: string; household: string; preferences: string;
  evidence: Record<Criterion, Evidence>;
  verification: { identity: "verified" | "pending" | "not_provided"; housing: "verified" | "pending" | "not_provided"; cohabitantConsent: "verified" | "pending" | "not_provided"; lifelongCare: "verified" | "pending" | "not_provided"; followUp: "verified" | "pending" | "not_provided" };
};
export type ExpectedRisk = { id: string; candidateId: string; label: string; rationale: string; critical: boolean };
export type Scenario = {
  id: string; title: string; focus: string; petId: string; petName: string; species: "Dog" | "Cat";
  age: string; location: string; animalNeeds: string; candidates: ResearchCandidate[];
  rubric: { expectedRisks: ExpectedRisk[]; acceptablePriorityIds: string[]; rationale: string };
};
export type Assessment = {
  score: number; coverage: number; ruleVersion: string;
  breakdown: { criterion: Criterion; label: string; weight: number; earned: number; state: EvidenceState; detail: string }[];
  risks: { id: string; severity: "high" | "medium" | "low"; label: string; detail: string; nextCheck: string }[];
  nextActions: string[];
};
export type StudyConfig = {
  version: number; weights: Weights; scenarioIds: string[]; researcherNotes: string;
  rubricReviewed: boolean; consentText: string;
};
export type ResponseRecord = {
  trialId: string; scenarioId: string; mode: Mode; order: number; startedAt: string; submittedAt: string;
  elapsedMs: number; interrupted: boolean; priorityId: string;
  decisions: Record<string, Decision>; identifiedRisks: string; reasoning: string; nextChecks: string;
  ratings: { usefulness: number; clarity: number; confidence: number; reliance: number };
  coding?: { detectedRiskIds: string[]; explanationScore: number; notes: string; codedAt: string };
};
export type StudySession = {
  id: string; participantCode: string; group: "welfare" | "pet_owner" | "it" | "other";
  source: "participant" | "simulation"; createdAt: string; consentedAt?: string;
  order: "AB" | "BA"; config: StudyConfig; scenarios: Scenario[];
  assessments: Record<string, Assessment>;
  trials: { id: string; scenarioId: string; mode: Mode }[];
  responses: ResponseRecord[]; active?: { trialId: string; startedAt: string };
  withdrawnAt?: string;
};
export type ResearchStore = { config: StudyConfig; sessions: StudySession[] };
export type ParticipantView = {
  id: string; participantCode: string; source: StudySession["source"]; consentText: string;
  consented: boolean; withdrawn: boolean; completed: number; total: number;
  trial?: { id: string; mode: Mode; startedAt: string; scenario: Omit<Scenario, "rubric" | "focus" | "candidates"> & { candidates: { id: string; name: string; household: string; preferences: string; facts: Record<Criterion, string>; verification: ResearchCandidate["verification"] }[] }; assessments?: Record<string, Assessment> };
};
