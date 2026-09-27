"use client";
import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, PauseCircle } from "lucide-react";
import type { Applicant, Pet, ReviewRecord, ReviewStage } from "@/lib/types";
import { evidenceLabels, verificationLabels, verificationStateLabels } from "@/lib/research/scoring";
import { AssessmentPanel } from "./research/AssessmentPanel";
import { translateText } from "@/lib/i18n";
const stages: {id:ReviewStage;label:string}[] = [
  {id:"screening",label:"申込み受付"},{id:"risk_review",label:"適合性確認"},{id:"verification",label:"確認状況"},
  {id:"meeting",label:"面談・住環境"},{id:"trial",label:"トライアル"},{id:"final_review",label:"最終判断"},
];
const stageTasks: Record<ReviewStage,string> = {
  screening:"応募者の生活計画を読み、不足する回答を記録する",
  risk_review:"ペットの条件と応募者の計画を照らし、要確認事項を整理する",
  verification:"各確認項目の状態を更新し、残る証拠を記録する",
  meeting:"面談で確かめた内容をチェックし、根拠を記録する",
  trial:"トライアル中のケアと相性を確認し、結果を記録する",
  final_review:"未確認事項を見直し、人が判断と理由を記録する",
};
export function ApplicationReviewProcess({application,pet,isAdmin=false,canInspectAdopter=false}:{application:Applicant;pet:Pet;isAdmin?:boolean;canInspectAdopter?:boolean}){
  const [record,setRecord]=useState(application);
  const [draft,setDraft]=useState<ReviewRecord>(application.review!);
  const [view,setView]=useState(application.stage);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
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
  return <div className="research-page">
    <Link href={"/reviews?pet="+pet.id} className="back-link"><ArrowLeft />申込み比較へ戻る</Link>
    <header className="research-heading review-case-heading"><h1>申込みの確認</h1><div className="review-case-profiles"><p><strong>申込者：</strong><Link href={canInspectAdopter && application.userId ? `/reviews/adopters/${application.userId}` : `/reviews/applicants/${application.id}`}>{record.name} <ArrowRight size={18}/></Link></p><p><strong>ペット：</strong><Link href={`/pets/${pet.id}`}>{pet.name} <ArrowRight size={18}/></Link></p></div><p>{pet.summary}</p></header>
    <nav className="review-stepper" aria-label="審査工程">{stages.map((s,i)=><button type="button" key={s.id} className={(i===current?"active ":"")+(i<current?"done ":"")+(i>current?"upcoming ":"")} onClick={()=>setView(s.id)} aria-current={view===s.id?"step":undefined}><span>{i<current?<CheckCircle2 size={20}/>:i+1}</span><strong>{s.label}</strong><small>{i<current?"完了":i===current&&finalState?"判断済み":i===current?"進行中":"未着手"}</small></button>)}</nav>
    <div className={`review-state-banner ${stateTone}`} role="status"><div>{stateTone==="positive"?<CheckCircle2 />:stateTone==="negative"?<AlertCircle />:<PauseCircle />}<span><small>現在の状態 · {stages[current].label}</small><strong>{stateLabel}</strong></span></div><p>{finalState?"担当者の判断と理由が記録されています。":highRisks.length>0?`重要な確認 ${highRisks.length}件。詳細を確認の上、進行可否を判断してください。`:pending>0?`確認待ち ${pending}件。未確認を「適合」と扱わず、次の対応を記録してください。`:"確認した内容と判断理由を記録してから次へ進みます。"}</p></div>
    <div className="review-process-layout"><section className="research-card">
      <div className="review-stage-heading"><div><span>現在のフェーズ</span><h2>{stages.find(s=>s.id===view)?.label}</h2><p>{stageTasks[view]}</p></div>{view!==record.stage&&<button type="button" className="task-secondary" onClick={()=>setView(record.stage)}>進行中の工程へ戻る</button>}</div>
      {view==="screening"&&<><div className="applicant-context"><div><strong>世帯・支援</strong><p>{record.household}</p></div><div><strong>希望</strong><p>{record.researchCandidate?.preferences??"未回答"}</p></div></div><h3>暮らしの計画</h3><div className="review-evidence-list">{[...(record.assessment?.breakdown??[])].sort((a,b)=>b.weight-a.weight).map(row=><div key={row.criterion} className={`review-evidence-row ${row.state}`}><div><strong>{row.label}</strong></div><span className="evidence-state">{evidenceLabels[row.state]}</span><p>{row.detail}</p></div>)}</div></>}
      {view==="risk_review"&&(record.assessment?<AssessmentPanel assessment={record.assessment}/>:<p>この旧形式の点数は参考値です。判断理由と確認状態を別に確認してください。</p>)}
      {view==="verification"&&<><p>実物の書類・顔写真は扱いません。確認状態だけを記録します。</p><div className="verification-edit-grid">{Object.entries(verificationLabels).map(([key,label])=><label className={`verification-edit ${draft.verification[key as keyof typeof draft.verification]}`} key={key}><strong>{label}</strong><select value={draft.verification[key as keyof typeof draft.verification]} onChange={e=>update({verification:{...draft.verification,[key]:e.target.value}})}>{Object.entries(verificationStateLabels).map(([value,text])=><option value={value} key={value}>{text}</option>)}</select></label>)}</div></>}
      {view==="meeting"&&<><p>動物の必要なケアと応募者の具体的な生活計画を確認します。</p>{["同居者の意思とお世話の分担を確認","不在時・旅行時・緊急時の支援を確認","飼育場所・脱走防止・先住動物との導入計画を確認"].map((text,i)=><label className="research-check" key={text}><input type="checkbox" checked={draft.meetingChecks[i]} onChange={e=>update({meetingChecks:draft.meetingChecks.map((v,n)=>n===i?e.target.checked:v)})}/>{text}</label>)}</>}
      {view==="trial"&&<><p>トライアルの結果を記録します。</p>{["食事・睡眠・排泄と必要なケアの継続を確認","家族・先住動物との相性と分離方法を確認","継続が難しい場合の相談先と対応を確認"].map((text,i)=><label className="research-check" key={text}><input type="checkbox" checked={draft.trialChecks[i]} onChange={e=>update({trialChecks:draft.trialChecks.map((v,n)=>n===i?e.target.checked:v)})}/>{text}</label>)}</>}
      {view==="final_review"&&<><p>最終判断は担当者が行います。未確認事項と支援で解消できる点を検討し、属性だけで合否を決めないでください。</p><label className="research-field">担当者の判断<select value={draft.decision} onChange={e=>update({decision:e.target.value as ReviewRecord["decision"]})}><option value="hold">追加確認・保留</option><option value="approve">正式譲渡へ進める</option><option value="decline">今回は見送る</option></select></label><label className="research-check"><input type="checkbox" checked={draft.riskAcknowledged} onChange={e=>update({riskAcknowledged:e.target.checked})}/>プロフィールの根拠・重要リスク・未確認事項を確認し、判断理由を記録した</label><p>「正式譲渡へ進める」の保存には確認状態・面談・トライアルのチェックが必要です。</p></>}
      <label className="research-field">確認した根拠・未解決事項・判断理由（必須）<textarea maxLength={5000} value={draft.note} onChange={e=>update({note:e.target.value})} placeholder="確認内容を記録してください。個人情報は入力しないでください。" /></label>
      <div className="research-actions review-save-actions" id="review-actions">{finalState?<p>この審査の判断は記録済みです。</p>:<><button className="secondary-button" disabled={busy||!draft.note.trim()} onClick={()=>save()}>{busy ? "保存中…" : "内容を保存（工程は進めない）"}</button>{view===record.stage&&current<5&&<button className="primary-button review-advance" disabled={busy||!draft.note.trim()} onClick={()=>save(true)}>{busy ? "保存中…" : "次の工程へ進める"} <ArrowRight/></button>}{view==="final_review"&&record.stage==="final_review"&&<button className="decision-button" disabled={busy||!draft.note.trim()} onClick={()=>save(false,true)}>判断と理由を保存</button>}{view===record.stage&&<button className="decision-button review-decline" disabled={busy||!draft.note.trim()} onClick={()=>save(false,false,true)}>今回は見送る</button>}</>}</div><p role="status" aria-live="polite">{message}</p>
    </section><aside className="research-card review-history"><details><summary>{`保存済みの審査履歴（${record.review!.history.length}件）`}</summary>{record.review!.history.length===0?<p>まだ操作記録はありません。</p>:[...record.review!.history].reverse().map((event,i)=><article key={i} className="research-coding"><strong>{event.action}</strong><p>{new Date(event.at).toLocaleString("ja-JP")}</p><p className="preserve-lines">{event.note}</p></article>)}{isAdmin && <Link href="/admin/analytics" className="text-link">累積・履歴を見る →</Link>}</details></aside></div>
  </div>;
}
