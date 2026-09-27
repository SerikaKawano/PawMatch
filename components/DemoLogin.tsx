"use client";
import { permittedDestination } from "@/lib/permissions";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { roleNavigation } from "@/lib/role-navigation";
import type { DemoUser } from "@/lib/demoUsers";
import type { ManagedUser } from "@/lib/admin-users";

export function DemoLogin({ next, intent, users }: { next: string; intent?: string; users: ManagedUser[] }) {
  const [selected, setSelected] = useState<DemoUser["id"] | null>(intent === "list" ? "rehomer" : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const user = users.find((item) => item.id === selected);
  async function login() {
    if (busy || !user) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/demo-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: selected }) });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "ログインできませんでした。もう一度お試しください。");
      }
      try { sessionStorage.removeItem("pawmatch-demo-user"); } catch { /* Cookie login does not require sessionStorage. */ }
      window.location.assign(permittedDestination(user, next));
    } catch (error) {
      setError(error instanceof Error ? error.message : "接続できませんでした。もう一度お試しください。");
      setBusy(false);
    }
  }
  return <div className="login-layout login-layout-simple">
    {next.endsWith("/consult") && <p className="session-login-note">里親希望者・管理者でログインすると相談画面へ戻ります。ほかの役割は専用ホームを開きます。</p>}
    {error && <p className="session-login-note" role="alert">{error}</p>}
    <section className="login-panel"><h1>ユーザーを選択してください</h1><p>画面確認に使用するテストアカウントを1つ選んでください。</p><div className="demo-user-list">{users.map((item) => <button key={item.id} type="button" className={`${selected === item.id ? "demo-user selected" : "demo-user"}${item.status === "suspended" ? " suspended" : ""}`} aria-pressed={selected === item.id} disabled={busy || item.status === "suspended"} onClick={() => setSelected(item.id)}><span className={`demo-avatar ${item.color}`}>{item.initials}</span><span><strong>{item.roleLabel}</strong><b>{item.name}</b><small>{item.organization}</small><small className="login-role-purpose">{item.status === "suspended" ? "アカウント停止中" : `主な操作：${roleNavigation[item.role].tasks[0].label}`}</small></span><i>{selected === item.id && <CheckCircle2 size={23} />}</i></button>)}</div><div className="selected-login"><span><small>選択中のユーザー</small><strong>{user?.name ?? "未選択"}</strong></span><button type="button" disabled={busy || !user || user.status === "suspended"} onClick={login}>{busy ? "ログイン中…" : "選択したユーザーでログイン"}</button></div><p className="login-data-note">テストアカウントです。パスワードは不要です。</p></section>
  </div>;
}
