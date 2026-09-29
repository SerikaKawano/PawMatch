import type { Applicant, Pet, ReviewRecord, ReviewStage, VerificationStatus } from "./types";
import { scenarios } from "./research/scenarios";
import { assess } from "./research/scoring";
import { reviewStages } from "./review-store";
import { petProfiles } from "./pet-profiles";
import { petEditorial } from "./pet-editorial";
import { demoUsers, type DemoUserId } from "./demoUsers";

const petOwners: Record<string, Pet["ownerId"]> = {
  momo: "rehomer", yuki: "rehomer", sora: "rehomer", kai: "rehomer",
  hana: "rehomer-hana", riku: "rehomer-riku", haru: "rehomer-haru", nagi: "rehomer-nagi",
};

const breeds: Record<string, string> = {
  momo: "日本猫・キジトラ", yuki: "日本猫・白猫", sora: "柴犬系ミックス",
  kai: "ゴールデン・レトリバー", hana: "日本猫・三毛", riku: "日本猫・白黒",
  haru: "ミニチュア・ダックスフンド", nagi: "トイ・プードル",
};
export const pets: Pet[] = scenarios.map((scenario,index)=>({
  id:scenario.petId,ownerId:petOwners[scenario.petId],name:scenario.petName,species:scenario.species,breed:breeds[scenario.petId],
  listedAt:`2026-08-${String(index+3).padStart(2,"0")}T09:00:00.000Z`,
  age:scenario.age,sex:index%2?"Male":"Female",location:scenario.location,
  temperament:scenario.species==="Cat"?["ゆっくり信頼関係を築く"]:["家族との時間が好き"],
  careNeeds:[scenario.animalNeeds],summary:scenario.animalNeeds,emoji:scenario.species==="Cat"?"🐈":"🐕",
  imageUrl:"/pets/"+scenario.petId+".webp",
  accent:index%2?"peach":"sage",applications:scenario.candidates.length,
  ...petProfiles[scenario.petId],
  listingNumber: petEditorial[scenario.petId].listingNumber,
  birthDate: petEditorial[scenario.petId].birthDate,
  birthDateApproximate: petEditorial[scenario.petId].birthDateApproximate,
  health: { ...petProfiles[scenario.petId].health!, vaccinationHistory: petEditorial[scenario.petId].vaccinationHistory, recordEvidence: petEditorial[scenario.petId].recordEvidence },
  rehoming: { ...petProfiles[scenario.petId].rehoming!, story: petEditorial[scenario.petId].story, conditionsMessage: petEditorial[scenario.petId].conditionsMessage, livingPoints: petEditorial[scenario.petId].livingPoints, pedigree: petEditorial[scenario.petId].pedigree, trial: petEditorial[scenario.petId].trial, fees: petEditorial[scenario.petId].fees },
}));
const aliases:Record<string,string>={"senior-a":"app-aiko","senior-b":"app-ren","senior-c":"app-mai","active-a":"app-daichi"};
const adopterCases: Record<string, { userId: DemoUserId; stage: Applicant["stage"] }> = {
  "senior-a": { userId: "adopter", stage: "screening" },
  "indoor-d": { userId: "adopter-olivia", stage: "final_review" },
  "active-a": { userId: "adopter-amelia", stage: "meeting" },
  "pending-b": { userId: "adopter-ethan", stage: "risk_review" },
  "multi-c": { userId: "adopter-grace", stage: "verification" },
  "preference-a": { userId: "adopter-oliver", stage: "trial" },
  "active-d": { userId: "adopter-jack", stage: "final_review" },
};
const adopterSubmittedDates: Partial<Record<DemoUserId, string>> = {
  adopter: "2026-09-03", "adopter-olivia": "2026-09-07", "adopter-amelia": "2026-09-07",
  "adopter-ethan": "2026-09-11", "adopter-grace": "2026-09-15", "adopter-oliver": "2026-09-16", "adopter-jack": "2026-09-13",
};
type TrialCriterion = "housing" | "compatibility" | "dailyCare" | "contingency";
type PreparedOutcome = {
  stage: "risk_review" | "trial" | "final_review";
  decision: "decline" | "approve";
  kind: "clear" | "borderline" | "adopted";
  reason: string;
  trialFailure?: TrialCriterion;
};
const preparedOutcomes: Record<string, PreparedOutcome> = {
  "indoor-b": {
    stage: "risk_review",
    decision: "decline",
    kind: "clear",
    reason: "現在の住居はペット飼育不可で、飼育可能な転居先も決まっていません。安全に迎えられる住環境を確認できないため、今回は見送ります。",
  },
  "active-c": {
    stage: "trial",
    decision: "decline",
    kind: "borderline",
    trialFailure: "compatibility",
    reason: "日々のお世話は実施できましたが、幼児との生活空間を安全に分ける運用が安定せず、トライアル中も双方の緊張が続きました。家族とペット双方の安全を優先し、今回は見送ります。",
  },
  "active-d": { stage: "final_review", decision: "approve", kind: "adopted", reason: "書類、面談、住環境、トライアルの確認が完了し、運動時間と留守時のお世話体制も継続できることを双方で確認したため、譲渡を成立としました。" },
  "multi-b": { stage: "risk_review", decision: "decline", kind: "clear", reason: "先住猫を分離できる部屋がなく、初期の隔離と段階的な対面を安全に行う計画を確認できなかったため、今回は見送ります。" },
  "multi-d": { stage: "trial", decision: "decline", kind: "borderline", trialFailure: "compatibility", reason: "段階的な対面を続けましたが、先住動物の食欲低下と威嚇が改善せず、双方の負担が大きいと判断したため、今回は見送ります。" },
  "multi-a": { stage: "final_review", decision: "approve", kind: "adopted", reason: "先住猫との隔離場所、段階的な導入方法、個別の食事管理を確認し、トライアルでも落ち着いて過ごせたため、譲渡を成立としました。" },
  "preference-c": { stage: "risk_review", decision: "decline", kind: "clear", reason: "申告された住居では完全室内飼育と玄関の脱走防止対策を実施できず、譲渡条件との重要な不一致があるため、今回は見送ります。" },
  "preference-b": { stage: "trial", decision: "decline", kind: "borderline", trialFailure: "dailyCare", reason: "トライアル中に長時間の留守番が複数回あり、決めた給餌時間と日々の見守りを継続できなかったため、今回は見送ります。" },
  "preference-d": { stage: "final_review", decision: "approve", kind: "adopted", reason: "完全室内飼育、脱走防止、毎日の見守りについて具体的な準備が整い、トライアルも問題なく完了したため、譲渡を成立としました。" },
  "emergency-a": { stage: "risk_review", decision: "decline", kind: "clear", reason: "入院や災害時に代わって世話をする人と預け先が決まっておらず、継続飼育の体制を確認できないため、今回は見送ります。" },
  "emergency-c": { stage: "trial", decision: "decline", kind: "borderline", trialFailure: "contingency", reason: "通常のお世話はできましたが、急な通院時の移動手段と不在時の支援者をトライアル期間中に確保できなかったため、今回は見送ります。" },
  "emergency-b": { stage: "final_review", decision: "approve", kind: "adopted", reason: "日常のお世話に加え、緊急連絡先、通院手段、長期不在時の預け先を確認でき、トライアルも安定していたため、譲渡を成立としました。" },
  "equivalent-d": { stage: "risk_review", decision: "decline", kind: "clear", reason: "申込み後に同居予定者の同意が得られないことが判明しました。書類上の適合度とは別に、家庭内の合意を確認できないため、今回は見送ります。" },
  "equivalent-a": { stage: "trial", decision: "decline", kind: "borderline", trialFailure: "compatibility", reason: "書類上の飼育計画に問題はありませんでしたが、トライアル中にペットの強い緊張と食欲低下が続いたため、相性と福祉を優先して今回は見送ります。" },
  "equivalent-b": { stage: "final_review", decision: "approve", kind: "adopted", reason: "同居者の同意、留守時の支援、医療計画を確認し、トライアルでも生活リズムと相性に問題がなかったため、譲渡を成立としました。" },
};
const timelineOffsets: Record<Applicant["stage"], { start: number; complete?: number }> = {
  screening: { start: 0, complete: 2 },
  risk_review: { start: 2, complete: 26 },
  verification: { start: 26, complete: 32 },
  meeting: { start: 32, complete: 50 },
  trial: { start: 50, complete: 103 },
  final_review: { start: 103 },
};
function buildStageTimeline(submittedAt:string,currentStage:Applicant["stage"],variation:number):NonNullable<Applicant["stageTimeline"]>{
  const normalizedCurrent=currentStage==="screening"?"risk_review":currentStage;
  const currentIndex=reviewStages.indexOf(normalizedCurrent);
  const base=Date.parse(submittedAt+"T00:00:00.000Z");
  const minuteOffset=(variation%6)*7;
  return Object.fromEntries(reviewStages.slice(0,currentIndex+1).map((stage,index)=>{
    const timing=timelineOffsets[stage];
    const startedAt=new Date(base+(timing.start*60+minuteOffset)*60_000).toISOString();
    const completedAt=index<currentIndex&&timing.complete!==undefined
      ?new Date(base+(timing.complete*60+minuteOffset)*60_000).toISOString():undefined;
    return [stage,completedAt?{startedAt,completedAt}:{startedAt}];
  }));
}
function buildPreparedReview(candidateId:string,stage:ReviewStage,verification:VerificationStatus,submittedAt:string,ownerId:Pet["ownerId"]):ReviewRecord|undefined{
  const outcome=preparedOutcomes[candidateId];
  if(!outcome)return undefined;
  const reachedTrial=stage==="trial"||stage==="final_review";
  const adopted=outcome.decision==="approve";
  const base=Date.parse(`${submittedAt}T00:00:00.000Z`);
  const atHours=(hours:number)=>new Date(base+hours*60*60*1000).toISOString();
  const atDay=(days:number)=>new Date(base+days*24*60*60*1000).toISOString().slice(0,10);
  const decidedAt=atHours(stage==="risk_review"?30:stage==="trial"?270:300);
  const reviewer={userId:"reviewer",name:"Sophie Bennett",at:decidedAt,note:outcome.reason};
  const owner=demoUsers.find(user=>user.id===ownerId)!;
  const rehomer={userId:owner.id,name:owner.name,at:new Date(Date.parse(decidedAt)-60*60*1000).toISOString(),note:"ペットの様子と家庭での受入れ状況を確認しました。"};
  const criteria={housing:"ok",compatibility:"ok",dailyCare:"ok",contingency:"ok"} as const;
  const trialCriteria=reachedTrial&&outcome.trialFailure?{...criteria,[outcome.trialFailure]:"ng" as const}:criteria;
  return {
    revision:1,stage,verification:adopted?{identity:"verified",housing:"verified",cohabitantConsent:"verified",lifelongCare:"verified",followUp:"verified"}:verification,
    meetingChecks:reachedTrial?[true,true,true]:[false,false,false],trialChecks:reachedTrial?[true,true,true]:[false,false,false],
    trial:reachedTrial?{periodFrom:atDay(3),periodTo:atDay(9),transportFrom:"譲渡者宅",transportTo:"申込者宅",transportMethod:"譲渡者が車で対面受け渡し",result:outcome.decision==="decline"?"ng":"ok",criteria:trialCriteria,memo:outcome.reason}:{periodFrom:"",periodTo:"",transportFrom:"",transportTo:"",transportMethod:"",result:"pending",criteria:{housing:"pending",compatibility:"pending",dailyCare:"pending",contingency:"pending"},memo:""},
    note:outcome.reason,decision:outcome.decision,decisionRecorded:true,riskAcknowledged:true,
    signoffs:stage==="trial"?{trial:{reviewer,rehomer}}:stage==="final_review"?{final_review:{reviewer,rehomer}}:undefined,
    history:[{at:decidedAt,stage,note:outcome.reason,actorName:"Sophie Bennett",actorRole:"reviewer",action:adopted?"Sophie Bennettが最終判断を確定し、譲渡済みとして記録":`Sophie Bennettが今回は見送りを記録（${outcome.kind==="clear"?"明確な不一致":"境界ケース"}）`}],
  };
}
export const applicants:Applicant[]=scenarios.flatMap((scenario,index)=>scenario.candidates.map((candidate,i)=>{
  const assessment=assess(candidate);
  const linked = adopterCases[candidate.id];
  const preparedSubmittedAt=preparedOutcomes[candidate.id]?`2026-09-${String(2+((index*4+i)%8)).padStart(2,"0")}`:undefined;
  const submittedAt=linked ? adopterSubmittedDates[linked.userId]! : preparedSubmittedAt ?? "2026-09-"+String(index*3+i+1).padStart(2,"0");
  const stage=preparedOutcomes[candidate.id]?.stage ?? linked?.stage ?? reviewStages[(index*4+i)%reviewStages.length];
  const stageTimeline=buildStageTimeline(submittedAt,stage,index*4+i);
  const review=buildPreparedReview(candidate.id,stage,candidate.verification,submittedAt,petOwners[scenario.petId]);
  if(review)stageTimeline[stage]={...stageTimeline[stage]!,completedAt:review.history.at(-1)!.at};
  return {
    id:aliases[candidate.id]??"app-"+candidate.id,petId:scenario.petId,
    name: linked ? demoUsers.find(user => user.id === linked.userId)!.name : candidate.name,
    userId: linked?.userId, submittedAt,
    household:candidate.household,housing:candidate.evidence.housing.detail,experience:candidate.evidence.care.detail,
    availability:candidate.evidence.time.detail,existingPets:candidate.evidence.integration.detail,
    veterinaryAccess:candidate.evidence.medical.detail,financialReadiness:candidate.evidence.medical.detail,
    score:assessment.score,strengths:assessment.breakdown.filter(row=>row.state==="ready").map(row=>row.label+"の計画あり"),
    risks:assessment.risks,nextActions:assessment.nextActions.length?assessment.nextActions:["面談で具体的な計画と意思を確認する"],
    verification:candidate.verification,stage,stageTimeline,review,
    researchCandidate:candidate,assessment,
  };
}));
