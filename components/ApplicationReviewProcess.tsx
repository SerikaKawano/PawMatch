"use client";
import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, CircleDotDashed, ClipboardCheck, Clock3, HeartHandshake, MinusCircle, PawPrint, PauseCircle, UserRound } from "lucide-react";
import type { Applicant, Pet, ReviewRecord, ReviewStage } from "@/lib/types";
import type { DemoRole } from "@/lib/demoUsers";
import type { AdopterDocumentSummary } from "@/lib/adopter-documents";
import type { DocumentRequest } from "@/lib/document-requests";
import type { AdopterProfile, AdopterProfileFields } from "@/lib/adopter-profile";
import { verificationLabels, verificationStateLabels } from "@/lib/research/scoring";
import { AssessmentPanel } from "./research/AssessmentPanel";
import { translateText } from "@/lib/i18n";
import { reviewStageDescriptions } from "@/lib/review-labels";
const stages: {id:ReviewStage;label:string}[] = [
  {id:"screening",label:"申込み受付"},{id:"risk_review",label:"適合性確認"},{id:"verification",label:"書類確認"},
  {id:"meeting",label:"面談"},{id:"trial",label:"トライアル"},{id:"final_review",label:"最終判断"},
];
const emptyTrial:NonNullable<ReviewRecord["trial"]> = {periodFrom:"",periodTo:"",transportFrom:"",transportTo:"",transportMethod:"",result:"pending",criteria:{housing:"pending",compatibility:"pending",dailyCare:"pending",contingency:"pending"},memo:""};
const trialCriteriaLabels = [
  {key:"housing",label:"住環境と安全",detail:"飼育場所と脱走防止"},
  {key:"compatibility",label:"家族・先住動物との相性",detail:"無理のない段階的な導入"},
  {key:"dailyCare",label:"日々のケア",detail:"給餌・運動・投薬・通院の継続"},
  {key:"contingency",label:"留守・緊急時の対応",detail:"代わりに世話をする人と連絡体制"},
] as const;
const basicProfileFields:{key:keyof AdopterProfileFields;label:string}[]=[{key:"fullName",label:"氏名"},{key:"gender",label:"性別"},{key:"ageRange",label:"年代"},{key:"employment",label:"仕事の状況"},{key:"contact",label:"連絡先"},{key:"region",label:"お住まいの地域"}];
const detailProfileFields:{key:keyof AdopterProfileFields;label:string}[]=[{key:"household",label:"一緒に暮らす人"},{key:"householdConsent",label:"同居者の同意"},{key:"allergies",label:"家族のアレルギー"},{key:"existingPets",label:"先住動物"},{key:"housing",label:"住まいと飼育環境"},{key:"housingPermission",label:"住居の飼育許可"},{key:"timeAway",label:"留守にする時間"},{key:"primaryCarer",label:"主なお世話の担当"},{key:"careExperience",label:"飼育経験"},{key:"dailyCare",label:"日々のお世話"},{key:"veterinaryPlan",label:"通院・健康管理の計画"},{key:"careBudget",label:"飼育費・医療費への備え"},{key:"adoptionReason",label:"お迎えを希望する理由"},{key:"emergencyPlan",label:"緊急時の対応"}];
export function ApplicationReviewProcess({application,pet,role,ownerName,canInspectAdopter=false,adopterProfile,initialDocuments=[],initialRequests=[]}:{application:Applicant;pet:Pet;role:DemoRole;ownerName:string;canInspectAdopter?:boolean;adopterProfile?:AdopterProfile;initialDocuments?:AdopterDocumentSummary[];initialRequests?:DocumentRequest[]}){
  const actorRole=role==="rehomer"?"rehomer":"reviewer";
  const [record,setRecord]=useState(application);
  const [draft,setDraft]=useState<ReviewRecord>(application.review!);
  const [confirmationNote,setConfirmationNote]=useState(()=>{
    const stage=application.stage;
    return (["meeting","trial","final_review"] as ReviewStage[]).includes(stage)?application.review?.signoffs?.[stage as "meeting"|"trial"|"final_review"]?.[actorRole]?.note??"":"";
  });
  const [view,setView]=useState(application.stage);
  const [message,setMessage]=useState("");
  const [declineReason,setDeclineReason]=useState("");
  const [busy,setBusy]=useState(false);
  const [documents]=useState(initialDocuments);
  const [requests,setRequests]=useState(initialRequests);
  const [requestKind,setRequestKind]=useState<"document"|"consent">("document");
  const [requestLabel,setRequestLabel]=useState("");
  const [requestDetail,setRequestDetail]=useState("");
  const current=stages.findIndex(s=>s.id===record.stage);
  const highRisks=record.assessment?.risks.filter(risk=>risk.severity==="high")??[];
  const pending=Object.values(draft.verification).filter(state=>state!=="verified").length;
  const finalState=record.review?.decisionRecorded ? record.review.decision : null;
  const jointStage=(["meeting","trial","final_review"] as ReviewStage[]).includes(record.stage);
  const confirmations=jointStage?draft.signoffs?.[record.stage as "meeting"|"trial"|"final_review"]:undefined;
  const ownConfirmed=Boolean(confirmations?.[actorRole]);
  const anyConfirmed=Boolean(confirmations?.reviewer||confirmations?.rehomer);
  const reviewerName=record.review?.history.filter(item=>item.actorRole==="reviewer").at(-1)?.actorName??"未定";
  const canOperate=record.stage!=="screening"&&(role!=="rehomer"||jointStage);
  const canEdit=canOperate&&!finalState&&view===record.stage&&!anyConfirmed&&!(role==="rehomer"&&record.stage==="final_review");
  const canEnterNote=canOperate&&!finalState&&view===record.stage&&!ownConfirmed;
  const activeNote=jointStage?confirmationNote:draft.note;
  const stateTone=finalState==="approve"?"positive":finalState==="decline"?"negative":finalState==="hold"?"caution":highRisks.length?"negative":pending?"caution":"positive";
  const stateLabel=finalState==="approve"?"最終判断を記録済み":finalState==="decline"?"審査を終了（見送り）":finalState==="hold"?"最終判断を記録済み（保留）":`${stages[current].label} を進行中`;
  async function save(action:"save"|"advance"|"confirm"|"decline"){
    if (action === "confirm" || action === "decline") {
      const decision = action === "decline" ? "今回は見送る" : action === "confirm" ? "この工程を確認済みにする" : { approve: "正式譲渡へ進める", hold: "追加確認・保留", decline: "今回は見送る" }[draft.decision];
      const question = document.documentElement.lang === "en"
        ? `Save “${translateText(decision)}” as the decision?\nPlease recheck the rationale and outstanding items.`
        : `「${decision}」を判断として保存しますか？\n判断理由と確認事項をもう一度ご確認ください。`;
      if (!window.confirm(question)) return;
    }
    setBusy(true);setMessage("");
    try{
      const {history:_history,signoffs:_signoffs,...body}=draft;void _history;void _signoffs;
      const nextStage=action==="advance"?stages[Math.min(current+1,5)].id:record.stage;
      const submittedNote=jointStage?confirmationNote:body.note;
      const response=await fetch("/api/applications/"+application.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({...body,action,stage:nextStage,note:action==="decline"&&jointStage?declineReason:submittedNote,decision:action==="decline"?"decline":body.decision,decisionRecorded:action==="decline"})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setRecord(result.data);setDraft(result.data.review);setView(result.data.stage);setConfirmationNote(result.data.stage===record.stage&&jointStage?submittedNote:"");setMessage(action==="decline" ? "見送りを記録しました。" : action==="confirm" ? "確認を記録しました。" : "確認内容と履歴を保存しました。");
    }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }
  function update(patch:Partial<ReviewRecord>){setDraft({...draft,...patch});setMessage("");}
  async function requestEvidence(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");
    try{
      const response=await fetch(`/api/applications/${application.id}/document-requests`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:requestKind,label:requestLabel,detail:requestDetail})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setRequests(items=>[...items,result.request]);setRequestLabel("");setRequestDetail("");setMessage("依頼を申込者のマイページへ送りました。");
    }catch(error){setMessage((error as Error).message);}finally{setBusy(false);}
  }
  const adopterHref=canInspectAdopter&&application.userId?`/reviews/adopters/${application.userId}`:`/reviews/applicants/${application.id}`;
  const trial:NonNullable<ReviewRecord["trial"]>={...emptyTrial,...draft.trial,criteria:{...emptyTrial.criteria!,...draft.trial?.criteria}};
  const fallbackIntakeProfile:Partial<Record<keyof AdopterProfileFields,string>>={fullName:record.name,household:record.household,housing:record.housing,timeAway:record.availability,careExperience:record.experience,existingPets:record.existingPets,veterinaryPlan:record.veterinaryAccess,careBudget:record.financialReadiness};
  const intakeProfileValue=(key:keyof AdopterProfileFields)=>adopterProfile?.[key]||fallbackIntakeProfile[key]||"未登録";
  function updateTrial(patch:Partial<NonNullable<ReviewRecord["trial"]>>){update({trial:{...trial,...patch}});}
  function updateTrialCriterion(key:keyof NonNullable<NonNullable<ReviewRecord["trial"]>["criteria"]>,value:"pending"|"ok"|"ng"){
    const criteria={...trial.criteria!,[key]:value};
    const results=Object.values(criteria);
    updateTrial({criteria,result:results.some(item=>item==="pending")?"pending":results.some(item=>item==="ng")?"ng":"ok"});
  }
  return <div className="research-page">
    <nav className="review-stepper" aria-label="審査工程">{stages.map((s,i)=><button type="button" key={s.id} disabled={i>current} className={(i===current?"active ":"")+(i<current?"done ":"")+(i>current?"upcoming ":"")} onClick={()=>{if(i<=current)setView(s.id);}} aria-current={view===s.id?"step":undefined}><span>{i<current?<CheckCircle2 size={20}/>:i+1}</span><strong>{s.label}</strong><small>{i<current?"完了":i===current&&finalState?"判断済み":i===current?"進行中":"未着手"}</small></button>)}</nav>
    <div className={`review-state-banner ${stateTone}`}>
      <div className="review-state-top" role="status">
        <div className="review-state-title"><span className="review-state-symbol" aria-hidden="true">{finalState==="approve"?<CheckCircle2 />:finalState==="decline"||highRisks.length>0?<AlertCircle />:finalState==="hold"?<PauseCircle />:pending>0?<Clock3 />:<CircleDotDashed />}</span><span className="review-state-copy"><small>現在の状態</small><strong>{stateLabel}</strong></span></div>
        {view!=="screening"&&(finalState||highRisks.length>0||pending>0)&&<p className="review-state-message">{finalState?"担当者の判断と理由が記録されています。":highRisks.length>0?`重要な確認 ${highRisks.length}件。詳細を確認の上、進行可否を判断してください。`:`確認待ち ${pending}件。未確認を「適合」と扱わず、次の対応を記録してください。`}</p>}
      </div>
      {view!=="screening"&&<div className="review-actor-status" aria-label="担当者の確認状況">
        <span className={`review-actor-pill ${confirmations?.reviewer?"confirmed":jointStage?"waiting":"neutral"}`}>{confirmations?.reviewer?<CheckCircle2 aria-hidden="true"/>:jointStage?<Clock3 aria-hidden="true"/>:<MinusCircle aria-hidden="true"/>}<span><strong>審査担当者</strong><small>{jointStage?confirmations?.reviewer?`確認済み · ${confirmations.reviewer.name}`:"確認待ち":reviewerName==="未定"?"未定":"確認中"}</small></span></span>
        <span className={`review-actor-pill ${confirmations?.rehomer?"confirmed":jointStage?"waiting":role==="rehomer"?"neutral no-action":"neutral"}`}>{confirmations?.rehomer?<CheckCircle2 aria-hidden="true"/>:jointStage?<Clock3 aria-hidden="true"/>:<MinusCircle aria-hidden="true"/>}<span><strong>譲渡者</strong><small>{jointStage?confirmations?.rehomer?`確認済み · ${confirmations.rehomer.name}`:"確認待ち":"この工程の操作は不要"}</small></span></span>
      </div>}
      <div className="review-case-participants" aria-label="審査対象と担当者">
        <span className="review-person pet"><PawPrint aria-hidden="true"/><span><small>ペット</small><Link href={`/pets/${pet.id}`}>{pet.name}</Link></span></span>
        <span className="review-person rehomer"><HeartHandshake aria-hidden="true"/><span><small>譲渡者</small><strong>{ownerName}</strong></span></span>
        <span className="review-person adopter"><UserRound aria-hidden="true"/><span><small>申込者</small><Link href={adopterHref}>{record.name}</Link></span></span>
        <span className="review-person reviewer"><ClipboardCheck aria-hidden="true"/><span><small>審査担当者</small><strong>{reviewerName}</strong></span></span>
      </div>
    </div>
    <div className="review-process-layout"><section className="research-card">
      <div className="review-stage-heading"><div><span>現在のフェーズ</span><h2>{stages.find(s=>s.id===view)?.label}</h2><p>{reviewStageDescriptions[view]}</p></div>{view!==record.stage&&view!=="screening"&&<button type="button" className="task-secondary" onClick={()=>setView(record.stage)}>進行中の工程へ戻る</button>}</div>
      {role==="rehomer"&&!jointStage&&view!=="screening"&&<p className="review-readonly-note review-no-action-note">この工程は審査担当者が確認します。譲渡者の操作は必要ありません。</p>}
      {jointStage&&anyConfirmed&&<p className="review-readonly-note">確認済みの工程内容は変更できません。{ownConfirmed?"相手の確認を待っています。":"内容を確認し、あなたの確認事項と判断事由を入力してください。"}</p>}
      {view==="screening"&&<div className="applicant-intake-sections"><section><h3>基本プロファイル</h3><dl className="applicant-intake-profile">{basicProfileFields.map(field=><div key={field.key}><dt>{field.label}</dt><dd>{intakeProfileValue(field.key)}</dd></div>)}</dl></section><section><h3>詳細プロファイル <small>任意</small></h3><dl className="applicant-intake-profile">{detailProfileFields.map(field=><div key={field.key}><dt>{field.label}</dt><dd>{intakeProfileValue(field.key)}</dd></div>)}</dl></section></div>}
      {view==="risk_review"&&(record.assessment?<AssessmentPanel assessment={record.assessment}/>:<p>この旧形式の点数は参考値です。判断理由と確認状態を別に確認してください。</p>)}
      {view==="verification"&&<>
        <h3>アップロード済みの書類</h3><ul className="review-document-list">{documents.length?documents.map(item=><li key={item.id}><strong>{item.label}</strong><a href={`/api/adopter-documents/${item.id}`}>{item.filename}</a><small>{new Date(item.uploadedAt).toLocaleDateString("ja-JP")}</small></li>):<li>提出済みの書類はありません。</li>}</ul>
        <h3>追加書類・同意の依頼</h3><ul className="review-document-list">{requests.length?requests.map(item=>{const uploaded=documents.find(doc=>doc.requestId===item.id);return <li key={item.id}><strong>{item.kind==="document"?"書類":"同意確認"}：{item.label}</strong><span>{item.kind==="document"?uploaded?"提出済み":"提出待ち":item.acknowledgedAt?"確認済み":"確認待ち"}</span>{item.detail&&<small>{item.detail}</small>}{uploaded&&<a href={`/api/adopter-documents/${uploaded.id}`}>{uploaded.filename}</a>}</li>}):<li>追加の依頼はありません。</li>}</ul>
        {!finalState&&role!=="rehomer"&&application.userId&&<form className="review-request-form" onSubmit={requestEvidence}><label>依頼の種類<select value={requestKind} onChange={e=>setRequestKind(e.target.value as "document"|"consent")}><option value="document">追加書類</option><option value="consent">内容の確認・同意</option></select></label><label>依頼内容<input required maxLength={80} value={requestLabel} onChange={e=>setRequestLabel(e.target.value)} placeholder="例：飼育計画の補足"/></label><label>補足<textarea maxLength={500} value={requestDetail} onChange={e=>setRequestDetail(e.target.value)}/></label><button type="submit" className="task-secondary" disabled={busy}>申込者へ依頼する</button></form>}
        <h3>確認項目の状態</h3><div className="verification-edit-grid">{Object.entries(verificationLabels).map(([key,label])=><label className={`verification-edit ${draft.verification[key as keyof typeof draft.verification]}`} key={key}><strong>{label}</strong><select disabled={!canEdit} value={draft.verification[key as keyof typeof draft.verification]} onChange={e=>update({verification:{...draft.verification,[key]:e.target.value}})}>{Object.entries(verificationStateLabels).map(([value,text])=><option value={value} key={value}>{text}</option>)}</select></label>)}</div>
      </>}
      {view==="meeting"&&<><div className="review-pet-reference"><strong>対象ペット：<Link href={`/pets/${pet.id}`}>{pet.name}</Link></strong><p>{pet.summary}</p><dl><div><dt>種類・年齢</dt><dd>{pet.breed}・{pet.age}</dd></div><div><dt>性格</dt><dd>{pet.temperament.join("、")}</dd></div><div><dt>必要なケア</dt><dd>{pet.careNeeds.join("、")}</dd></div><div><dt>住環境</dt><dd>{pet.rehoming?.livingPoints?.housing??"詳細プロファイルを確認"}</dd></div><div><dt>時間と生活</dt><dd>{pet.rehoming?.livingPoints?.time??"詳細プロファイルを確認"}</dd></div></dl></div>{["同居者の意思とお世話の分担を確認","不在時・旅行時・緊急時の支援を確認","飼育場所・脱走防止・先住動物との導入計画を確認"].map((text,i)=><label className="research-check" key={text}><input disabled={!canEdit} type="checkbox" checked={draft.meetingChecks[i]} onChange={e=>update({meetingChecks:draft.meetingChecks.map((v,n)=>n===i?e.target.checked:v)})}/>{text}</label>)}</>}
      {view==="trial"&&<fieldset className="review-trial-form" disabled={!canEdit}><div className="trial-section"><h3>トライアル期間</h3><div className="trial-fields"><label>FROM<input type="date" value={trial.periodFrom} onChange={e=>updateTrial({periodFrom:e.target.value})}/></label><label>TO<input type="date" value={trial.periodTo} onChange={e=>updateTrial({periodTo:e.target.value})}/></label></div></div><div className="trial-section"><h3>輸送場所・方法</h3><div className="trial-fields"><label>FROM<input maxLength={200} value={trial.transportFrom} onChange={e=>updateTrial({transportFrom:e.target.value})}/></label><label>TO<input maxLength={200} value={trial.transportTo} onChange={e=>updateTrial({transportTo:e.target.value})}/></label><label>輸送方法<input maxLength={200} value={trial.transportMethod} onChange={e=>updateTrial({transportMethod:e.target.value})} placeholder="例：譲渡者が車で対面受け渡し"/></label></div></div><div className="trial-section"><h3>トライアルで確認したこと</h3><p>項目ごとに結果を記録してください。</p>{trialCriteriaLabels.map(item=><div className={`trial-criterion ${trial.criteria?.[item.key]??"pending"}`} key={item.key}><div><strong>{item.label}</strong><small>{item.detail}</small></div><div className="trial-options">{(["pending","ok","ng"] as const).map(value=><label key={value}><input type="radio" name={`trial-${item.key}`} checked={(trial.criteria?.[item.key]??"pending")===value} onChange={()=>updateTrialCriterion(item.key,value)}/>{value==="pending"?"未確認":value==="ok"?"OK":"NG"}</label>)}</div></div>)}</div><div className="trial-section"><label>その他メモ<textarea maxLength={3000} value={trial.memo} onChange={e=>updateTrial({memo:e.target.value})}/></label></div></fieldset>}
      {view==="final_review"&&<><p>最終判断は審査担当者が記録し、譲渡者も内容を確認します。未確認事項と支援で解消できる点を検討してください。</p><label className="research-field">最終判断<select disabled={!canEdit||role==="rehomer"} value={draft.decision} onChange={e=>update({decision:e.target.value as ReviewRecord["decision"]})}><option value="hold">追加確認・保留</option><option value="approve">正式譲渡へ進める</option><option value="decline">今回は見送る</option></select></label><label className="research-check"><input disabled={!canEdit||role==="rehomer"} type="checkbox" checked={draft.riskAcknowledged} onChange={e=>update({riskAcknowledged:e.target.checked})}/>プロファイルの根拠・重要リスク・未確認事項を確認し、判断理由を記録した</label><p>「正式譲渡へ進める」には書類・面談・トライアルの確認が必要です。</p></>}
      {canOperate&&view===record.stage&&<label className="research-field">確認済の事項・未解決事項、判断事由（必須）<textarea disabled={!canEnterNote} maxLength={5000} value={activeNote} onChange={e=>jointStage?setConfirmationNote(e.target.value):update({note:e.target.value})} placeholder="確認内容を記録してください。個人情報は入力しないでください。" /></label>}
      {jointStage&&canOperate&&view===record.stage&&!finalState&&<label className="research-field">見送る場合の理由（応募者に開示されます）<textarea maxLength={5000} value={declineReason} onChange={event=>setDeclineReason(event.target.value)} placeholder="見送りの理由を記録してください" /></label>}
      {view!=="screening"&&<div className="research-actions review-save-actions" id="review-actions">{finalState?<p>この審査の判断は記録済みです。</p>:view===record.stage&&canOperate?<>{canEnterNote&&<button className="secondary-button" disabled={busy||!activeNote.trim()} onClick={()=>save("save")}>{busy ? "保存中…" : "内容を保存（工程は進めない）"}</button>}{jointStage?!ownConfirmed&&!(record.stage==="final_review"&&role==="rehomer"&&!confirmations?.reviewer)&&<button className="primary-button review-advance" disabled={busy||!activeNote.trim()} onClick={()=>save("confirm")}>{busy ? "保存中…" : "確認済みとして登録"}</button>:current<5&&<button className="primary-button review-advance" disabled={busy||!activeNote.trim()} onClick={()=>save("advance")}>{busy ? "保存中…" : "次の工程へ進める"} <ArrowRight/></button>}<button className="decision-button review-decline" disabled={busy||!(jointStage?declineReason.trim():activeNote.trim())} onClick={()=>save("decline")}>今回は見送る</button></>:null}</div>}<p role="status" aria-live="polite">{message}</p>
    </section></div>
  </div>;
}
