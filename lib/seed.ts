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
  "indoor-d": { userId: "adopter-olivia", stage: "verification" },
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
const declinedCases: Record<string, { stage: ReviewStage; kind: "clear" | "borderline"; reason: string }> = {
  "indoor-b": {
    stage: "risk_review",
    kind: "clear",
    reason: "現在の住居はペット飼育不可で、飼育可能な転居先も決まっていません。安全に迎えられる住環境を確認できないため、今回は見送ります。",
  },
  "active-c": {
    stage: "trial",
    kind: "borderline",
    reason: "日々のお世話は実施できましたが、幼児との生活空間を安全に分ける運用が安定せず、トライアル中も双方の緊張が続きました。家族とペット双方の安全を優先し、今回は見送ります。",
  },
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
function buildDeclinedReview(candidateId:string,stage:ReviewStage,verification:VerificationStatus,submittedAt:string):ReviewRecord|undefined{
  const declined=declinedCases[candidateId];
  if(!declined)return undefined;
  const borderline=declined.kind==="borderline";
  const decidedAt=new Date(Date.parse(`${submittedAt}T00:00:00.000Z`)+(borderline?270:30)*60*60*1000).toISOString();
  const reviewer={userId:"reviewer",name:"Sophie Bennett",at:decidedAt,note:declined.reason};
  const rehomer={userId:"rehomer",name:"Emma Wilson",at:new Date(Date.parse(decidedAt)-60*60*1000).toISOString(),note:"トライアルの状況と安全面を確認しました。"};
  return {
    revision:1,stage,verification,meetingChecks:borderline?[true,true,true]:[false,false,false],trialChecks:borderline?[true,true,true]:[false,false,false],
    trial:borderline?{periodFrom:"2026-09-13",periodTo:"2026-09-19",transportFrom:"譲渡者宅",transportTo:"申込者宅",transportMethod:"譲渡者が車で対面受け渡し",result:"ng",criteria:{housing:"ok",compatibility:"ng",dailyCare:"ok",contingency:"ok"},memo:"日常ケアは実施できた一方、幼児との安全な空間分離が安定しませんでした。"}:{periodFrom:"",periodTo:"",transportFrom:"",transportTo:"",transportMethod:"",result:"pending",criteria:{housing:"pending",compatibility:"pending",dailyCare:"pending",contingency:"pending"},memo:""},
    note:declined.reason,decision:"decline",decisionRecorded:true,riskAcknowledged:true,
    signoffs:borderline?{trial:{reviewer,rehomer}}:undefined,
    history:[{at:decidedAt,stage,note:declined.reason,actorName:"Sophie Bennett",actorRole:"reviewer",action:`Sophie Bennettが今回は見送りを記録（${declined.kind==="clear"?"明確な不一致":"境界ケース"}）`}],
  };
}
export const applicants:Applicant[]=scenarios.flatMap((scenario,index)=>scenario.candidates.map((candidate,i)=>{
  const assessment=assess(candidate);
  const linked = adopterCases[candidate.id];
  const submittedAt=linked ? adopterSubmittedDates[linked.userId]! : "2026-09-"+String(index*3+i+1).padStart(2,"0");
  const stage=declinedCases[candidate.id]?.stage ?? linked?.stage ?? reviewStages[(index*4+i)%reviewStages.length];
  const stageTimeline=buildStageTimeline(submittedAt,stage,index*4+i);
  const review=buildDeclinedReview(candidate.id,stage,candidate.verification,submittedAt);
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
