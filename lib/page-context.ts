import type { DemoUser } from "./demoUsers";

type Role = DemoUser["role"] | null;
export type PageContext = { title: string; backHref: string; backLabel: string };

/** One predictable parent destination per page; never depends on browser history. */
export function pageContext(pathname: string, role: Role): PageContext | null {
  if (pathname === "/") return null;
  const exact: Record<string, PageContext> = {
    "/login": { title: "ログイン", backHref: "/", backLabel: "トップへ戻る" },
    "/guide": { title: "譲渡までの流れ", backHref: "/", backLabel: "トップへ戻る" },
    "/pets": { title: "ペットを探す", backHref: "/", backLabel: "トップへ戻る" },
    "/dashboard": { title: "マイページ", backHref: "/", backLabel: "トップへ戻る" },
    "/rehoming": { title: "掲載中のペット一覧", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/rehoming/consultations": { title: "届いた相談", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/reviews": { title: "申込みの確認", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/reviews/progress": { title: "審査進捗ボード", backHref: "/reviews", backLabel: "申込み一覧へ戻る" },
    "/reviews/consultations": { title: "相談一覧", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/reviews/adopters": { title: "里親希望者の一覧", backHref: "/reviews", backLabel: "申込み一覧へ戻る" },
    "/reviews/records": { title: "審査記録", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/admin/records": { title: "管理記録", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/admin/analytics": { title: "累積・履歴分析", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/research": { title: "研究評価", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/research/setup": { title: "研究評価の設定", backHref: "/research", backLabel: "研究評価へ戻る" },
    "/research/results": { title: "研究評価の結果", backHref: "/research", backLabel: "研究評価へ戻る" },
    "/terms": { title: "利用条件", backHref: "/", backLabel: "トップへ戻る" },
    "/privacy": { title: "データの取扱い", backHref: "/", backLabel: "トップへ戻る" },
    "/docs": { title: "API案内", backHref: "/", backLabel: "トップへ戻る" },
    "/access-denied": { title: "アクセスできません", backHref: "/", backLabel: "トップへ戻る" },
  };
  if (exact[pathname]) return exact[pathname];
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "pets" && parts.length === 3 && parts[2] === "consult") return { title: "相談内容を入力", backHref: `/pets/${parts[1]}`, backLabel: "ペットの詳細へ戻る" };
  if (parts[0] === "pets" && parts.length === 2) return { title: "ペットの詳細", backHref: "/pets", backLabel: "ペット一覧へ戻る" };
  if (parts[0] === "reviews" && parts[1] === "applicants" && parts.length === 3) return { title: "申込者のプロフィール", backHref: `/reviews/${parts[2]}`, backLabel: "審査ケースへ戻る" };
  if (parts[0] === "reviews" && parts[1] === "adopters" && parts.length === 3) return { title: "里親希望者のプロフィール", backHref: role === "rehomer" ? "/reviews/progress" : "/reviews/adopters", backLabel: role === "rehomer" ? "審査進捗へ戻る" : "里親希望者一覧へ戻る" };
  if (parts[0] === "reviews" && parts.length === 2) return { title: "審査ケース", backHref: "/reviews/progress", backLabel: "審査進捗へ戻る" };
  if (parts[0] === "consultations" && parts.length === 2) return { title: "相談の詳細", backHref: role === "adopter" ? "/dashboard#consultations" : role === "rehomer" ? "/rehoming/consultations" : "/reviews/consultations", backLabel: "相談一覧へ戻る" };
  if (parts[0] === "research" && parts[1] === "session" && parts.length === 3) return { title: "研究評価セッション", backHref: "/research", backLabel: "研究評価へ戻る" };
  return null;
}
