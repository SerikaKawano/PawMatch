"use client";

import Link from "next/link";
import { ChevronDown, HeartHandshake, Menu, UserRound } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import type { DemoUser } from "@/lib/demoUsers";
import { canAccess } from "@/lib/permissions";
import { safeLoginNext } from "@/lib/demo-session";
import { uiCopy } from "@/lib/ui-copy";
import { LanguageSwitch } from "./LanguageSwitch";

export function PublicHeader({ user }: { user: DemoUser | null }) {
  const [mobile, setMobile] = useState(false);
  const [account, setAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pathname = usePathname();
  async function logout() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/demo-session", { method: "DELETE" });
      if (!response.ok) throw new Error();
      try { sessionStorage.removeItem("pawmatch-demo-user"); } catch { /* No legacy session. */ }
      // Reload the root layout so every server component observes the cleared cookie.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    } catch { setError("ログアウトできませんでした。再試行してください。"); setBusy(false); }
  }
  if (pathname.startsWith("/research/session/")) return <header className="public-header"><div className="public-header-inner"><span className="public-brand"><span className="brand-mark"><HeartHandshake size={25} /></span><span><strong>PawMatch <b className="brand-demo">DEMO</b></strong><small>画面評価へのご協力ありがとうございます</small></span></span><div className="public-actions"><LanguageSwitch /></div></div></header>;
  return <header className="public-header">
    <div className="public-header-inner">
      <Link href="/" className="public-brand"><span className="brand-mark"><HeartHandshake size={25} /></span><span><strong>PawMatch <b className="brand-demo">DEMO</b></strong><small>ペットと家族をつなぐ</small></span></Link>
      <nav className={mobile ? "public-nav mobile-open" : "public-nav"} aria-label="メインメニュー" onClick={event => { if ((event.target as HTMLElement).closest("a")) setMobile(false); }}>
        {(!user || canAccess(user, "consult")) && <Link href="/pets">ペットを探す（里親希望者）</Link>}
        {(!user || canAccess(user, "rehome")) && <Link href={user ? "/rehoming" : "/login?intent=list&next=%2Frehoming"}>{`${uiCopy.manageListings}（譲渡者）`}</Link>}
        <Link href="/guide">{uiCopy.adoptionFlow}</Link>
      </nav>
      <div className="public-actions">
        <LanguageSwitch />
        {user ? <div className="session-account"><button type="button" className="session-account-toggle" onClick={() => setAccount(!account)} aria-expanded={account} aria-controls="session-account-menu"><UserRound size={22} /><span><small>{user.roleLabel} · ログイン中</small><strong>{user.name}{user.kind === "organization" ? "" : "さん"}</strong></span><ChevronDown size={18} /></button>
          {account && <div id="session-account-menu" className="session-account-menu"><Link href="/dashboard" onClick={() => setAccount(false)}>マイページ</Link>{canAccess(user, "consult") && <Link href="/dashboard#consultations" onClick={() => setAccount(false)}>相談履歴</Link>}<button type="button" disabled={busy} onClick={logout}>{busy ? "ログアウト中…" : "ログアウト"}</button>{error && <p role="alert">{error}</p>}</div>}
        </div> : <Link href={`/login?next=${encodeURIComponent(safeLoginNext(pathname))}`} className="login-button"><UserRound size={20} />ログイン</Link>}
        <button className="mobile-menu-button" onClick={() => setMobile(!mobile)} aria-expanded={mobile} aria-label="メニューを開く"><Menu size={25} /></button>
      </div>
    </div>
  </header>;
}
