"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { DemoRole } from "@/lib/demoUsers";

export function ConsultationReplyForm({ consultationId, role, closed }: { consultationId: string; role: DemoRole; closed: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/consultations/${consultationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "送信できませんでした。");
      setMessage("");
      setNotice("メッセージを送信しました。");
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "送信できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  if (closed) return <p className="consultation-closed-note">この相談は終了しているため、新しいメッセージは送信できません。</p>;
  const audience = role === "rehomer"
    ? "ペットの普段の様子、健康、ケア、譲渡条件など、譲渡者が把握している内容を回答してください。"
    : role === "adopter"
      ? "ペットについての質問や、案内された手続きへの回答を送信できます。"
      : "審査、書類、本人確認、次の工程など、PawMatch運営としての案内を送信してください。";

  return <form className={`consultation-reply-form ${role}`} onSubmit={submit}>
    <div><h3>メッセージを送る</h3><p>{audience}</p></div>
    <label htmlFor="consultation-reply">メッセージ（必須・2,000文字まで）</label>
    <textarea id="consultation-reply" rows={5} maxLength={2000} required value={message} disabled={busy} onChange={event => setMessage(event.target.value)} />
    <button type="submit" disabled={busy || !message.trim()}>{busy ? "送信中…" : "メッセージを送信"}</button>
    {notice && <p role="status" aria-live="polite">{notice}</p>}
  </form>;
}
