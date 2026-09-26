import Link from "next/link";

export default function TermsPage() {
  return <article className="policy-page">
    <header><span className="section-kicker">TERMS & SAFETY</span><h1>デモ利用条件と安全上の注意</h1><p>PawMatchは研究評価のための試作画面です。ここでは体験時の前提と、実際の譲渡サービスに必要な確認事項を示します。</p></header>
    <section><h2>このデモでできること</h2><p>架空のペット、里親希望者、譲渡団体、個人譲渡者を使って、検索・相談・申込みの比較・審査記録を試せます。ログイン画面のテストアカウントは誰でも選択でき、本番の本人認証ではありません。</p></section>
    <section><h2>実際の譲渡・連絡には使えません</h2><p>掲載や相談を通じて実在するペットの譲渡を申し込むことはできません。相談はこのデモ内に保存され、譲渡者への通知や返信は発生しません。実在する住所、電話番号、身分証明書、健康情報などを入力しないでください。</p></section>
    <section><h2>譲渡時に確認する項目</h2><ul><li>応募可能地域、飼育条件、家族全員の同意、住環境と緊急時の備えを事前に確認する。</li><li>面談やトライアルの条件と期間を双方で確認し、対面で受け渡す。</li><li>本人確認と譲渡誓約書の取り交わし、双方での保管を行う。</li><li>費用がある場合は掲載内容と合意事項を照合し、不明な請求を確認する。</li><li>気になる点や条件の不一致があれば手続きを止め、当事者間で確認する。</li></ul><p>審査の点数や注意表示は担当者の確認を支援するものです。最終判断を自動化しません。</p></section>
    <section><h2>公開前に必要な整備</h2><p>実利用者を対象にする場合は、正式な利用規約、費用規程、本人確認、個人情報の取扱い、苦情対応、運営主体と責任範囲を別途定める必要があります。このページはその代わりにはなりません。</p></section>
    <div className="policy-actions"><Link className="task-primary" href="/guide">譲渡の手順を読む →</Link><Link className="task-secondary" href="/privacy">データの取扱いを見る</Link></div>
  </article>;
}
