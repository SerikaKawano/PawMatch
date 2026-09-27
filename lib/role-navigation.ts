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
  admin: { title: "管理者のホーム", purpose: "運営状況、審査、設定、ユーザを管理できます。", tasks: [
    { label: "運営状況と履歴を確認する", href: "/admin/analytics", description: "運営指標、審査状況、保存された操作履歴を確認します。" },
    { label: "審査進捗ボード", href: "/reviews/progress", description: "すべての申込みの現在地と停滞している工程を確認します。" },
    { label: "設定", href: "/research/setup", description: "審査項目の配点と重みを変更します。" },
    { label: "ユーザ管理", href: "/admin/users", description: "権限の変更、アカウントの停止・再開を行います。" },
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
  if (path === "/admin/users") return "ユーザ管理";
  if (path === "/admin/records") return "記録の内訳";
  if (path === "/guide") return uiCopy.adoptionFlow;
  if (path.startsWith("/research")) return "研究と評価";
  if (path === "/docs") return "開発者向けAPI";
  return "ご案内";
}
