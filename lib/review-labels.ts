import type { ReviewStage } from "./types";

export const stageLabels: Record<ReviewStage, string> = {
  screening: "申込み受付",
  risk_review: "適合性確認",
  verification: "書類確認",
  meeting: "面談・住環境",
  trial: "トライアル",
  final_review: "最終判断",
};
