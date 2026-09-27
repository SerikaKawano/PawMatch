"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ConsultationForm({ petId, petName, userName }: { petId: string; petName: string; userName: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState("譲渡の条件");
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
      const response = await fetch("/api/consultations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ petId, topic, message, requestId: requestId.current }) });
      const data = await response.json();
      if (!response.ok) { setExpired(response.status === 401); throw new Error(data.error); }
      setMessage(""); requestId.current = null;
      setNotice("相談を保存しました。下の相談履歴から確認できます。譲渡者へは送信していません。");
      router.refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "保存できませんでした。再試行してください。"); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <form className="consultation-form" onSubmit={submit}>
    <h2>{petName}について相談する</h2>
    <p>相談者：<strong>{userName}</strong>さん</p>
    <p>譲渡条件やお世話について、気になることをご記入ください。実際の住所や電話番号は入力しないでください。</p>
    <label htmlFor="consultation-topic">相談の種類</label>
    <select id="consultation-topic" value={topic} disabled={busy} onChange={event => { setTopic(event.target.value); requestId.current = null; }}>
      {["譲渡の条件", "健康・お世話", "面談・見学", "その他"].map(item => <option key={item}>{item}</option>)}
    </select>
    <label htmlFor="consultation-message">相談内容（必須・2,000文字まで）</label>
    <textarea id="consultation-message" rows={7} required maxLength={2000} value={message} disabled={busy} onChange={event => { setMessage(event.target.value); requestId.current = null; }} placeholder="例：初めて犬を迎えます。普段のお散歩やお留守番の様子を教えてください。" />
    <button className="session-primary" disabled={busy || !message.trim()}>{busy ? "保存中…" : "相談を保存する"}</button>
    <p role="status" aria-live="polite">{notice}</p>
    {notice.startsWith("相談を保存しました") && <Link className="task-secondary" href="/dashboard#consultations">保存完了：マイページで相談履歴を見る →</Link>}
    {expired && <Link href={`/login?next=${encodeURIComponent("/pets/" + petId + "/consult")}`}>再ログインしてこの相談画面へ戻る</Link>}
  </form>;
}
