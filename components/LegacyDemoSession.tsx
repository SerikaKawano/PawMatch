"use client";
import { useEffect } from "react";
import { resolveDemoUser, safeLoginNext } from "@/lib/demo-session";

// Migrate the previous tab-only demo login once, without reviving it after logout.
export function LegacyDemoSession({ hasSession }: { hasSession: boolean }) {
  useEffect(() => {
    let oldUser: string | null;
    try {
      oldUser = sessionStorage.getItem("pawmatch-demo-user");
      sessionStorage.removeItem("pawmatch-demo-user");
    } catch { return; }
    if (hasSession || !resolveDemoUser(oldUser)) return;
    void fetch("/api/demo-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: oldUser }) })
      .then(response => {
        if (!response.ok) return;
        const url = new URL(window.location.href);
        window.location.replace(url.pathname === "/login" ? safeLoginNext(url.searchParams.get("next")) : url.pathname + url.search + url.hash);
      }).catch(() => { /* Manual login remains available if migration fails. */ });
  }, [hasSession]);
  return null;
}
