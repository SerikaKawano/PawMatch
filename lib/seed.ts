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
  momo: "ドメスティック・ショートヘア（キジトラ）", yuki: "ドメスティック・ショートヘア（白）", sora: "ボーダー・コリー系ミックス",
  kai: "ラブラドール・レトリーバー", hana: "ドメスティック・ショートヘア（三毛）", riku: "ドメスティック・ショートヘア（白黒）",
  haru: "ミニチュア・ダックスフンド", nagi: "コッカプー",
};
const basePets: Pet[] = scenarios.map((scenario,index)=>({
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
const testerPetSeeds = [
  { id: "tester-pet-1", sourceId: "nagi", ownerId: "tester-1-rehomer", name: "Archie", listingNumber: "T8K4W1P6", breed: "コッカプー" },
  { id: "tester-pet-2", sourceId: "riku", ownerId: "tester-2-rehomer", name: "Poppy", listingNumber: "R3M9C7H2", breed: "ドメスティック・ショートヘア（白黒）" },
  { id: "tester-pet-3", sourceId: "kai", ownerId: "tester-3-rehomer", name: "Alfie", listingNumber: "V6D2Q8N5", breed: "ラブラドール・レトリーバー" },
  { id: "tester-pet-4", sourceId: "momo", ownerId: "tester-4-rehomer", name: "Willow", listingNumber: "L9F3B7X4", breed: "ドメスティック・ショートヘア（キジトラ）" },
  { id: "tester-pet-5", sourceId: "sora", ownerId: "tester-5-rehomer", name: "Milo", listingNumber: "C4J8T2S7", breed: "ボーダー・コリー系ミックス" },
] as const;
const testerPets: Pet[] = testerPetSeeds.map((seed, index) => ({
  ...basePets.find(pet => pet.id === seed.sourceId)!,
  ...seed,
  ownerId: seed.ownerId,
  listedAt: `2026-09-29T0${index + 8}:00:00.000Z`,
  applications: 1,
  summary: "模擬検証用の掲載データです。実在する参加者の操作記録ではありません。",
  careNeeds: ["模擬検証用の情報です。画面表示と操作フローの確認に使用します。"],
}));
export const pets: Pet[] = [...basePets, ...testerPets];
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
const baseApplicants:Applicant[]=scenarios.flatMap((scenario,index)=>scenario.candidates.map((candidate,i)=>{
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

const completeVerification: VerificationStatus = {
  identity: "verified", housing: "verified", cohabitantConsent: "verified", lifelongCare: "verified", followUp: "verified",
};
const pendingVerification: VerificationStatus = {
  identity: "verified", housing: "pending", cohabitantConsent: "not_provided", lifelongCare: "pending", followUp: "pending",
};
const testerApplicationSeeds = [
  { number: 1, stage: "risk_review", decision: "decline", note: "test test test — 住居条件を試しに変更したため、要確認として操作後に見送りを選択。", completed: true },
  { number: 2, stage: "trial", decision: "hold", note: "ボタン、日付、メモ欄を自由に操作。トライアル結果は未確定のまま保存。", completed: false },
  { number: 3, stage: "final_review", decision: "approve", note: "各工程の表示を確認し、模擬データとして譲渡完了まで操作。", completed: true },
  { number: 4, stage: "meeting", decision: "hold", note: "test と短いメモを入力し、面談工程で途中保存。", completed: false },
  { number: 5, stage: "trial", decision: "decline", note: "トライアル項目を確認後、相性面を要確認として見送りを選択。", completed: true },
] as const;

function testerTimeline(number: number, stage: ReviewStage, completed: boolean): NonNullable<Applicant["stageTimeline"]> {
  const started = Date.parse(`2026-09-29T1${number}:00:00.000Z`);
  const currentIndex = reviewStages.indexOf(stage);
  return Object.fromEntries(reviewStages.slice(0, currentIndex + 1).map((item, index) => {
    const startedAt = new Date(started + index * 4 * 60_000).toISOString();
    const isDone = index < currentIndex || (index === currentIndex && completed);
    return [item, isDone ? { startedAt, completedAt: new Date(started + (index * 4 + 2) * 60_000).toISOString() } : { startedAt }];
  }));
}

const testerApplicants: Applicant[] = testerApplicationSeeds.map((seed, index) => {
  const base = baseApplicants[index];
  const pet = testerPets[index];
  const reviewerId = `tester-${seed.number}-reviewer` as DemoUserId;
  const rehomerId = `tester-${seed.number}-rehomer` as DemoUserId;
  const adopterId = `tester-${seed.number}-adopter` as DemoUserId;
  const reviewerName = `Tester-${seed.number}-Reviewer`;
  const rehomerName = `Tester-${seed.number}-Rehomer`;
  const decisionAt = `2026-09-29T1${seed.number}:28:00.000Z`;
  const decided = seed.decision !== "hold";
  const reachedTrial = seed.stage === "trial" || seed.stage === "final_review";
  const signoff = {
    reviewer: { userId: reviewerId, name: reviewerName, at: decisionAt, note: seed.note },
    rehomer: { userId: rehomerId, name: rehomerName, at: `2026-09-29T1${seed.number}:26:00.000Z`, note: "模擬操作として確認しました。" },
  };
  return {
    ...base,
    id: `tester-application-${seed.number}`,
    petId: pet.id,
    userId: adopterId,
    name: `Tester-${seed.number}-Adopter`,
    submittedAt: "2026-09-29",
    household: "30分の自由操作で入力画面と表示を確認するためのデータ",
    housing: seed.number === 1 ? "test test test" : "模擬入力：住居情報を入力して保存",
    experience: "模擬入力：フォーム、選択肢、戻る操作を自由に確認",
    availability: "模擬入力：30分の操作枠内で時刻や文章を試行",
    stage: seed.stage,
    stageTimeline: testerTimeline(seed.number, seed.stage, seed.completed),
    verification: seed.decision === "approve" ? completeVerification : pendingVerification,
    risks: seed.decision === "decline" ? [{ severity: "medium", label: "模擬の要確認", detail: seed.note }] : [],
    nextActions: decided ? [] : ["模擬操作を続ける、または途中保存の表示を確認する"],
    review: {
      revision: 1,
      stage: seed.stage,
      verification: seed.decision === "approve" ? completeVerification : pendingVerification,
      meetingChecks: seed.stage === "meeting" || reachedTrial ? [true, seed.number !== 4, true] : [false, false, false],
      trialChecks: reachedTrial ? [true, seed.number === 3, true] : [false, false, false],
      trial: reachedTrial ? {
        periodFrom: "2026-09-29", periodTo: "2026-09-29",
        transportFrom: "模擬入力：譲渡者住所", transportTo: "模擬入力：里親希望者住所",
        transportMethod: "test / 自家用車", result: seed.decision === "approve" ? "ok" : seed.decision === "decline" ? "ng" : "pending",
        criteria: { housing: "ok", compatibility: seed.number === 5 ? "ng" : seed.number === 2 ? "pending" : "ok", dailyCare: "ok", contingency: seed.decision === "hold" ? "pending" : "ok" },
        memo: seed.note,
      } : undefined,
      note: seed.note,
      decision: seed.decision,
      decisionRecorded: decided,
      riskAcknowledged: true,
      signoffs: seed.stage === "meeting" ? { meeting: signoff } : seed.stage === "trial" ? { trial: signoff } : seed.stage === "final_review" ? { final_review: signoff } : undefined,
      history: [
        { at: `2026-09-29T1${seed.number}:05:00.000Z`, stage: seed.stage, action: "模擬セッションを開始", note: "実参加者から収集したデータではありません", actorName: reviewerName, actorRole: "reviewer" },
        { at: decisionAt, stage: seed.stage, action: seed.decision === "approve" ? "模擬操作で譲渡完了" : seed.decision === "decline" ? "模擬操作で今回は見送る" : "模擬操作を途中保存", note: seed.note, actorName: reviewerName, actorRole: "reviewer" },
      ],
    },
  };
});

export const applicants: Applicant[] = [...baseApplicants, ...testerApplicants];
