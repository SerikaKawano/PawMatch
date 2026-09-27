import type { Metadata } from "next";
import "./globals.css";
import "./research/research.css";
import { PublicHeader } from "@/components/PublicHeader";
import { currentDemoUser } from "@/lib/demo-session-server";

import "./session.css";
import "./navigation.css";
import "./roles.css";
import "./global-theme.css";
import { SiteFooter } from "@/components/SiteFooter";
import { PageContextBar } from "@/components/PageContextBar";


export const metadata: Metadata = {
  title: "PawMatch DEMO | あんしんペット譲渡",
  description: "人による最終判断を支援する、ペット譲渡審査のプロトタイプです。",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await currentDemoUser();
  return (
    <html lang="ja">
      <body data-role={user?.role ?? "guest"}>
        <PublicHeader user={user} />

        <main className="main-shell"><PageContextBar role={user?.role ?? null} />{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
