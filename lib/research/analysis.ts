import type { Mode, ResponseRecord, Scenario, StudySession } from "./types";

export const mean = (values: number[]): number | null => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
export function responseMetrics(response: ResponseRecord, scenario: Scenario, session: StudySession) {
  const expected = scenario.rubric.expectedRisks;
  const detected = response.coding?.detectedRiskIds;
  const relevant = detected ? expected.filter(r => detected.includes(r.id)).length : null;
  const missedCritical = detected ? expected.filter(r => r.critical && !detected.includes(r.id)).length : null;
  const scores = scenario.candidates.map(c => ({ id: c.id, score: session.assessments[c.id].score }));
  const selectedHighest = scores.some(s => s.id === response.priorityId && s.score === Math.max(...scores.map(x => x.score)));
  const selectedCritical = expected.filter(r => r.critical && r.candidateId === response.priorityId);
  return {
    relevant, expected: expected.length, recall: relevant !== null && expected.length ? relevant / expected.length : null,
    missedCritical, alignment: scenario.rubric.acceptablePriorityIds.includes(response.priorityId),
    // An inspection cue, never a causal diagnosis of automation bias.
    relianceCue: response.mode === "risk" && detected !== undefined && selectedHighest &&
      selectedCritical.some(r => !detected.includes(r.id)),
  };
}
export function analyse(sessions: StudySession[], source: StudySession["source"]) {
  const included = sessions.filter(s => s.source === source && !s.withdrawnAt);
  const rows = included.flatMap(session => session.responses.map(response => {
    const scenario = session.scenarios.find(s => s.id === response.scenarioId)!;
    return { session, response, scenario, metrics: responseMetrics(response, scenario, session) };
  }));
  const modes = (["baseline", "risk"] as const).map(mode => {
    const subset = rows.filter(row => row.response.mode === mode);
    return {
      mode, count: subset.length, timed: subset.filter(r => !r.response.interrupted).length,
      time: mean(subset.filter(r => !r.response.interrupted).map(r => r.response.elapsedMs / 1000)),
      coded: subset.filter(r => r.response.coding).length,
      recall: mean(subset.flatMap(r => r.metrics.recall === null ? [] : [r.metrics.recall * 100])),
      explanation: mean(subset.flatMap(r => r.response.coding ? [r.response.coding.explanationScore] : [])),
      usefulness: mean(subset.map(r => r.response.ratings.usefulness)),
      clarity: mean(subset.map(r => r.response.ratings.clarity)),
      alignment: mean(subset.map(r => Number(r.metrics.alignment) * 100)),
      relianceCues: subset.filter(r => r.metrics.relianceCue).length,
    };
  });
  const pairs = included.flatMap(session => session.scenarios.flatMap(scenario => {
    const baseline = session.responses.find(r => r.scenarioId === scenario.id && r.mode === "baseline");
    const risk = session.responses.find(r => r.scenarioId === scenario.id && r.mode === "risk");
    if (!baseline || !risk) return [];
    const baseMetrics = responseMetrics(baseline, scenario, session);
    const riskMetrics = responseMetrics(risk, scenario, session);
    return [{
      participant: session.participantCode, scenario: scenario.title, order: session.order,
      timeDifference: baseline.interrupted || risk.interrupted ? null : (risk.elapsedMs - baseline.elapsedMs) / 1000,
      recallDifference: baseMetrics.recall === null || riskMetrics.recall === null ? null : (riskMetrics.recall - baseMetrics.recall) * 100,
      priorityChanged: baseline.priorityId !== risk.priorityId,
    }];
  }));
  const consistency = [...new Set(rows.map(r => r.scenario.id))].flatMap(id => (["baseline", "risk"] as Mode[]).map(mode => {
    const subset = rows.filter(r => r.scenario.id === id && r.response.mode === mode);
    const counts = Object.values(subset.reduce<Record<string, number>>((result, r) => { result[r.response.priorityId] = (result[r.response.priorityId] ?? 0) + 1; return result; }, {}));
    return { scenario: rows.find(r => r.scenario.id === id)!.scenario.title, mode, n: subset.length, agreement: subset.length >= 2 ? Math.max(...counts) / subset.length * 100 : null };
  }));
  return { included, rows, modes, pairs, consistency };
}
export function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function resultsCsv(sessions: StudySession[], source: StudySession["source"]) {
  const headers = ["participant_code", "source", "group", "order", "config_version", "weights", "scenario", "mode", "trial_order", "elapsed_seconds", "interrupted", "priority_id", "decisions", "identified_risks", "reasoning", "next_checks", "usefulness", "clarity", "confidence", "self_reported_score_reliance", "coded", "detected_risk_ids", "expected_risks", "matched_risks", "critical_misses", "explanation_0_3", "researcher_notes", "rubric_alignment", "possible_reliance_cue"];
  const rows = analyse(sessions, source).rows.map(({session:s, response:r, metrics:m}) => [
    s.participantCode, s.source, s.group, s.order, s.config.version, JSON.stringify(s.config.weights), r.scenarioId, r.mode, r.order + 1,
    r.elapsedMs / 1000, r.interrupted, r.priorityId, JSON.stringify(r.decisions), r.identifiedRisks, r.reasoning, r.nextChecks,
    r.ratings.usefulness, r.ratings.clarity, r.ratings.confidence, r.ratings.reliance,
    Boolean(r.coding), r.coding?.detectedRiskIds.join("|"), m.expected, m.relevant, m.missedCritical,
    r.coding?.explanationScore, r.coding?.notes, m.alignment, m.relianceCue,
  ]);
  return "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
}
