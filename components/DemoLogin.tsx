"use client";
import { permittedDestination } from "@/lib/permissions";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { roleNavigation } from "@/lib/role-navigation";
import { demoUsers, type DemoUser } from "@/lib/demoUsers";

export function DemoLogin({ next, currentUser, intent }: { next: string; currentUser: DemoUser | null; intent?: string }) {
  const [selected, setSelected] = useState<DemoUser["id"] | null>(currentUser?.id ?? (intent === "list" ? "rehomer" : null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const user = demoUsers.find((item) => item.id === selected);
  async function login() {
    if (busy || !user) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/demo-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: selected }) });
      if (!response.ok) throw new Error("ログインできませんでした。もう一度お試しください。");
      try { sessionStorage.removeItem("pawmatch-demo-user"); } catch { /* Cookie login does not require sessionStorage. */ }
      window.location.assign(permittedDestination(user, next));
    } catch (error) {
      setError(error instanceof Error ? error.message : "接続できませんでした。もう一度お試しください。");
      setBusy(false);
    }
  }
  return <div className="login-layout login-layout-simple">
    {currentUser && <div className="session-login-note"><p>現在は <strong>{currentUser.name}（{currentUser.roleLabel}）</strong>でログイン中です。</p><Link href={permittedDestination(currentUser, next)}>このユーザーのまま続ける →</Link></div>}
    {next.endsWith("/consult") && <p className="session-login-note">里親希望者・管理者でログインすると相談画面へ戻ります。ほかの役割は専用ホームを開きます。</p>}
    {error && <p className="session-login-note" role="alert">{error}</p>}
    <section className="login-panel"><h1>ユーザーを選択してください</h1><p>画面確認に使用するテストアカウントを1つ選んでください。</p><div className="demo-user-list">{demoUsers.map((item) => <button key={item.id} type="button" className={selected === item.id ? "demo-user selected" : "demo-user"} aria-pressed={selected === item.id} disabled={busy} onClick={() => setSelected(item.id)}><span className={`demo-avatar ${item.color}`}>{item.initials}</span><span><strong>{item.roleLabel}</strong><b>{item.name}</b><small>{item.organization}</small><small className="login-role-purpose">主な操作：{roleNavigation[item.role].tasks[0].label}</small></span><i>{selected === item.id && <CheckCircle2 size={23} />}</i></button>)}</div><div className="selected-login"><span><small>選択中のユーザー</small><strong>{user?.name ?? "未選択"}</strong></span><button type="button" disabled={busy || !user} onClick={login}>{busy ? "ログイン中…" : "選択したユーザーでログイン"}</button></div><p className="login-data-note">テストアカウントです。パスワードは不要です。</p></section>
  </div>;
}
