import { z } from "zod";
import { mutateStore, readStore } from "./persistence";
import type { Applicant, ReviewRecord, ReviewStage } from "./types";
import type { DemoUser } from "./demoUsers";
import { stageLabels } from "./review-labels";
export { stageLabels } from "./review-labels";
export const reviewStages: ReviewStage[] = ["screening","risk_review","verification","meeting","trial","final_review"];
const jointStages = ["meeting", "trial", "final_review"] as const;
type JointStage = typeof jointStages[number];
const isJointStage = (stage: ReviewStage): stage is JointStage => jointStages.includes(stage as JointStage);
const state=z.enum(["verified","pending","not_provided"]);
const trialFinding=z.enum(["pending","ok","ng"]);
const trialCriteria=z.object({housing:trialFinding,compatibility:trialFinding,dailyCare:trialFinding,contingency:trialFinding}).strict();
const emptyTrialCriteria={housing:"pending",compatibility:"pending",dailyCare:"pending",contingency:"pending"} as const;
const verificationNames:Record<keyof Applicant["verification"],string>={identity:"本人確認",housing:"飼育可能な住居",cohabitantConsent:"同居者の同意",lifelongCare:"終生飼養への同意",followUp:"譲渡後の連絡への同意"};
export const reviewInput = z.object({
  revision:z.number().int().nonnegative(),
  stage:z.enum(["screening","risk_review","verification","meeting","trial","final_review"]),
  verification:z.object({identity:state,housing:state,cohabitantConsent:state,lifelongCare:state,followUp:state}).strict(),
  meetingChecks:z.array(z.boolean()).length(3),trialChecks:z.array(z.boolean()).length(3),
  trial:z.object({periodFrom:z.string().max(10),periodTo:z.string().max(10),transportFrom:z.string().max(200),transportTo:z.string().max(200),transportMethod:z.string().max(200),result:trialFinding,criteria:trialCriteria.optional(),memo:z.string().max(3000)}).optional(),
  note:z.string().trim().min(1,"確認の根拠を記録してください").max(5000),
  decision:z.enum(["approve","hold","decline"]), decisionRecorded:z.boolean(), riskAcknowledged:z.boolean(),
  action:z.enum(["save","advance","confirm","decline","decide"]).optional(),
}).strict();
type ReviewStore = Record<string,ReviewRecord>;
const activeStage = (stage:ReviewStage):ReviewStage => stage==="screening"?"risk_review":stage;
const normalizeIntake = (record:ReviewRecord):ReviewRecord => record.stage==="screening"?{...record,stage:"risk_review"}:record;
export async function getReviewRecords():Promise<ReviewStore> {
  const records=await readStore<ReviewStore>("review-v1",()=>({}));
  return Object.fromEntries(Object.entries(records).map(([id,record])=>[id,normalizeIntake(record)]));
}
export function initialReview(app:Applicant):ReviewRecord {
  const attention=[
    ...app.risks.map(risk=>`${risk.label}：${risk.detail}`),
    ...Object.entries(app.verification).filter(([,state])=>state!=="verified").map(([field,state])=>`${verificationNames[field as keyof Applicant["verification"]]}：${state==="pending"?"確認待ち":"未提出"}`),
  ];
  const note=app.stage==="final_review"&&attention.length
    ? `要確認事項：${attention.join("／")}。確認後の対応：${app.nextActions.join("／")}`
    : "";
  return {revision:0,stage:activeStage(app.stage),verification:app.verification,meetingChecks:[false,false,false],trialChecks:[false,false,false],trial:{periodFrom:"",periodTo:"",transportFrom:"",transportTo:"",transportMethod:"",result:"pending",criteria:{...emptyTrialCriteria},memo:""},note,decision:"hold",decisionRecorded:false,riskAcknowledged:false,history:[]};
}
export async function saveReview(app:Applicant,input:unknown,actor:DemoUser) {
  const data=reviewInput.parse(input);
  return mutateStore<ReviewStore,ReviewRecord>("review-v1",()=>({}),store=>{
    const previous=normalizeIntake(store[app.id]??initialReview(app));
    if(data.revision!==previous.revision)throw new Error("別の画面で更新されています。再読み込みして内容を確認してください。");
    if(previous.decisionRecorded)throw new Error("判断が記録済みのため、この審査は更新できません。");
    if(!["reviewer","rehomer","admin"].includes(actor.role))throw new Error("このロールでは審査を更新できません。");
    const actorRole = actor.role === "rehomer" ? "rehomer" : "reviewer";
    const from=reviewStages.indexOf(previous.stage),to=reviewStages.indexOf(data.stage);
    if(to!==from&&to!==from+1)throw new Error("現在の工程を確認してから、次の工程へ進めてください。");
    const action=data.action??(data.decisionRecorded?(data.decision==="decline"?"decline":"decide"):to===from+1?"advance":"save");
    if(actorRole==="rehomer"&&!isJointStage(previous.stage))throw new Error("この工程は審査担当者が確認します。譲渡者の操作は必要ありません。");
    if(isJointStage(previous.stage)&&!['save','confirm','decline'].includes(action))throw new Error("この工程は審査担当者と譲渡者の双方の確認が必要です。");
    if(!isJointStage(previous.stage)&&['confirm','decide'].includes(action))throw new Error("この工程では双方の確認は行いません。");
    if(action==="advance"&&to!==from+1)throw new Error("次の工程を指定してください。");
    if(action!=="advance"&&to!==from)throw new Error("現在の工程を確認してください。");
    if(action==="decline"&&(!data.decisionRecorded||data.decision!=="decline"))throw new Error("見送りの判断を確認してください。");
    if(action!=="decline"&&data.decisionRecorded)throw new Error("双方の確認が完了する前に判断を確定できません。");
    if(data.trial?.periodFrom&&data.trial.periodTo&&data.trial.periodFrom>data.trial.periodTo)throw new Error("トライアルの終了日は開始日以降にしてください。");
    if(previous.stage==="trial"&&action==="confirm"&&(!data.trial?.periodFrom||!data.trial.periodTo||!data.trial.transportFrom.trim()||!data.trial.transportTo.trim()||!data.trial.transportMethod.trim()||!data.trial.criteria||Object.values(data.trial.criteria).some(value=>value==="pending")||data.trial.result==="pending"))throw new Error("トライアルの期間・輸送・各確認項目の結果を記録してください。");
    if(previous.stage==="trial"&&action==="confirm"&&data.trial?.criteria&&data.trial.result!==(Object.values(data.trial.criteria).some(value=>value==="ng")?"ng":"ok"))throw new Error("トライアルの総合結果と項目別の結果が一致しません。");
    if(previous.stage==="meeting"&&action==="confirm"&&data.meetingChecks.some(value=>!value))throw new Error("面談の確認項目を完了してください。");
    if(previous.stage==="final_review"&&action==="confirm"&&data.decision==="approve"){
      if(Object.values(data.verification).some(v=>v!=="verified")||data.meetingChecks.some(v=>!v)||data.trial?.result!=="ok")throw new Error("書類確認・面談・トライアルの結果を確認してください。");
      if(!data.riskAcknowledged)throw new Error("点数以外の根拠・残るリスクを確認し、判断理由を記録してください。");
    }
    const signoffs={...previous.signoffs};
    const currentSignoffs=isJointStage(previous.stage)?{...signoffs[previous.stage]}:null;
    if(currentSignoffs?.[actorRole]&&action==="save")throw new Error("この工程はすでに確認済みです。");
    if(currentSignoffs&&(action==="save"||action==="confirm")&&(currentSignoffs.reviewer||currentSignoffs.rehomer)){
      const unchanged=JSON.stringify({verification:data.verification,meetingChecks:data.meetingChecks,trial:data.trial,decision:data.decision,riskAcknowledged:data.riskAcknowledged})===JSON.stringify({verification:previous.verification,meetingChecks:previous.meetingChecks,trial:previous.trial,decision:previous.decision,riskAcknowledged:previous.riskAcknowledged});
      if(!unchanged)throw new Error("一方が確認済みの内容は変更できません。再確認が必要な場合は担当者へ連絡してください。");
    }
    if(action==="confirm"&&currentSignoffs){
      if(currentSignoffs[actorRole])throw new Error("この工程はすでに確認済みです。");
      if(previous.stage==="final_review"&&actorRole==="rehomer"&&!currentSignoffs.reviewer)throw new Error("審査担当者の最終判断を待ってください。");
      currentSignoffs[actorRole]={userId:actor.id,name:actor.name,at:new Date().toISOString(),note:data.note};
      signoffs[previous.stage as JointStage]=currentSignoffs;
    }
    const bothConfirmed=Boolean(currentSignoffs?.reviewer&&currentSignoffs?.rehomer);
    const nextStage=action==="confirm"&&bothConfirmed&&previous.stage!=="final_review"?reviewStages[from+1]:data.stage;
    const decisionRecorded=action==="decline"||(action==="confirm"&&bothConfirmed&&previous.stage==="final_review");
    const {revision:_revision,action:_action,...fields}=data;void _revision;void _action;
    const record:ReviewRecord={...fields,stage:nextStage,decisionRecorded,signoffs,revision:previous.revision+1,history:[...previous.history,{
      at:new Date().toISOString(),stage:nextStage,note:data.note,actorName:actor.name,actorRole,
      action:action==="decline"?`${actor.name}が今回は見送りを記録`:action==="confirm"?bothConfirmed?`${actor.name}が確認し、${previous.stage==="final_review"?"最終判断を確定":"次の工程へ進行"}`:`${actor.name}が${stageLabels[previous.stage]}を確認`:action==="advance"?stageLabels[previous.stage]+"を確認し、"+stageLabels[nextStage]+"へ進行":"確認内容を保存",
    }]};
    store[app.id]=record;return record;
  });
}
