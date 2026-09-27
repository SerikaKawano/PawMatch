import { z } from "zod";
import { mutateStore, readStore } from "./persistence";
import type { Applicant, ReviewRecord, ReviewStage } from "./types";
import { stageLabels } from "./review-labels";
export { stageLabels } from "./review-labels";
export const reviewStages: ReviewStage[] = ["screening","risk_review","verification","meeting","trial","final_review"];
const state=z.enum(["verified","pending","not_provided"]);
export const reviewInput = z.object({
  revision:z.number().int().nonnegative(),
  stage:z.enum(["screening","risk_review","verification","meeting","trial","final_review"]),
  verification:z.object({identity:state,housing:state,cohabitantConsent:state,lifelongCare:state,followUp:state}).strict(),
  meetingChecks:z.array(z.boolean()).length(3),trialChecks:z.array(z.boolean()).length(3),
  note:z.string().trim().min(1,"確認の根拠を記録してください").max(5000),
  decision:z.enum(["approve","hold","decline"]), decisionRecorded:z.boolean(), riskAcknowledged:z.boolean(),
}).strict();
type ReviewStore = Record<string,ReviewRecord>;
export const getReviewRecords=()=>readStore<ReviewStore>("review-v1",()=>({}));
export function initialReview(app:Applicant):ReviewRecord {
  return {revision:0,stage:app.stage,verification:app.verification,meetingChecks:[false,false,false],trialChecks:[false,false,false],note:"",decision:"hold",decisionRecorded:false,riskAcknowledged:false,history:[]};
}
export async function saveReview(app:Applicant,input:unknown) {
  const data=reviewInput.parse(input);
  return mutateStore<ReviewStore,ReviewRecord>("review-v1",()=>({}),store=>{
    const previous=store[app.id]??initialReview(app);
    if(data.revision!==previous.revision)throw new Error("別の画面で更新されています。再読み込みして内容を確認してください。");
    const from=reviewStages.indexOf(previous.stage),to=reviewStages.indexOf(data.stage);
    if(to!==from&&to!==from+1)throw new Error("現在の工程を確認してから、次の工程へ進めてください。");
    if(data.decisionRecorded&&data.stage!=="final_review")throw new Error("最終工程で判断を記録してください。");
    if(data.decisionRecorded&&data.decision==="approve"){
      if(Object.values(data.verification).some(v=>v!=="verified")||data.meetingChecks.some(v=>!v)||data.trialChecks.some(v=>!v))throw new Error("確認状況・面談・トライアルの確認を完了してください。");
      if(!data.riskAcknowledged)throw new Error("点数以外の根拠・残るリスクを確認し、判断理由を記録してください。");
    }
    const {revision:_revision,...fields}=data;void _revision;
    const record:ReviewRecord={...fields,revision:previous.revision+1,history:[...previous.history,{
      at:new Date().toISOString(),stage:data.stage,note:data.note,
      action:data.decisionRecorded?"担当者が判断を記録："+({approve:"正式譲渡へ進める",hold:"追加確認・保留",decline:"今回は見送り"}[data.decision]):to!==from?stageLabels[previous.stage]+"を確認し、"+stageLabels[data.stage]+"へ進行":"確認内容を保存",
    }]};
    store[app.id]=record;return record;
  });
}
