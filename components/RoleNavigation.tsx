"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, House } from "lucide-react";
import type { DemoUser } from "@/lib/demoUsers";
import { navigationLabel, roleNavigation } from "@/lib/role-navigation";

export function RoleNavigation({ user }: { user: DemoUser | null }) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname.startsWith("/research/session/") || (!user && pathname === "/")) return null;
  const role = user ? roleNavigation[user.role] : null;
  return <div className="role-navigation">
    <div className="role-navigation-inner">
      <nav aria-label="現在地" className="location-trail"><Link href="/">サイトトップ</Link><span aria-hidden="true">›</span>{user && pathname !== "/dashboard" && <><Link href="/dashboard">{role!.title}</Link><span aria-hidden="true">›</span></>}<span aria-current="page">{pathname === "/dashboard" ? role?.title : navigationLabel(pathname)}</span></nav>
      {role && user?.role !== "adopter" && <nav aria-label={user!.roleLabel + "の操作メニュー"} className="role-nav-links">
        <Link className={pathname === "/dashboard" ? "current" : ""} href="/dashboard" aria-current={pathname === "/dashboard" ? "page" : undefined}><House size={19} />{role.title}</Link>
        {role.tasks.filter(task => !task.href.includes("#")).map((task, index) => <Link key={task.href} href={task.href} className={[index === 0 ? "role-nav-primary" : "", pathname === task.href.split("?")[0] ? "current" : ""].join(" ")} aria-current={pathname === task.href.split("?")[0] ? "page" : undefined}>{task.label}</Link>)}
      </nav>}
      {!role && <Link href="/pets" className="role-back"><ArrowLeft size={18} />ペット一覧に戻る</Link>}
    </div>
  </div>;
}
