"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { DemoUser } from "@/lib/demoUsers";
import { PublicHeader } from "./PublicHeader";
import { PageContextBar } from "./PageContextBar";

/**
 * Keeps the page shell cacheable. Public pages render immediately as static HTML;
 * only the small account/navigation area is synchronised with the session later.
 */
export function SessionChrome({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/demo-session", { cache: "no-store", signal: controller.signal })
      .then(response => response.ok ? response.json() : { user: null })
      .then(result => setUser(result.user ?? null))
      .catch(error => { if (error?.name !== "AbortError") setUser(null); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    document.body.dataset.role = user?.role ?? "guest";
  }, [user]);

  return <>
    <PublicHeader user={user ?? null} />
    <main className="main-shell"><PageContextBar role={user?.role ?? null} sessionPending={user === undefined} />{children}</main>
  </>;
}
