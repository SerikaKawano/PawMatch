import type { DemoRole } from "./demoUsers";
import { uiCopy } from "./ui-copy";
export type RoleTask = { label: string; href: string; description: string };
export const roleNavigation: Record<DemoRole, { title: string; purpose: string; tasks: RoleTask[] }> = {
  adopter: { title: "里親希望者のホーム", purpose: "気になる子を探し、お世話の条件を読んでから相談しましょう。", tasks: [
    { label: "里親募集中のペットを探す", href: "/pets", description: "写真とプロファイルから、気になる子の詳細を見る" },
    { label: "プロファイルと書類", href: "/adopter/profile", description: "ご自身の情報、本人確認、提出書類を確認・編集する" },
    { label: "相談・申込履歴", href: "/adopter/history", description: "相談したペットと審査の進捗を確認します。" },
  ] },
  rehomer: { title: "譲渡者のホーム", purpose: "掲載ペット、審査進捗、届いた相談を確認できます。", tasks: [
    { label: "掲載中のペット一覧", href: "/rehoming", description: "掲載中のペットと掲載内容を確認します。" },
    { label: "審査進捗ボード", href: "/reviews/progress", description: "1申込み1行で現在地を見て、確認・面談・トライアルへ進みます。" },
    { label: "届いた相談を見る", href: "/rehoming/consultations", description: "掲載ペットへの相談と対応状況を確認します。" },
  ] },
  reviewer: { title: "審査担当のホーム", purpose: "進捗一覧から1件を選び、根拠を確認・記録して次の工程へ進めましょう。", tasks: [
    { label: "審査進捗ボード", href: "/reviews/progress", description: "現在地を確認し、対象の審査を開いて確認内容を保存します。" },
    { label: "届いた相談を見る", href: "/reviews/consultations", description: "相談内容を確認し、審査準備への案内を記録します。" },
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
  if (path === "/reviews") return "審査の進捗一覧";
  if (path.startsWith("/reviews/")) return "確認・審査の記録";
  if (path === "/admin/analytics") return "運営状況・履歴";
  if (path === "/admin/records") return "記録の内訳";
  if (path === "/guide") return uiCopy.adoptionFlow;
  if (path.startsWith("/research")) return "研究と評価";
  if (path === "/docs") return "開発者向けAPI";
  return "ご案内";
}
