"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, HeartHandshake, LayoutDashboard, PawPrint, ShieldCheck } from "lucide-react";

const links = [
  { href: "/", label: "ホーム", icon: LayoutDashboard },
  { href: "/pets", label: "里親募集中", icon: PawPrint },
  { href: "/reviews", label: "申込み審査", icon: ShieldCheck },
  { href: "/docs", label: "API案内", icon: BookOpenText },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <Link href="/" className="brand" aria-label="PawMatch home">
        <span className="brand-mark"><HeartHandshake size={22} /></span>
        <span><strong>PawMatch</strong><small>あんしん譲渡</small></span>
      </Link>
      <nav className="nav-list" aria-label="Primary navigation">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return <Link key={href} href={href} className={active ? "nav-link active" : "nav-link"}><Icon size={18} />{label}</Link>;
        })}
      </nav>
      <div className="sidebar-note">
        <span className="eyebrow">デモ版について</span>
        <p>表示される人物・動物はすべて架空です。最終判断は必ず担当者が行います。</p>
      </div>
      <div className="reviewer-chip"><span className="avatar">SK</span><span><strong>河野 セリカ</strong><small>審査担当</small></span></div>
    </aside>
  );
}
