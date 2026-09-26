import { z } from "zod";
import { criteria } from "./types";
const text = (max: number) => z.string().trim().min(1).max(max);
export const weightsSchema = z.object({ housing: z.number().min(0).max(100), time: z.number().min(0).max(100), care: z.number().min(0).max(100), medical: z.number().min(0).max(100), integration: z.number().min(0).max(100), continuity: z.number().min(0).max(100) }).strict().refine(value => Math.abs(criteria.reduce((sum, key) => sum + value[key], 0) - 100) < 0.001, "重みの合計を100にしてください");
export const configSchema = z.object({
  weights: weightsSchema, scenarioIds: z.array(text(60)).min(1).max(8).refine(value => new Set(value).size === value.length),
  researcherNotes: z.string().max(3000), rubricReviewed: z.boolean(), consentText: text(5000),
}).strict();
export const createSessionSchema = z.object({ group: z.enum(["welfare", "pet_owner", "it", "other"]), source: z.enum(["participant", "simulation"]), order: z.enum(["alternate", "AB", "BA"]) }).strict();
const rating = z.number().int().min(1).max(5);
export const responseSchema = z.object({
  trialId: text(100), priorityId: text(100), decisions: z.record(z.string(), z.enum(["proceed", "check", "hold", "decline"])),
  identifiedRisks: text(5000), reasoning: text(5000), nextChecks: text(3000), interrupted: z.boolean(),
  ratings: z.object({ usefulness: rating, clarity: rating, confidence: rating, reliance: rating }).strict(),
}).strict();
export const codingSchema = z.object({
  sessionId: text(100), trialId: text(100),
  detectedRiskIds: z.array(text(100)).max(50).refine(value => new Set(value).size === value.length),
  explanationScore: z.number().int().min(0).max(3), notes: z.string().max(3000),
}).strict();
export async function readJson(request: Request) {
  const body = await request.text();
  if (body.length > 60000) throw new Error("入力が長すぎます。");
  try { return JSON.parse(body); } catch { throw new Error("入力を読み取れませんでした。"); }
}
export function errorResponse(error: unknown) {
  const message = error instanceof z.ZodError ? "入力項目・値・重みの合計を確認してください。" : error instanceof Error ? error.message : "保存できませんでした。";
  return Response.json({ error: message }, { status: 400 });
}
