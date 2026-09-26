# ロール別アクセス修正・検証記録（2026-09-19）

結果：fixed（ローカルのデモロール境界）。

## 不具合と境界

旧実装では里親希望者で /rehoming と GET /api/applications がともに200となり、対応しない機能と審査データへ到達できた。共通の permissions / access-control を使い、画面・APIのデータ読み書き前に能力を確認する。UIだけの非表示ではなくサーバーで強制する。

| ロール | 相談・自分の相談履歴 | 募集管理 | 審査・書類確認 | 運営・研究・API案内 |
|---|---|---|---|---|
| 里親希望者 | 可 | 不可 | 不可 | 不可 |
| 譲渡希望者 | 不可 | 可 | 可 | 不可 |
| 審査担当 | 不可 | 不可 | 可 | 不可 |
| 管理者 | 可 | 可 | 可 | 可 |

未ログインの画面はログインへ、権限不足の画面はアクセス不可案内へリダイレクト。APIはそれぞれ401/403。審査担当向けの内訳を /reviews/records に分離し、許可した view のみ受け付ける。管理者ページは管理者専用。

本人判定は64桁のランダムトークンを持つHttpOnly Cookieとサーバー保存のハッシュから行う。旧ロール名Cookieを信用しない。12時間で失効し、ログアウト・切替時にはサーバー側でも失効する。旧ブラウザー内ログインの自動移行は停止したため再ログインが必要。

## 変更範囲

- lib/permissions.ts、access-control.ts、demo-session-store.ts とデモセッション関連コード。
- app内の保護対象ページ・API、RecordsListと審査用内訳ページ。
- PublicHeader、RoleNavigation、DemoLogin、Dashboard、審査画面・ペット詳細の条件付き操作。
- app/roles.css、ガイド・ホーム画像6点。生成プロンプトは guide-illustration-prompts.md。
- permissions.test.cjs、demo-session-store.test.cjs、role-access-http.cjs を追加。既存HTTPテストを権限仕様に更新。

## 検証順と結果

1. 構文・型：node node_modules/next/dist/bin/next build --webpack — 成功（Nextビルド・TypeScript）。
2. 元の攻撃経路・別入力：隔離した3003番サーバーで node tests/role-access-http.cjs — 106項目成功。里親希望者の /rehoming は307でアクセス不可へ、GET /api/applications は403。旧Cookie・任意トークン・ログアウト後の再利用は401。権限外の書込みは403、別Originも403。view=organizationsで審査用内訳から管理者一覧へ到達不可。
3. 正常系・回帰：node --test tests/*.test.cjs — 18件成功。node tests/auth-http-smoke.cjs、node tests/ui-http-smoke.cjs、node tests/http-smoke.cjs — 全成功。4ロールの主導線、相談の保存と本人分離、審査保存、比較評価4課題、再送、CSV、撤回を確認。
4. node node_modules/eslint/bin/eslint.js . — 成功。独立した読取り専用レビューで残存する具体的な迂回・回帰は未検出。ログイン後のトップ内アンカーが届かなくなる点はヘッダー修正で解消。

HTTPテストは PAWMATCH_DATA_DIR=research-qa/access、MONGODB_URI空の隔離環境を使用。研究参加者は管理者が発行した秘密の招待URLから従来どおり回答でき、管理者セッションなしの課題進行も確認した。

## 限界

- テストユーザー選択は意図的に全ロールを選べる。このモックは本番の本人認証ではなく、外部公開・実個人情報の投入不可。
- 後続の所有者別デモデータ改修により、譲渡者の画面・申込みAPIは自分の掲載ペットだけに限定した。審査担当・管理者は全合成ケースを閲覧できる。ただし実運用に必要な組織単位のテナント分離や本人確認は未実装。
- 管理者の相談履歴も本人分だけ。他人の私信を一括表示する機能は今回追加していない。
- MongoDB経路は共通認可コードを使うが、この環境でMongoDB接続の実行検証はしていない。
- ブラウザー操作は環境制約により停止。実描画・レスポンシブの目視QAは未実施。画像自体は生成出力で確認し、6画像のHTTP配信とガイドへの組込みを検証。
