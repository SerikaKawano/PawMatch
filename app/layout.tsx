import type { Metadata } from "next";
import "./globals.css";
import "./research/research.css";
import { SessionChrome } from "@/components/SessionChrome";

import "./session.css";
import "./navigation.css";
import "./roles.css";
import "./global-theme.css";
import { SiteFooter } from "@/components/SiteFooter";


export const metadata: Metadata = {
  title: "PawMatch DEMO | あんしんペット譲渡",
  description: "人による最終判断を支援する、ペット譲渡審査のプロトタイプです。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body data-role="guest">
        <SessionChrome>{children}</SessionChrome>
        <SiteFooter />
      </body>
    </html>
  );
}
