"use client";
import { useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { Consultation, ConsultationStatus } from "@/lib/consultations";

export function ConsultationTriage({ initialRecords, names, applicants }: { initialRecords: Consultation[]; names: Record<string, string>; applicants: Record<string, string> }) {
  const [records, setRecords] = useState(initialRecords);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  async function update(record: Consultation, status: Exclude<ConsultationStatus, "received">) {
    const action = status === "profile_requested" ? "事前情報の提出待ちに進める" : "この相談を終了する";
    if (!window.confirm(`${names[record.petId] ?? record.petId}への相談を「${action}」で確定しますか？\nこの操作は取り消せません。`)) return;
    setBusy(record.id); setNotice("");
    try {
      const response = await fetch(`/api/consultations/${record.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setRecords(current => current.map(item => item.id === record.id ? result.consultation : item));
      setNotice(`${applicants[record.userId] ?? "里親希望者"}さんの相談を更新しました。`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "更新できませんでした。"); }
    finally { setBusy(null); }
  }
  const pending = records.filter(item => (item.status ?? "received") === "received");
  const handled = records.filter(item => (item.status ?? "received") !== "received");
  return <div className="consultation-triage">
    <div className="consultation-triage-summary"><strong>確認待ち {pending.length}件</strong><span>相談だけでは応募・審査ケースになりません。内容を確認し、次の手続きへ案内するかを選びます。</span></div>
    <p role="status" aria-live="polite">{notice}</p>
    {!pending.length && <p className="consultation-empty">確認待ちの相談はありません。</p>}
    {pending.map(record => <article className="consultation-triage-card" key={record.id}>
      <div className="consultation-triage-heading"><h2><Link href={`/consultations/${record.id}`}>{names[record.petId] ?? record.petId}への相談</Link></h2><span className="consultation-status received">確認待ち</span></div>
      <p><strong>相談者：</strong>{applicants[record.userId] ?? "里親希望者"}　<strong>連絡先：</strong>{record.contactEmail ?? "未登録"}</p>
      <p className="consultation-message">{record.message}</p>
      <div className="consultation-triage-actions"><Link href={`/consultations/${record.id}`} className="consultation-open-link"><MessageCircle size={20} />メッセージ履歴・返信を開く</Link><button type="button" className="decision-button" disabled={busy !== null} onClick={() => update(record, "profile_requested")}>事前情報の提出へ進める</button><button type="button" className="decision-button outline" disabled={busy !== null} onClick={() => update(record, "closed")}>相談を終了する</button></div>
    </article>)}
    {handled.length > 0 && <details className="consultation-handled"><summary>{`対応済みの相談（${handled.length}件）`}</summary><div className="consultation-handled-list">{handled.map(record => <Link key={record.id} href={`/consultations/${record.id}`}><span>{names[record.petId] ?? record.petId} · {applicants[record.userId] ?? "里親希望者"} · {record.status === "profile_requested" ? "事前情報の提出待ち" : "対応終了"}</span><strong>履歴を見る →</strong></Link>)}</div></details>}
  </div>;
}
