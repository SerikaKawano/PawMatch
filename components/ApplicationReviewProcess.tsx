"use client";
import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, PauseCircle } from "lucide-react";
import type { Applicant, Pet, ReviewRecord, ReviewStage } from "@/lib/types";
import type { AdopterDocumentSummary } from "@/lib/adopter-documents";
import type { DocumentRequest } from "@/lib/document-requests";
import { evidenceLabels, verificationLabels, verificationStateLabels } from "@/lib/research/scoring";
import { AssessmentPanel } from "./research/AssessmentPanel";
import { translateText } from "@/lib/i18n";
const stages: {id:ReviewStage;label:string}[] = [
  {id:"screening",label:"申込み受付"},{id:"risk_review",label:"適合性確認"},{id:"verification",label:"書類確認"},
  {id:"meeting",label:"面談・住環境"},{id:"trial",label:"トライアル"},{id:"final_review",label:"最終判断"},
];
const stageTasks: Record<ReviewStage,string> = {
  screening:"応募者の生活計画を読み、不足する回答を記録する",
  risk_review:"ペットの条件と応募者の計画を照らし、要確認事項を整理する",
  verification:"書類のアップロード状況を確認します。追加の書類や同意が必要な場合はこの画面から書類をやり取りすることができます。",
  meeting:"",
  trial:"",
  final_review:"未確認事項を見直し、人が判断と理由を記録する",
};
const emptyTrial = {periodFrom:"",periodTo:"",transportFrom:"",transportTo:"",transportMethod:"",result:"pending" as const,memo:""};
export function ApplicationReviewProcess({application,pet,canInspectAdopter=false,initialDocuments=[],initialRequests=[]}:{application:Applicant;pet:Pet;canInspectAdopter?:boolean;initialDocuments?:AdopterDocumentSummary[];initialRequests?:DocumentRequest[]}){
  const [record,setRecord]=useState(application);
  const [draft,setDraft]=useState<ReviewRecord>(application.review!);
  const [view,setView]=useState(application.stage);
  const [message,setMessage]=useState("");
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
  const stateTone=finalState==="approve"?"positive":finalState==="decline"?"negative":finalState==="hold"?"caution":highRisks.length?"negative":pending?"caution":"positive";
  const stateLabel=finalState==="approve"?"次の譲渡手続きへ":finalState==="decline"?"今回は見送り":finalState==="hold"?"追加確認のため保留":highRisks.length?"重要な懸念あり":pending?"確認待ちあり":"この工程を進行中";
  async function save(advance=false,final=false,decline=false){
    if (final || decline) {
      const decision = decline ? "今回は見送る" : { approve: "正式譲渡へ進める", hold: "追加確認・保留", decline: "今回は見送る" }[draft.decision];
      const question = document.documentElement.lang === "en"
        ? `Save “${translateText(decision)}” as the decision?\nPlease recheck the rationale and outstanding items.`
        : `「${decision}」を判断として保存しますか？\n判断理由と確認事項をもう一度ご確認ください。`;
      if (!window.confirm(question)) return;
    }
    setBusy(true);setMessage("");
    try{
      const {history:_history,...body}=draft;void _history;
      const nextStage=advance?stages[Math.min(current+1,5)].id:record.stage;
      const response=await fetch("/api/applications/"+application.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({...body,stage:nextStage,decision:decline?"decline":body.decision,decisionRecorded:final||decline?true:body.decisionRecorded})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setRecord(result.data);setDraft(result.data.review);setView(nextStage);setMessage(decline ? "見送りを記録しました。" : "確認内容と履歴を保存しました。");
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
  const trial=draft.trial??emptyTrial;
  function updateTrial(patch:Partial<typeof trial>){update({trial:{...trial,...patch}});}
  return <div className="research-page">
    <Link href={"/reviews?pet="+pet.id} className="back-link"><ArrowLeft />申込み比較へ戻る</Link>
    <header className="research-heading review-case-heading"><p>{pet.summary}</p></header>
    <nav className="review-stepper" aria-label="審査工程">{stages.map((s,i)=><button type="button" key={s.id} disabled={i>current} className={(i===current?"active ":"")+(i<current?"done ":"")+(i>current?"upcoming ":"")} onClick={()=>{if(i<=current)setView(s.id);}} aria-current={view===s.id?"step":undefined}><span>{i<current?<CheckCircle2 size={20}/>:i+1}</span><strong>{s.label}</strong><small>{i<current?"完了":i===current&&finalState?"判断済み":i===current?"進行中":"未着手"}</small></button>)}</nav>
    <div className={`review-state-banner ${stateTone}`} role="status"><div>{stateTone==="positive"?<CheckCircle2 />:stateTone==="negative"?<AlertCircle />:<PauseCircle />}<span><small>現在の状態 · {stages[current].label}</small><strong>{stateLabel}</strong></span></div><p>{finalState?"担当者の判断と理由が記録されています。":highRisks.length>0?`重要な確認 ${highRisks.length}件。詳細を確認の上、進行可否を判断してください。`:pending>0?`確認待ち ${pending}件。未確認を「適合」と扱わず、次の対応を記録してください。`:"確認した内容と判断理由を記録してから次へ進みます。"}</p></div>
    <div className="review-process-layout"><section className="research-card">
      <div className="review-case-profiles"><p><strong>ペット：</strong><Link href={`/pets/${pet.id}`}>{pet.name} <ArrowRight size={18}/></Link></p><p><strong>申込者：</strong><Link href={adopterHref}>{record.name} <ArrowRight size={18}/></Link></p></div>
      <div className="review-stage-heading"><div><span>現在のフェーズ</span><h2>{stages.find(s=>s.id===view)?.label}</h2>{stageTasks[view]&&<p>{stageTasks[view]}</p>}</div>{view!==record.stage&&<button type="button" className="task-secondary" onClick={()=>setView(record.stage)}>進行中の工程へ戻る</button>}</div>
      {view==="screening"&&<><div className="applicant-context"><div><strong>世帯・支援</strong><p>{record.household}</p></div><div><strong>希望</strong><p>{record.researchCandidate?.preferences??"未回答"}</p></div></div><h3>暮らしの計画</h3><div className="review-evidence-list">{[...(record.assessment?.breakdown??[])].sort((a,b)=>b.weight-a.weight).map(row=><div key={row.criterion} className={`review-evidence-row ${row.state}`}><div><strong>{row.label}</strong></div><span className="evidence-state">{evidenceLabels[row.state]}</span><p>{row.detail}</p></div>)}</div></>}
      {view==="risk_review"&&(record.assessment?<AssessmentPanel assessment={record.assessment}/>:<p>この旧形式の点数は参考値です。判断理由と確認状態を別に確認してください。</p>)}
      {view==="verification"&&<>
        <h3>アップロード済みの書類</h3><ul className="review-document-list">{documents.length?documents.map(item=><li key={item.id}><strong>{item.label}</strong><a href={`/api/adopter-documents/${item.id}`}>{item.filename}</a><small>{new Date(item.uploadedAt).toLocaleDateString("ja-JP")}</small></li>):<li>提出済みの書類はありません。</li>}</ul>
        <h3>追加書類・同意の依頼</h3><ul className="review-document-list">{requests.length?requests.map(item=>{const uploaded=documents.find(doc=>doc.requestId===item.id);return <li key={item.id}><strong>{item.kind==="document"?"書類":"同意確認"}：{item.label}</strong><span>{item.kind==="document"?uploaded?"提出済み":"提出待ち":item.acknowledgedAt?"確認済み":"確認待ち"}</span>{item.detail&&<small>{item.detail}</small>}{uploaded&&<a href={`/api/adopter-documents/${uploaded.id}`}>{uploaded.filename}</a>}</li>}):<li>追加の依頼はありません。</li>}</ul>
        {!finalState&&application.userId&&<form className="review-request-form" onSubmit={requestEvidence}><label>依頼の種類<select value={requestKind} onChange={e=>setRequestKind(e.target.value as "document"|"consent")}><option value="document">追加書類</option><option value="consent">内容の確認・同意</option></select></label><label>依頼内容<input required maxLength={80} value={requestLabel} onChange={e=>setRequestLabel(e.target.value)} placeholder="例：飼育計画の補足"/></label><label>補足<textarea maxLength={500} value={requestDetail} onChange={e=>setRequestDetail(e.target.value)}/></label><button type="submit" className="task-secondary" disabled={busy}>申込者へ依頼する</button></form>}
        <h3>確認項目の状態</h3><div className="verification-edit-grid">{Object.entries(verificationLabels).map(([key,label])=><label className={`verification-edit ${draft.verification[key as keyof typeof draft.verification]}`} key={key}><strong>{label}</strong><select value={draft.verification[key as keyof typeof draft.verification]} onChange={e=>update({verification:{...draft.verification,[key]:e.target.value}})}>{Object.entries(verificationStateLabels).map(([value,text])=><option value={value} key={value}>{text}</option>)}</select></label>)}</div>
      </>}
      {view==="meeting"&&<><div className="review-pet-reference"><strong>対象ペット：<Link href={`/pets/${pet.id}`}>{pet.name} <ArrowRight size={17}/></Link></strong><p>{pet.summary}</p><dl><div><dt>種類・年齢</dt><dd>{pet.breed}・{pet.age}</dd></div><div><dt>性格</dt><dd>{pet.temperament.join("、")}</dd></div><div><dt>必要なケア</dt><dd>{pet.careNeeds.join("、")}</dd></div><div><dt>住環境</dt><dd>{pet.rehoming?.livingPoints?.housing??"詳細プロファイルを確認"}</dd></div><div><dt>時間と生活</dt><dd>{pet.rehoming?.livingPoints?.time??"詳細プロファイルを確認"}</dd></div></dl></div>{["同居者の意思とお世話の分担を確認","不在時・旅行時・緊急時の支援を確認","飼育場所・脱走防止・先住動物との導入計画を確認"].map((text,i)=><label className="research-check" key={text}><input type="checkbox" checked={draft.meetingChecks[i]} onChange={e=>update({meetingChecks:draft.meetingChecks.map((v,n)=>n===i?e.target.checked:v)})}/>{text}</label>)}</>}
      {view==="trial"&&<div className="review-trial-form"><fieldset><legend>期間</legend><label>FROM<input type="date" value={trial.periodFrom} onChange={e=>updateTrial({periodFrom:e.target.value})}/></label><label>TO<input type="date" value={trial.periodTo} onChange={e=>updateTrial({periodTo:e.target.value})}/></label></fieldset><fieldset><legend>輸送場所・方法</legend><label>FROM<input maxLength={200} value={trial.transportFrom} onChange={e=>updateTrial({transportFrom:e.target.value})}/></label><label>TO<input maxLength={200} value={trial.transportTo} onChange={e=>updateTrial({transportTo:e.target.value})}/></label><label>輸送方法<input maxLength={200} value={trial.transportMethod} onChange={e=>updateTrial({transportMethod:e.target.value})} placeholder="例：譲渡者が車で対面受け渡し"/></label></fieldset><fieldset><legend>結果</legend><label className="trial-radio"><input type="radio" name="trial-result" checked={trial.result==="ok"} onChange={()=>updateTrial({result:"ok"})}/>OK</label><label className="trial-radio"><input type="radio" name="trial-result" checked={trial.result==="ng"} onChange={()=>updateTrial({result:"ng"})}/>NG</label></fieldset><label>その他メモ<textarea maxLength={3000} value={trial.memo} onChange={e=>updateTrial({memo:e.target.value})}/></label></div>}
      {view==="final_review"&&<><p>最終判断は担当者が行います。未確認事項と支援で解消できる点を検討し、属性だけで合否を決めないでください。</p><label className="research-field">担当者の判断<select value={draft.decision} onChange={e=>update({decision:e.target.value as ReviewRecord["decision"]})}><option value="hold">追加確認・保留</option><option value="approve">正式譲渡へ進める</option><option value="decline">今回は見送る</option></select></label><label className="research-check"><input type="checkbox" checked={draft.riskAcknowledged} onChange={e=>update({riskAcknowledged:e.target.checked})}/>プロフィールの根拠・重要リスク・未確認事項を確認し、判断理由を記録した</label><p>「正式譲渡へ進める」の保存には書類・面談の確認とトライアル結果OKが必要です。</p></>}
      <label className="research-field">確認した根拠・未解決事項・判断理由（必須）<textarea maxLength={5000} value={draft.note} onChange={e=>update({note:e.target.value})} placeholder="確認内容を記録してください。個人情報は入力しないでください。" /></label>
      <div className="research-actions review-save-actions" id="review-actions">{finalState?<p>この審査の判断は記録済みです。</p>:<><button className="secondary-button" disabled={busy||!draft.note.trim()} onClick={()=>save()}>{busy ? "保存中…" : "内容を保存（工程は進めない）"}</button>{view===record.stage&&current<5&&<button className="primary-button review-advance" disabled={busy||!draft.note.trim()} onClick={()=>save(true)}>{busy ? "保存中…" : "次の工程へ進める"} <ArrowRight/></button>}{view==="final_review"&&record.stage==="final_review"&&<button className="decision-button" disabled={busy||!draft.note.trim()} onClick={()=>save(false,true)}>判断と理由を保存</button>}{view===record.stage&&<button className="decision-button review-decline" disabled={busy||!draft.note.trim()} onClick={()=>save(false,false,true)}>今回は見送る</button>}</>}</div><p role="status" aria-live="polite">{message}</p>
    </section></div>
  </div>;
}
