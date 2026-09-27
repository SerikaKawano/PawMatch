import type { DemoRole } from "./demoUsers";
import { uiCopy } from "./ui-copy";
export type RoleTask = { label: string; href: string; description: string };
export const roleNavigation: Record<DemoRole, { title: string; purpose: string; tasks: RoleTask[] }> = {
  adopter: { title: "マイページ", purpose: "気になる子を探し、お世話の条件を読んでから相談しましょう。", tasks: [
    { label: uiCopy.findPets, href: "/pets", description: "写真と地域で探す → 詳細を見る → その子について問い合わせる" },
    { label: "保存した相談を確認する", href: "/dashboard#consultations", description: "相談したペットと内容を振り返ります。譲渡者への送信・返信はありません。" },
    { label: uiCopy.adoptionFlow, href: "/guide", description: "条件確認・面談・トライアル・正式譲渡の順番を確認します。" },
  ] },
  rehomer: { title: "譲渡者のホーム", purpose: "自分が掲載するペットを選び、届いた里親申込みを確認しましょう。", tasks: [
    { label: "掲載中のペットと届いた里親申込みを確認", href: "/rehoming", description: "掲載中のペットを選ぶ → その子に届いた里親申込みを確認する" },
    { label: "譲渡までの進捗を確認する", href: "/reviews/progress", description: "1申込み1行で現在地を見て、確認・面談・トライアルへ進みます。" },
    { label: "応募者の条件を比較する", href: "/reviews", description: "必要なお世話と生活計画を比べ、担当者が判断します。" },
  ] },
  reviewer: { title: "審査担当のホーム", purpose: "進捗一覧から1件を選び、根拠を確認・記録して次の工程へ進めましょう。", tasks: [
    { label: "対応する申込みを選ぶ", href: "/reviews/progress", description: "現在地を確認 →「この審査を開く」→ 確認内容を保存" },
    { label: "届いた相談を確認する", href: "/reviews/consultations", description: "相談内容を確認し、審査準備への案内を記録します。" },
    { label: "未確認の書類・項目を見る", href: "/reviews/records?view=pending", description: "確認待ちの申込みを開き、書類・同意の確認状態を更新します。" },
    { label: "応募者の条件を比較する", href: "/reviews", description: "同じペットへの申込みを比較し、気になる点の理由を確認します。" },
  ] },
  admin: { title: "管理者のホーム", purpose: "運営の履歴・審査の停滞を確認し、必要に応じて各担当の画面を開けます。", tasks: [
    { label: "運営状況・履歴を確認する", href: "/admin/analytics", description: "保存された判断・操作履歴と、未解決の確認項目を把握します。" },
    { label: "届いた相談を確認する", href: "/reviews/consultations", description: "受付後の相談と審査準備への案内を確認します。" },
    { label: "全申込みの進捗を確認する", href: "/reviews/progress", description: "各審査の現在地を一覧で確認し、個別の記録へ進みます。" },
    { label: "研究の評価方針と配点を見る", href: "/research", description: "5名の形成的評価の手順と、審査点の仮の重みを確認します。" },
  ] },
};
export function navigationLabel(path: string) {
  if (path === "/") return "サイトトップ";
  if (path === "/dashboard") return "マイページ";
  if (path === "/pets") return uiCopy.findPets;
  if (/^\/pets\/[^/]+\/consult$/.test(path)) return "相談内容を入力";
  if (path.startsWith("/pets/")) return "ペットの詳細";
  if (path === "/rehoming") return uiCopy.manageListings;
  if (path === "/reviews/progress") return "審査の進捗一覧";
  if (path === "/reviews/consultations") return "届いた相談";
  if (path === "/reviews/records") return "審査対象の内訳";
  if (path === "/reviews") return "応募者の比較";
  if (path.startsWith("/reviews/")) return "確認・審査の記録";
  if (path === "/admin/analytics") return "運営状況・履歴";
  if (path === "/admin/records") return "記録の内訳";
  if (path === "/guide") return uiCopy.adoptionFlow;
  if (path.startsWith("/research")) return "研究と評価";
  if (path === "/docs") return "開発者向けAPI";
  return "ご案内";
}
