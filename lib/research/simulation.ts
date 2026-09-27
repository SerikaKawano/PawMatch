import { defaultConfig, scenarios } from "./scenarios";
import { assess } from "./scoring";
import type { StudySession } from "./types";

export function simulationSessions(): StudySession[] {
  return Array.from({ length: 8 }, (_, index) => {
    const selected = scenarios.filter(s => defaultConfig.scenarioIds.includes(s.id));
    const modes = index % 2 === 0 ? ["baseline", "risk"] as const : ["risk", "baseline"] as const;
    const trials = modes.flatMap(mode => selected.map(s => ({ id: s.id + "-" + mode, scenarioId: s.id, mode })));
    const createdAt = new Date(Date.UTC(2026, 8, 10 + index, 1)).toISOString();
    const session: StudySession = {
      id: "simulation-" + (index + 1), participantCode: "SIM-" + String(index + 1).padStart(3, "0"),
      group: ["welfare", "pet_owner", "it", "other"][index % 4] as StudySession["group"],
      source: "simulation", createdAt, consentedAt: createdAt, order: index % 2 ? "BA" : "AB",
      config: structuredClone(defaultConfig), scenarios: structuredClone(selected), trials, responses: [],
      assessments: Object.fromEntries(selected.flatMap(s=>s.candidates.map(c=>[c.id,assess(c,defaultConfig.weights)]))),
    };
    session.responses = trials.map((trial, order) => {
      const scenario = selected.find(s => s.id === trial.scenarioId)!;
      // Includes worse/equal outcomes; these fixtures verify aggregation, never supply research findings.
      const misses = (index + order) % 3;
      const detected = scenario.rubric.expectedRisks.slice(misses).map(risk => risk.id);
      const priorityId = index % 3 === 0 ? scenario.candidates[0].id : scenario.rubric.acceptablePriorityIds[0];
      const seconds = (trial.mode === "risk" ? 140 : 180) + index * 17 + (index % 3 === 0 ? 90 : 0);
      const start = new Date(Date.parse(createdAt) + order * 600000);
      const assessment = assess(scenario.candidates.find(c => c.id === priorityId)!);
      return {
        trialId: trial.id, scenarioId: trial.scenarioId, mode: trial.mode, order,
        startedAt: start.toISOString(), submittedAt: new Date(start.getTime() + seconds * 1000).toISOString(), elapsedMs: seconds * 1000,
        interrupted: false, priorityId, decisions: Object.fromEntries(scenario.candidates.map(c => [c.id, c.id === priorityId ? "proceed" : "check"])),
        identifiedRisks: "【集計動作確認用の練習回答】" + scenario.rubric.expectedRisks.filter(r => detected.includes(r.id)).map(r => r.label).join("、"),
        reasoning: "【合成回答】ケアの計画と未確認事項を比較した。実際の参加者の判断ではありません。",
        nextChecks: assessment.nextActions.join("、") || "面談で計画を確認する",
        ratings: { usefulness: 3 + index % 3, clarity: 3 + index % 3, confidence: 3, reliance: 2 + index % 4 },
        coding: { detectedRiskIds: detected, explanationScore: index % 4, notes: "集計検証用の合成コーディング", codedAt: createdAt },
      };
    });
    return session;
  });
}
