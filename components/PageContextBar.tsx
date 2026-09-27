"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { DemoUser } from "@/lib/demoUsers";
import { pageContext } from "@/lib/page-context";

export function PageContextBar({ role }: { role: DemoUser["role"] | null }) {
  const context = pageContext(usePathname(), role);
  if (!context) return null;
  return <nav className="page-context-bar" aria-label="ページの位置"><div className="page-context-inner">{!(role && context.backHref === "/") && <Link href={context.backHref} className="page-context-back"><ArrowLeft size={19} />{context.backLabel}</Link>}<h1 className="page-context-title">{context.title}</h1></div></nav>;
}
