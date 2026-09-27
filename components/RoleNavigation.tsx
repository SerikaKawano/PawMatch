"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DemoUser } from "@/lib/demoUsers";
import { roleNavigation } from "@/lib/role-navigation";

export function RoleNavigation({ user }: { user: DemoUser | null }) {
  const pathname = usePathname();
  if (!user || pathname === "/login" || pathname.startsWith("/research/session/")) return null;
  const role = roleNavigation[user.role];
  const tasks = role.tasks.filter(task => !task.href.includes("#") && !["/pets", "/guide", "/rehoming"].includes(task.href));
  if (!tasks.length) return null;
  return <div className="role-navigation">
    <div className="role-navigation-inner">
      <nav aria-label={user.roleLabel + "の操作メニュー"} className="role-nav-links">
        {tasks.map((task, index) => <Link key={task.href} href={task.href} className={[index === 0 ? "role-nav-primary" : "", pathname === task.href.split("?")[0] ? "current" : ""].join(" ")} aria-current={pathname === task.href.split("?")[0] ? "page" : undefined}>{task.label}</Link>)}
      </nav>
    </div>
  </div>;
}
