import Link from "next/link";
export function ResearchNav() {
  return <nav className="research-nav" aria-label="研究メニュー">
    <Link href="/dashboard">管理者ホーム</Link>
    <Link href="/research">研究と評価</Link>
    <Link href="/research/setup">重み・ケース設定</Link>
    <Link href="/reviews/progress">審査進捗</Link>
  </nav>;
}
