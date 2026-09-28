import Link from "next/link";

export const dynamic = "force-static";

export default function PrivacyPage() {
  return <article className="policy-page">
    <section><h2>表示する情報</h2><p>ペット、譲渡者、応募者、団体のプロファイルは研究評価のために構成した情報です。実在の動物や人を示しません。</p></section>
    <section><h2>保存される操作</h2><p>相談文、プロファイル、登録した一般書類の内容とファイル名、本人確認の申請・確認状態、審査履歴、研究課題への回答はサイト内のストレージへ保存されます。設定によってローカルファイルかMongoDBを使います。テストアカウントはパスワードなしで選べるため、実在の個人情報や秘密情報を入力・アップロードしないでください。登録した書類は本人が削除できます。</p></section>
    <section><h2>研究評価</h2><p>管理者が発行した評価リンクから、用意された事例に対する回答を記録できます。重要リスクの発見、判断理由、分かりやすさ、有用性、自信、画面への依存を比較し、画面上の経過時間は参考値として扱います。研究参加者への説明、同意、保管期間、撤回手順は正式な評価開始前に別途定める必要があります。</p></section>
    <section><h2>運用前の条件</h2><p>この案内は公開サービスのプライバシーポリシーを構成しません。実データを扱う前に、目的、アクセス権、保存場所と期間、削除方法、問い合わせ先を確定してください。</p></section>
    <div className="policy-actions"><Link className="task-primary" href="/terms">利用条件へ →</Link><Link className="task-secondary" href="/">サイトトップへ</Link></div>
  </article>;
}
