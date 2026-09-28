"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ConsultationForm({ petId, userEmail }: { petId: string; userEmail: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState(userEmail);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [expired, setExpired] = useState(false);
  const requestId = useRef<string | null>(null);
  const submitting = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true); setNotice(""); setExpired(false);
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/consultations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ petId, message, contactEmail, requestId: requestId.current }) });
      const data = await response.json();
      if (!response.ok) { setExpired(response.status === 401); throw new Error(data.error); }
      setMessage(""); requestId.current = null;
      setNotice("相談を受け付けました。譲渡者とPawMatch運営が内容を確認します。下の相談履歴から返信と進捗を確認できます。");
      router.refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "保存できませんでした。再試行してください。"); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <form className="consultation-form" onSubmit={submit}>
    <label htmlFor="consultation-message">相談内容（必須・2,000文字まで）</label>
    <textarea id="consultation-message" rows={7} required maxLength={2000} value={message} disabled={busy} onChange={event => { setMessage(event.target.value); requestId.current = null; }} placeholder="気になること、お迎えを検討している理由を入力してください。" />
    <label htmlFor="consultation-contact">連絡の取りやすいメールアドレスまたは電話番号</label>
    <input id="consultation-contact" type="text" required maxLength={254} autoComplete="off" value={contactEmail} disabled={busy} onChange={event => { setContactEmail(event.target.value); requestId.current = null; }} />
    <p className="consultation-process-note">相談の送信だけでは審査は始まりません。ペットについては譲渡者、審査や必要書類についてはPawMatch運営が同じ履歴で回答します。</p>
    <button className="session-primary" disabled={busy || !message.trim() || !contactEmail.trim()}>{busy ? "送信中…" : "相談を送信する"}</button>
    <p role="status" aria-live="polite">{notice}</p>
    {notice.startsWith("相談を受け付けました") && <Link className="task-secondary" href="/adopter/history">相談・申込履歴で進捗を見る →</Link>}
    {expired && <Link href={`/login?next=${encodeURIComponent("/pets/" + petId + "/consult")}`}>再ログインしてこの相談画面へ戻る</Link>}
  </form>;
}
