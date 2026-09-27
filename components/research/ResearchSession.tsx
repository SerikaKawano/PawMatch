"use client";
import { useState } from "react";
import type { ParticipantView, ResponseRecord } from "@/lib/research/types";
import { criteria } from "@/lib/research/types";
import { criterionLabels, verificationLabels, verificationStateLabels } from "@/lib/research/scoring";
import { AssessmentPanel } from "./AssessmentPanel";
import { translateText } from "@/lib/i18n";

const decisionLabels = { proceed:"次の面談へ", check:"追加確認", hold:"保留", decline:"今回は見送り" };
type Answer = Pick<ResponseRecord,"priorityId"|"decisions"|"identifiedRisks"|"reasoning"|"nextChecks"|"interrupted"|"ratings">;
const blank = (): Answer => ({priorityId:"",decisions:{},identifiedRisks:"",reasoning:"",nextChecks:"",interrupted:false,ratings:{usefulness:0,clarity:0,confidence:0,reliance:0}});
export function ResearchSession({ initial }: { initial: ParticipantView }) {
  const [view,setView] = useState(initial);
  const [answer,setAnswer] = useState<Answer>(blank);
  const [consent,setConsent] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  async function act(action:string) {
    if(action==="withdraw" && !window.confirm(document.documentElement.lang === "en" ? translateText("このセッションの回答を削除して参加を中止しますか？") : "このセッションの回答を削除して参加を中止しますか？")) return;
    setBusy(true);setError("");
    try {
      const response = await fetch("/api/research/sessions/"+view.id,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...(action==="respond"?{response:{...answer,trialId:view.trial?.id}}:{})})});
      const data = await response.json();if(!response.ok) throw new Error(data.error);
      setView(data);if(action==="respond"||action==="start") {setAnswer(blank());window.scrollTo(0,0);}
    } catch(e){setError((e as Error).message);} finally{setBusy(false);}
  }
  const trial = view.trial;
  return <div className="research-page research-session">
    <header className="research-heading"><span>匿名コード {view.participantCode} {view.source==="simulation"?"· 練習用":""}</span><h1>里親審査の画面評価</h1><p>完了 {view.completed} / {view.total}課題</p><progress value={view.completed} max={view.total} aria-label="評価の進捗" /></header>
    {view.withdrawn ? <section className="research-card"><h2>参加を中止しました</h2><p>このセッションの回答は削除されました。ご協力ありがとうございました。</p></section> : !view.consented ? <section className="research-card"><h2>参加前のご説明</h2><p className="preserve-lines">{view.consentText}</p><label className="research-check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />私は成人で、説明を読み、任意での参加に同意します。</label><button className="primary-button" disabled={!consent||busy} onClick={()=>act("consent")}>同意して進む</button></section> : !trial ? <section className="research-card"><h2>{view.completed===view.total?"すべての課題が終わりました":"次の課題を始めます"}</h2><p>{view.completed===view.total?"回答を保存しました。ご協力ありがとうございました。":"表示された全応募者を確認し、次の面談へ進める優先候補、各応募者への対応、リスク、判断理由を回答してください。候補を選ばず全員を追加確認とすることもできます。回答に氏名・連絡先などは書かないでください。"}</p>{view.completed<view.total && <><p>開始ボタンを押すと計測が始まります。画面を離れた時間も含まれます。中断があった場合は回答時に申告してください。</p><button className="primary-button" disabled={busy} onClick={()=>act("start")}>{view.completed?"次の課題を開始":"最初の課題を開始"}</button></>}</section> : <>
      <section className="research-card research-task-heading"><span className="research-badge">{trial.mode==="baseline"?"基本表示":"確認支援表示"}</span><h2>{trial.scenario.petName} · {trial.scenario.age}</h2><p>{trial.scenario.animalNeeds}</p><p>次の面談へ進める候補を検討してください。ここでの選択は正式譲渡の決定ではありません。</p></section>
      <div className="research-candidates">{trial.scenario.candidates.map(c=><article className="research-card" key={c.id}><h2>{c.name}</h2><dl className="research-profile"><div><dt>世帯と支援</dt><dd>{c.household}</dd></div><div><dt>希望</dt><dd>{c.preferences}</dd></div>{criteria.map(key=><div key={key}><dt>{criterionLabels[key]}</dt><dd>{c.facts[key]}</dd></div>)}</dl>
        <h3>確認の記録</h3><dl className="research-verification">{Object.entries(c.verification).map(([key,value])=><div key={key}><dt>{verificationLabels[key as keyof typeof verificationLabels]}</dt><dd>{verificationStateLabels[value]}</dd></div>)}</dl>
        {trial.assessments && <AssessmentPanel assessment={trial.assessments[c.id]} />}
        <label className="research-field">{c.name}への対応<select value={answer.decisions[c.id]??""} onChange={e=>setAnswer({...answer,decisions:{...answer.decisions,[c.id]:e.target.value as ResponseRecord["decisions"][string]}})}><option value="">選択してください</option>{Object.entries(decisionLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      </article>)}</div>
      <section className="research-card"><h2>このケースの判断を記録</h2><p>各欄は必須です。該当するリスクがないと思う場合は「なし」と記載してください。</p>
        <label className="research-field">次の面談へ優先して進める候補<select value={answer.priorityId} onChange={e=>setAnswer({...answer,priorityId:e.target.value})}><option value="">選択してください</option>{trial.scenario.candidates.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}<option value="none">今は選ばない（全員を追加確認など）</option></select></label>
        <label className="research-field">誰に、どのようなリスク・未確認事項がありますか？<textarea value={answer.identifiedRisks} onChange={e=>setAnswer({...answer,identifiedRisks:e.target.value})} maxLength={5000} /></label>
        <label className="research-field">判断理由と根拠となったプロファイルの情報<textarea value={answer.reasoning} onChange={e=>setAnswer({...answer,reasoning:e.target.value})} maxLength={5000} /></label>
        <label className="research-field">次に確認すること・相談すること<textarea value={answer.nextChecks} onChange={e=>setAnswer({...answer,nextChecks:e.target.value})} maxLength={3000} /></label>
        <fieldset><legend>この画面について（1＝全くそう思わない、5＝とてもそう思う）</legend>{([["usefulness","応募者への対応を決めるのに役立った"],["clarity","必要な情報と未確認事項が分かりやすかった"],["confidence","自分の判断理由を説明できる"],["reliance","根拠よりも画面が示す結論・数値を重視した"]] as const).map(([key,label])=><label className="research-rating" key={key}><span>{label}</span><select value={answer.ratings[key]||""} onChange={e=>setAnswer({...answer,ratings:{...answer.ratings,[key]:Number(e.target.value)}})}><option value="">未回答</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></label>)}</fieldset>
        <label className="research-check"><input type="checkbox" checked={answer.interrupted} onChange={e=>setAnswer({...answer,interrupted:e.target.checked})} />途中で別の作業や中断があった（この回答の時間は比較集計から除外）</label>
        <button className="primary-button" disabled={busy} onClick={()=>act("respond")}>この課題の回答を送信する</button><p>送信後は変更できません。未送信の入力は再読み込みで失われます。</p>
      </section>
    </>}
    <p role="alert" className="research-error">{error}</p>
    {view.consented&&!view.withdrawn&&<button className="decision-button outline" disabled={busy} onClick={()=>act("withdraw")}>回答を削除して参加を中止</button>}
  </div>;
}
