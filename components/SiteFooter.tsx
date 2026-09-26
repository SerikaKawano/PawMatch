import Link from "next/link";

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-footer-inner">
      <div><strong>PawMatch</strong><p>ペットと次の家族をつなぐ、研究用デモ。</p><small>掲載・申込み・審査のデータは架空です。</small></div>
      <nav aria-label="サイトの案内">
        <Link href="/guide">譲渡の手順と安全ガイド</Link>
        <Link href="/terms">デモ利用条件</Link>
        <Link href="/privacy">データの取扱い</Link>
      </nav>
    </div>
  </footer>;
}
