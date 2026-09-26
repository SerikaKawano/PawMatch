import { criteria, type Assessment, type ResearchCandidate, type Weights } from "./types";

export const RULE_VERSION = "care-evidence-1";
export const defaultWeights: Weights = { housing: 25, time: 20, care: 15, medical: 15, integration: 15, continuity: 10 };
export const criterionLabels = { housing: "住環境", time: "お世話の時間", care: "必要なケアへの理解", medical: "医療・費用への備え", integration: "家族・先住動物との生活", continuity: "継続飼育・緊急時対応" };
export const evidenceLabels = { ready: "計画あり", partial: "一部不足", unknown: "情報不足", conflict: "必要条件と不一致" };
export const verificationLabels = { identity: "本人確認", housing: "飼育可能な住居", cohabitantConsent: "同居者の同意", lifelongCare: "終生飼育への同意", followUp: "譲渡後の連絡への同意" };
export const verificationStateLabels = { verified: "確認済み", pending: "確認待ち", not_provided: "情報なし" };
const multiplier = { ready: 1, partial: 0.5, unknown: 0, conflict: 0 };

// An explicit, provisional rubric; no demographic or preference input affects the score.
// Unknown earns no evidence credit, but is never labelled unsuitable or automatically rejected.
export function assess(candidate: ResearchCandidate, weights: Weights = defaultWeights): Assessment {
  const breakdown = criteria.map(criterion => ({
    criterion, label: criterionLabels[criterion], weight: weights[criterion],
    earned: weights[criterion] * multiplier[candidate.evidence[criterion].state],
    state: candidate.evidence[criterion].state, detail: candidate.evidence[criterion].detail,
  }));
  const risks: Assessment["risks"] = criteria.flatMap(criterion => {
    const evidence = candidate.evidence[criterion];
    if (evidence.state === "ready") return [];
    return [{
      id: criterion,
      severity: evidence.critical || evidence.state === "conflict" ? "high" as const : "medium" as const,
      label: criterionLabels[criterion] + "：" + evidenceLabels[evidence.state],
      detail: evidence.detail, nextCheck: evidence.nextCheck,
    }];
  });
  for (const key of Object.keys(verificationLabels) as (keyof ResearchCandidate["verification"])[]) {
    if (candidate.verification[key] !== "verified") risks.push({
      id: "verification-" + key,
      severity: key === "housing" || key === "lifelongCare" ? "high" : "medium",
      label: verificationLabels[key] + "の確認待ち",
      detail: "申告内容と確認済みであることは別です。確認状況は点数とは別に扱います。",
      nextCheck: verificationLabels[key] + "について担当者の確認結果を記録する",
    });
  }
  return {
    score: Math.round(breakdown.reduce((sum, item) => sum + item.earned, 0) * 10) / 10,
    coverage: Math.round(criteria.filter(key => candidate.evidence[key].state !== "unknown").length / criteria.length * 100),
    ruleVersion: RULE_VERSION, breakdown, risks,
    nextActions: [...new Set(risks.map(risk => risk.nextCheck))],
  };
}
