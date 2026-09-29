import type { Consultation } from "./consultations";
import type { Applicant, ReviewStage } from "./types";
import { stageLabels } from "./review-labels";

export type JourneyStep = { label: string; state: "done" | "active" | "pending" | "stopped"; at?: string };
const stages: ReviewStage[] = ["screening", "risk_review", "verification", "meeting", "trial", "final_review"];

export function linkedApplication(consultation: Consultation, applications: Applicant[]) {
  if ((consultation.status ?? "received") !== "profile_requested") return null;
  return applications
    .filter(application => application.userId === consultation.userId && application.petId === consultation.petId && application.submittedAt >= consultation.createdAt.slice(0, 10))
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))[0] ?? null;
}

export function journeySummary(consultation: Consultation, application: Applicant | null) {
  if (consultation.status === "closed") return "この相談は審査フェーズには進まず終了しました。";
  if (!application && consultation.status === "profile_requested") return "事前情報の提出待ちです。審査はまだ始まっていません。";
  if (!application) return "担当者の確認待ちです。審査はまだ始まっていません。";
  if (application.review?.decisionRecorded) {
    if (application.review.decision === "approve") return "担当者が譲渡済として記録しました。";
    if (application.review.decision === "decline") return "担当者が今回は見送りと判断しました。";
    return "担当者が追加確認・保留を記録しました。";
  }
  return `申込みを受け付け、現在は「${stageLabels[application.stage]}」です。最終判断はまだ記録されていません。`;
}

export function journeySteps(consultation: Consultation, application: Applicant | null): JourneyStep[] {
  const status = consultation.status ?? "received";
  const steps: JourneyStep[] = [
    { label: "相談受付", state: "done", at: consultation.createdAt },
    { label: "担当者確認", state: status === "received" ? "active" : "done", at: consultation.reviewedAt },
  ];
  if (status === "closed") return [...steps, { label: "審査に進まず終了", state: "stopped", at: consultation.reviewedAt }];
  if (status === "received") return [...steps, { label: "事前情報の提出", state: "pending" }];
  steps.push({ label: "事前情報の提出", state: application ? "done" : "active", at: application?.submittedAt });
  if (!application) return steps;
  const current = stages.indexOf(application.stage);
  const history = [...(application.review?.history ?? [])].sort((a, b) => a.at.localeCompare(b.at));
  for (const [index, stage] of stages.entries()) {
    const recordedDecision = index === current && application.review?.decisionRecorded;
    const state = index < current ? "done"
      : index > current ? "pending"
        : recordedDecision && application.review?.decision === "decline" ? "stopped"
          : recordedDecision && application.review?.decision === "approve" ? "done" : "active";
    const timeline = application.stageTimeline?.[stage];
    const enteredAt = history.find(entry => entry.stage === stage)?.at ?? timeline?.startedAt;
    const nextStage = stages[index + 1];
    const completedAt = stage === "final_review"
      ? [...history].reverse().find(entry => entry.stage === stage)?.at ?? timeline?.completedAt
      : nextStage
        ? history.find(entry => entry.stage === nextStage)?.at ?? timeline?.completedAt
        : timeline?.completedAt;
    const at = state === "done" || state === "stopped"
      ? completedAt ?? enteredAt ?? (stage === "screening" ? application.submittedAt : undefined)
      : state === "active"
        ? enteredAt ?? (stage === "screening" ? application.submittedAt : undefined)
        : undefined;
    steps.push({ label: stageLabels[stage], state, at });
  }
  return steps;
}
