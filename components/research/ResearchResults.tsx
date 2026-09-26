"use client";
import { useState } from "react";
import Link from "next/link";
import { analyse, mean } from "@/lib/research/analysis";
import type { ResponseRecord, Scenario, StudySession } from "@/lib/research/types";
const format = (value:number|null, suffix="") => value===null?"未集計":value.toFixed(1)+suffix;
const modeLabel = (mode:string)=>mode==="baseline"?"基本表示":"確認支援表示";
export function ResearchResults({initial,source}:{initial:StudySession[];source:StudySession["source"]}) {
  const [sessions,setSessions]=useState(initial);
  const result=analyse(sessions,source);
  return <>
    <nav className="research-source" aria-label="集計対象"><Link aria-current={source==="participant"?"page":undefined} href="/research/results">参加者による評価</Link><Link aria-current={source==="simulation"?"page":undefined} href="/research/results?source=simulation">合成・練習データ</Link></nav>
    <p className="research-notice">{source==="simulation"?"表示中のデータは集計テスト用の架空回答・練習回答です。研究の成果や有効性の根拠には使えません。":"この集計には合成・練習データと中止したセッションを含めません。自由記述の採点が未完了の項目は未集計です。"}</p>
    <div className="research-kpis"><article><strong>{result.included.length}</strong><span>セッション</span></article><article><strong>{result.rows.length}</strong><span>回答</span></article><article><strong>{result.pairs.length}</strong><span>同一ケースの比較ペア</span></article><article><strong>{result.rows.filter(r=>!r.response.coding).length}</strong><span>自由記述の未採点</span></article></div>
    {!result.rows.length && <section className="research-card"><h2>まだ評価結果はありません</h2><p>研究設定でリンクを発行し、参加者が両方の表示で回答すると比較できます。動作確認用の結果は「合成・練習データ」で確認できます。</p><Link className="primary-button" href="/research/setup">評価の準備へ →</Link></section>}
    <section className="research-card"><h2>表示ごとの記述統計</h2><div className="research-table-wrap"><table><thead><tr><th>指標</th>{result.modes.map(m=><th key={m.mode}>{modeLabel(m.mode)}</th>)}</tr></thead><tbody>
      {([
        ["回答数", (m:typeof result.modes[number])=>String(m.count)],
        ["平均所要時間（中断ありを除外）", (m:typeof result.modes[number])=>format(m.time,"秒")+" / "+m.timed+"回答"],
        ["想定リスクの平均発見率", (m:typeof result.modes[number])=>format(m.recall,"%")],
        ["説明の明確さ（研究者採点0–3）", (m:typeof result.modes[number])=>format(m.explanation)+" / 採点済み "+m.coded+"回答"],
        ["有用性（自己評価1–5）", (m:typeof result.modes[number])=>format(m.usefulness)],
        ["情報の分かりやすさ（自己評価1–5）", (m:typeof result.modes[number])=>format(m.clarity)],
        ["仮基準の候補例との一致率", (m:typeof result.modes[number])=>format(m.alignment,"%")],
        ["高得点候補の重要リスク見落とし", (m:typeof result.modes[number])=>m.mode==="baseline"?"対象外":m.relianceCues+"回答"],
      ] as const).map(([label,render])=><tr key={label}><th>{label}</th>{result.modes.map(m=><td key={m.mode}>{render(m)}</td>)}</tr>)}
    </tbody></table></div><p>発見率は、各回答で「研究者が確認した想定リスク数 ÷ ケースの想定リスク数」を計算した平均です。想定リスク0件の対照ケースは分母に含めません。候補例との一致は判断の正しさではなく、仮基準との対応です。</p><p>高得点候補の重要リスク見落としは過度な依存を検討する手掛かりです。原因の断定には自由記述と本人への確認が必要です。採点未実施の回答では算出しません。</p></section>
    <section className="research-card"><h2>同じ参加者・同じケースでの比較</h2><p>差は「確認支援表示 − 基本表示」。時間のマイナスは短縮、発見率のプラスは改善です。複数ケースを含むため、ペア数は参加者数ではありません。</p><div className="research-table-wrap"><table><thead><tr><th>匿名コード</th><th>ケース</th><th>順序</th><th>時間差</th><th>発見率差</th><th>優先候補</th></tr></thead><tbody>{result.pairs.map((pair,i)=><tr key={i}><th>{pair.participant}</th><td>{pair.scenario}</td><td>{pair.order}</td><td>{format(pair.timeDifference,"秒")}</td><td>{format(pair.recallDifference,"pt")}</td><td>{pair.priorityChanged?"変更あり":"同じ"}</td></tr>)}</tbody></table></div><p>両表示が未完了のケースはペア比較に含めません。時間には画面外の時間も含まれます。中断申告は時間差のみを除外します。</p></section>
    <section className="research-card"><h2>順序・参加者区分と判断の一致</h2><div className="research-table-wrap"><table><thead><tr><th>表示順</th><th>セッション数</th><th>時間差の平均</th><th>発見率差の平均</th></tr></thead><tbody>{["AB","BA"].map(order=><tr key={order}><th>{order==="AB"?"基本 → 支援":"支援 → 基本"}</th><td>{result.included.filter(s=>s.order===order).length}</td><td>{format(mean(result.pairs.filter(p=>p.order===order).flatMap(p=>p.timeDifference===null?[]:[p.timeDifference])),"秒")}</td><td>{format(mean(result.pairs.filter(p=>p.order===order).flatMap(p=>p.recallDifference===null?[]:[p.recallDifference])),"pt")}</td></tr>)}</tbody></table></div>
      <p>参加者区分：{([["welfare","保護・譲渡経験"],["pet_owner","飼育経験"],["it","IT分野"],["other","その他"]] as const).map(([key,label])=>label+" "+result.included.filter(s=>s.group===key).length+"件").join(" / ")}</p>
      <details><summary>ケースごとの優先候補の一致度を見る</summary><p>最多選択候補の割合を表示します。回答者2人未満は未集計。同じ判断でも正しいとは限らず、妥当な複数候補のあるケースでは不一致が誤りとは限りません。</p><div className="research-table-wrap"><table><thead><tr><th>ケース</th><th>表示</th><th>回答数</th><th>最多選択の割合</th></tr></thead><tbody>{result.consistency.map((c,i)=><tr key={i}><th>{c.scenario}</th><td>{modeLabel(c.mode)}</td><td>{c.n}</td><td>{format(c.agreement,"%")}</td></tr>)}</tbody></table></div></details>
    </section>
    <section className="research-card"><h2>自由記述の確認・採点</h2><p>記述を読み、応募者とリスクの対応が分かるものだけにチェックを付けます。モデルのフラグを正解とみなさず、ケースの仮基準と照合してください。妥当な別解や想定外のリスクはメモに残します。</p>
      {result.rows.map(({session,response,scenario})=><Coding key={session.id+response.trialId} session={session} response={response} scenario={scenario} onSave={coding=>setSessions(current=>current.map(s=>s.id===session.id?{...s,responses:s.responses.map(r=>r.trialId===response.trialId?{...r,coding}:r)}:s))} />)}
    </section>
    <section className="research-card"><h2>分析用データを保存</h2><div className="research-actions"><a className="primary-button" href={"/api/research/export?source="+source}>回答・採点をCSVで保存</a><a className="secondary-button" href={"/api/research/export?format=json&source="+source}>ケース・基準を含むJSONで保存</a></div><p>合成と参加者のファイルは別々に出力されます。JSONには発行時のケース・重み・説明・想定リスクを含み、比較条件を追跡できます。セッション用リンクのIDは含めません。</p></section>
  </>;
}
function Coding({session,response,scenario,onSave}:{session:StudySession;response:ResponseRecord;scenario:Scenario;onSave:(value:NonNullable<ResponseRecord["coding"]>)=>void}) {
  const [detected,setDetected]=useState(response.coding?.detectedRiskIds??[]);
  const [score,setScore]=useState(response.coding?.explanationScore??0);
  const [notes,setNotes]=useState(response.coding?.notes??"");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  async function save(){
    setBusy(true);
    try{
      const res=await fetch("/api/research/coding",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:session.id,trialId:response.trialId,detectedRiskIds:detected,explanationScore:score,notes})});
      const data=await res.json();if(!res.ok)throw new Error(data.error);
      onSave(data);setMessage("採点を保存しました。");
    }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }
  return <details className="research-coding"><summary>{session.participantCode} · {scenario.title} · {modeLabel(response.mode)} · {response.coding?"採点済み":"未採点"}</summary>
    <p>候補：{response.priorityId} / 対応：{Object.entries(response.decisions).map(([id,d])=>id+"="+d).join("、")}</p>
    <dl><dt>挙げたリスク</dt><dd className="preserve-lines">{response.identifiedRisks}</dd><dt>判断理由</dt><dd className="preserve-lines">{response.reasoning}</dd><dt>次の確認</dt><dd className="preserve-lines">{response.nextChecks}</dd></dl>
    <fieldset><legend>記述で確認できた想定リスク</legend>{scenario.rubric.expectedRisks.map(r=><label key={r.id} className="research-check"><input type="checkbox" checked={detected.includes(r.id)} onChange={e=>setDetected(e.target.checked?[...detected,r.id]:detected.filter(id=>id!==r.id))} /><span>{r.candidateId}：{r.label}<small>{r.rationale}</small></span></label>)}{!scenario.rubric.expectedRisks.length&&<p>想定リスクなしの対照ケースです。</p>}</fieldset>
    <label className="research-field">説明の明確さ<select value={score} onChange={e=>setScore(Number(e.target.value))}><option value={0}>0 · 判断・根拠を読み取れない</option><option value={1}>1 · 判断はあるが具体的な根拠がない</option><option value={2}>2 · 動物の必要条件と応募者の情報を結び付けている</option><option value={3}>3 · 根拠に加え、未確認事項・次の確認も一貫して説明</option></select></label>
    <label className="research-field">妥当な別解・想定外のリスク・採点の根拠<textarea maxLength={3000} value={notes} onChange={e=>setNotes(e.target.value)} /></label>
    <button className="secondary-button" disabled={busy} onClick={save}>採点を保存</button><span role="status">{message}</span>
  </details>;
}
