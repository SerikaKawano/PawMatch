import type { ReviewStage } from "./types";

export const stageLabels: Record<ReviewStage, string> = {
  screening: "申込み受付",
  risk_review: "適合性確認",
  verification: "書類確認",
  meeting: "面談",
  trial: "トライアル",
  final_review: "最終判断",
};

export const reviewStageDescriptions: Record<ReviewStage, string> = {
  screening: "申込者のプロファイルを表示します。ここでの操作はありません。",
  risk_review: "ペットに必要なケアと希望者の計画を照らし、重要な不一致や質問を整理します。",
  verification: "提出済み書類と本人確認、住居の飼育許可、同居者の同意などの状態を記録します。",
  meeting: "会話や住環境を通して、実際のお世話の体制を確かめます。",
  trial: "一定期間一緒に暮らし、ケアの継続や相性を確認します。",
  final_review: "残る確認事項と双方の合意を踏まえ、担当者が理由を記録します。",
};
