import Link from "next/link";

export default function PrivacyPage() {
  return <article className="policy-page">
    <header><span className="section-kicker">DATA & PRIVACY</span><h1>データの取扱い</h1><p>研究用デモに入力・表示される情報と保存範囲についての案内です。</p></header>
    <section><h2>表示する情報</h2><p>ペット、譲渡者、応募者、団体のプロフィールは合成データです。イラストもAIで生成した架空の場面です。実在の動物や人を示しません。</p></section>
    <section><h2>保存される操作</h2><p>相談文、審査の確認状態、担当者のメモと履歴、研究課題への回答はデモ用ストレージへ保存されます。設定によってローカルファイルかMongoDBを使います。テストアカウントはパスワードなしで選べるため、個人情報や秘密情報を入力しないでください。</p></section>
    <section><h2>研究評価</h2><p>管理者が発行した評価リンクから、架空の事例に対する回答を記録できます。回答時間・判断理由などを比較します。研究参加者の説明、同意、保管期間、撤回手順は正式な評価開始前に別途定める必要があります。</p></section>
    <section><h2>運用前の条件</h2><p>このデモは公開サービスのプライバシーポリシーを構成しません。実データを扱う前に、目的、アクセス権、保存場所と期間、削除方法、問い合わせ先を確定してください。</p></section>
    <div className="policy-actions"><Link className="task-primary" href="/terms">デモ利用条件へ →</Link><Link className="task-secondary" href="/">サイトトップへ</Link></div>
  </article>;
}
