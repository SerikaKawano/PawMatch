"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { DemoUser } from "@/lib/demoUsers";
import { pageContext } from "@/lib/page-context";

export function PageContextBar({ role, sessionPending = false }: { role: DemoUser["role"] | null; sessionPending?: boolean }) {
  const pathname = usePathname();
  if (pathname === "/dashboard" && sessionPending) return null;
  const context = pageContext(pathname, role);
  if (!context) return null;
  const hideBack = pathname === "/dashboard" || Boolean(role && context.backHref === "/");
  return <nav className="page-context-bar" aria-label="ページの位置"><div className="page-context-inner">{!hideBack && <Link href={context.backHref} className="page-context-back"><ArrowLeft size={19} />{context.backLabel}</Link>}<h1 className="page-context-title">{context.title}</h1></div></nav>;
}
