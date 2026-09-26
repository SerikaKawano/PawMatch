import { randomUUID } from "node:crypto";
import { mutateStore, readStore } from "../persistence";
import { defaultConfig, scenarios } from "./scenarios";
import { assess } from "./scoring";
import { simulationSessions } from "./simulation";
import type { ParticipantView, ResearchStore, StudySession } from "./types";
import { codingSchema, configSchema, createSessionSchema, responseSchema } from "./validation";

const initial = (): ResearchStore => ({ config: structuredClone(defaultConfig), sessions: simulationSessions() });
export const getResearch = () => readStore("research-v1", initial);
export async function saveConfig(input: unknown) {
  const parsed = configSchema.parse(input);
  if (parsed.scenarioIds.some(id => !scenarios.some(s => s.id === id))) throw new Error("不明なケースです。");
  return mutateStore("research-v1", initial, store => {
    store.config = { ...parsed, version: store.config.version + 1 };
    return store.config;
  });
}
export async function createSession(input: unknown) {
  const parsed = createSessionSchema.parse(input);
  return mutateStore("research-v1", initial, store => {
    if (parsed.source === "participant" && !store.config.rubricReviewed) throw new Error("実施前に、想定リスク・採点・説明文の確認を研究設定に記録してください。練習セッションは発行できます。");
    const count = store.sessions.filter(s => s.source === parsed.source).length;
    const order = parsed.order === "alternate" ? count % 2 === 0 ? "AB" : "BA" : parsed.order;
    const selected = store.config.scenarioIds.map(id => scenarios.find(s => s.id === id)!);
    const modes = order === "AB" ? ["baseline", "risk"] as const : ["risk", "baseline"] as const;
    const session: StudySession = {
      id: randomUUID(), participantCode: (parsed.source === "participant" ? "P-" : "PRACTICE-") + randomUUID().slice(0, 8),
      group: parsed.group, source: parsed.source, createdAt: new Date().toISOString(), order,
      config: structuredClone(store.config), scenarios: structuredClone(selected),
      assessments: Object.fromEntries(selected.flatMap(s=>s.candidates.map(c=>[c.id,assess(c,store.config.weights)]))),
      trials: modes.flatMap(mode => selected.map(s => ({ id: s.id + "-" + mode, scenarioId: s.id, mode }))),
      responses: [],
    };
    store.sessions.push(session);
    return { id: session.id, participantCode: session.participantCode, order };
  });
}
function sessionIn(store: ResearchStore, id: string) {
  const session = store.sessions.find(s => s.id === id);
  if (!session) throw new Error("セッションが見つかりません。");
  return session;
}
export function participantView(session: StudySession): ParticipantView {
  const result: ParticipantView = {
    id: session.id, participantCode: session.participantCode, source: session.source, consentText: session.config.consentText,
    consented: Boolean(session.consentedAt), withdrawn: Boolean(session.withdrawnAt),
    completed: session.responses.length, total: session.trials.length,
  };
  if (session.withdrawnAt || !session.active || !session.consentedAt) return result;
  const trial = session.trials.find(t => t.id === session.active!.trialId)!;
  const scenario = session.scenarios.find(s => s.id === trial.scenarioId)!;
  // No expected answers, evidence ratings, critical markers or future trials reach the participant.
  const { rubric: _rubric, focus: _focus, candidates, ...animal } = scenario;
  void _rubric; void _focus;
  result.trial = {
    id: trial.id, mode: trial.mode, startedAt: session.active.startedAt,
    scenario: { ...animal, candidates: candidates.map(c => ({
      id: c.id, name: c.name, household: c.household, preferences: c.preferences,
      facts: Object.fromEntries(Object.entries(c.evidence).map(([key, value]) => [key, value.detail])) as Record<keyof typeof c.evidence, string>,
      verification: c.verification,
    })) },
    ...(trial.mode === "risk" ? { assessments: Object.fromEntries(candidates.map(c => [c.id, session.assessments[c.id]])) } : {}),
  };
  return result;
}
export async function getSessionView(id: string) { return participantView(sessionIn(await getResearch(), id)); }
export async function changeSession(id: string, action: string, input?: unknown) {
  return mutateStore("research-v1", initial, store => {
    const session = sessionIn(store, id);
    if (session.withdrawnAt) throw new Error("中止済みのセッションです。");
    if (action === "withdraw") {
      session.responses = []; delete session.active;
      session.withdrawnAt = new Date().toISOString();
    } else if (action === "consent") {
      if (!session.consentedAt) session.consentedAt = new Date().toISOString();
    } else if (action === "start") {
      if (!session.consentedAt) throw new Error("参加説明の確認が必要です。");
      const trial = session.trials[session.responses.length];
      if (trial && !session.active) session.active = { trialId: trial.id, startedAt: new Date().toISOString() };
    } else if (action === "respond") {
      const data = responseSchema.parse(input);
      if (!session.consentedAt) throw new Error("参加説明の確認が必要です。");
      // Idempotent retries preserve the first successful submission and never advance twice.
      if (session.responses.some(r => r.trialId === data.trialId)) return participantView(session);
      if (!session.active || session.active.trialId !== data.trialId) throw new Error("表示中の課題を開始してから回答してください。");
      const trial = session.trials[session.responses.length];
      const scenario = session.scenarios.find(s => s.id === trial.scenarioId)!;
      const ids = scenario.candidates.map(c => c.id);
      if ((data.priorityId !== "none" && !ids.includes(data.priorityId)) || Object.keys(data.decisions).length !== ids.length || ids.some(key => !data.decisions[key])) throw new Error("すべての応募者について対応を選んでください。");
      if (data.priorityId !== "none" && data.decisions[data.priorityId] !== "proceed") throw new Error("優先候補には「次の面談へ」を選んでください。");
      const now = new Date();
      session.responses.push({
        ...data, scenarioId: trial.scenarioId, mode: trial.mode, order: session.responses.length,
        startedAt: session.active.startedAt, submittedAt: now.toISOString(),
        elapsedMs: Math.max(0, now.getTime() - Date.parse(session.active.startedAt)),
      });
      delete session.active;
    } else throw new Error("不明な操作です。");
    return participantView(session);
  });
}
export async function saveCoding(input: unknown) {
  const data = codingSchema.parse(input);
  return mutateStore("research-v1", initial, store => {
    const session = sessionIn(store, data.sessionId);
    const response = session.responses.find(r => r.trialId === data.trialId);
    if (!response || session.withdrawnAt) throw new Error("回答が見つかりません。");
    const scenario = session.scenarios.find(s => s.id === response.scenarioId)!;
    if (data.detectedRiskIds.some(id => !scenario.rubric.expectedRisks.some(r => r.id === id))) throw new Error("想定リスクに存在しない項目です。");
    response.coding = { detectedRiskIds: data.detectedRiskIds, explanationScore: data.explanationScore, notes: data.notes, codedAt: new Date().toISOString() };
    return response.coding;
  });
}
