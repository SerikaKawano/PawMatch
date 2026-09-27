import Link from "next/link";

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-footer-inner">
      <div><strong>PawMatch</strong></div>
      <nav aria-label="サイトの案内">
        <Link href="/terms">利用条件</Link>
        <Link href="/privacy">データの取扱い</Link>
      </nav>
    </div>
  </footer>;
}
