import Link from "next/link";
import { uiCopy } from "@/lib/ui-copy";

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-footer-inner">
      <div><strong>PawMatch</strong><p>ペットと次の家族をつなぐ。</p><small>申込みの確認と譲渡の判断を支援します。</small></div>
      <nav aria-label="サイトの案内">
        <Link href="/guide">{uiCopy.adoptionFlow}</Link>
        <Link href="/terms">利用条件</Link>
        <Link href="/privacy">データの取扱い</Link>
      </nav>
    </div>
  </footer>;
}
