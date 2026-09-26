import type { Applicant } from "./types";
export function selectRecords(view:string,applications:Applicant[]) {
  if(view==="attention")return applications.filter(a=>a.risks.some(r=>r.severity==="high"));
  if(view==="pending")return applications.filter(a=>Object.values(a.verification).some(v=>v!=="verified"));
  if(view==="meetings")return applications.filter(a=>a.stage==="meeting");
  if(view==="trials")return applications.filter(a=>a.stage==="trial");
  if(view==="my-applications")return applications.slice(1,2);
  if(view==="messages")return applications.slice(0,2);
  if(view==="adoptions")return applications.filter(a=>a.review?.decisionRecorded&&a.review.decision==="approve");
  return applications.filter(a=>!a.review?.decisionRecorded||a.review.decision==="hold");
}
