"use client";
import { useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { ConsultationStatus } from "@/lib/consultations";
import type { ConsultationGroup } from "@/lib/consultation-groups";

export function ConsultationTriage({ initialGroups, names, applicants }: { initialGroups: ConsultationGroup[]; names: Record<string, string>; applicants: Record<string, string> }) {
  const [groups, setGroups] = useState(initialGroups);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  async function update(group: ConsultationGroup, status: Exclude<ConsultationStatus, "received">) {
    const record = group.representative;
    const action = status === "profile_requested" ? "事前情報の提出待ちに進める" : "この相談を終了する";
    if (!window.confirm(`${names[record.petId] ?? record.petId}への相談を「${action}」で確定しますか？\nこの操作は取り消せません。`)) return;
    setBusy(record.id); setNotice("");
    try {
      const response = await fetch(`/api/consultations/${record.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setGroups(current => current.map(item => item.key === group.key ? { ...item, status, representative: result.consultation, records: item.records.map(entry => entry.id === record.id ? result.consultation : entry) } : item));
      setNotice(`${applicants[record.userId] ?? "里親希望者"}さんの相談を更新しました。`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "更新できませんでした。"); }
    finally { setBusy(null); }
  }
  async function startReview(group:ConsultationGroup){
    const record=group.representative;
    if(!window.confirm(`${names[record.petId]??record.petId}への提出済み情報を確認し、申込みを受け付けて審査を開始しますか？`))return;
    setBusy(record.id);setNotice("");
    try{
      const response=await fetch(`/api/consultations/${record.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"start_review"})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setGroups(current=>current.map(item=>item.key===group.key?{...item,application:result.application}:item));
      setNotice(`${applicants[record.userId]??"里親希望者"}さんの申込みを受け付け、審査ケースを作成しました。`);
    }catch(error){setNotice(error instanceof Error?error.message:"審査を開始できませんでした。");}finally{setBusy(null);}
  }
  const pending = groups.filter(item => item.status === "received");
  const awaitingSubmission = groups.filter(item => item.status === "profile_requested"&&!item.application);
  const underReview = groups.filter(item => item.status === "profile_requested"&&item.application);
  const handled = groups.filter(item => item.status === "closed");
  return <div className="consultation-triage">
    <div className="consultation-triage-summary"><strong>確認待ち {pending.length}件</strong><span>相談だけでは応募・審査ケースになりません。内容を確認し、次の手続きへ案内するかを選びます。</span></div>
    <p role="status" aria-live="polite">{notice}</p>
    {!pending.length && <p className="consultation-empty">確認待ちの相談はありません。</p>}
    {pending.map(group => { const record = group.representative; const latest = group.records[0] ?? record; return <article className="consultation-triage-card" key={group.key}>
      <div className="consultation-triage-heading"><h2><Link href={`/consultations/${record.id}`}>{names[group.petId] ?? group.petId}への相談</Link></h2><span className="consultation-status received">確認待ち</span></div>
      <p><strong>相談者：</strong>{applicants[group.userId] ?? "里親希望者"}　<strong>連絡先：</strong>{record.contactEmail ?? "未登録"}{group.records.length > 1 ? `　${group.records.length}件の相談を統合` : ""}</p>
      <p className="consultation-message">{latest.message}</p>
      <div className="consultation-triage-actions"><Link href={`/consultations/${record.id}`} className="consultation-open-link"><MessageCircle size={20} />メッセージ履歴・返信を開く</Link><button type="button" className="decision-button" disabled={busy !== null} onClick={() => update(group, "profile_requested")}>事前情報の提出へ進める</button><button type="button" className="decision-button outline" disabled={busy !== null} onClick={() => update(group, "closed")}>相談を終了する</button></div>
    </article>})}
    {awaitingSubmission.length>0&&<section className="consultation-workflow-list"><h2>書類・プロファイル提出待ち <span>{awaitingSubmission.length}件</span></h2>{awaitingSubmission.map(group=>{const record=group.representative;return <article className="consultation-triage-card workflow" key={group.key}><div className="consultation-triage-heading"><h3><Link href={`/consultations/${record.id}`}>{names[group.petId]??group.petId}への相談</Link></h3><span className="consultation-status profile-requested">提出待ち</span></div><p><strong>相談者：</strong>{applicants[group.userId]??"里親希望者"}</p><div className="consultation-triage-actions"><Link href={`/consultations/${record.id}`} className="consultation-open-link"><MessageCircle size={20}/>メッセージ履歴・返信を開く</Link><button type="button" className="decision-button" disabled={busy!==null} onClick={()=>startReview(group)}>申込みを受け付けて審査へ進める</button></div></article>})}</section>}
    {underReview.length>0&&<section className="consultation-workflow-list"><h2>審査へ進んだ相談 <span>{underReview.length}件</span></h2>{underReview.map(group=>{const record=group.representative;return <article className="consultation-triage-card workflow active" key={group.key}><div className="consultation-triage-heading"><h3><Link href={`/consultations/${record.id}`}>{names[group.petId]??group.petId}への相談</Link></h3><span className="consultation-status in-review">審査中</span></div><p><strong>相談者：</strong>{applicants[group.userId]??"里親希望者"}</p><div className="consultation-triage-actions"><Link href={`/consultations/${record.id}`} className="consultation-open-link"><MessageCircle size={20}/>メッセージ履歴・返信を開く</Link><Link href={`/reviews/${group.application!.id}`} className="decision-button">審査ケースを開く</Link></div></article>})}</section>}
    {handled.length > 0 && <details className="consultation-handled"><summary>{`終了した相談（${handled.length}件）`}</summary><div className="consultation-handled-list">{handled.map(group => <Link key={group.key} href={`/consultations/${group.representative.id}`}><span>{names[group.petId] ?? group.petId} · {applicants[group.userId] ?? "里親希望者"} · 対応終了{group.records.length > 1 ? ` · ${group.records.length}件を統合` : ""}</span><strong>履歴を見る →</strong></Link>)}</div></details>}
  </div>;
}
