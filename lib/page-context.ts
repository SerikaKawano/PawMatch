import type { DemoUser } from "./demoUsers";

type Role = DemoUser["role"] | null;
export type PageContext = { title: string; description: string; backHref: string; backLabel: string };

/** One predictable parent destination per page; never depends on browser history. */
export function pageContext(pathname: string, role: Role): PageContext | null {
  if (pathname === "/") return null;
  if (pathname === "/dashboard") return {
    title: role === "reviewer" ? "審査担当のホーム" : role === "rehomer" ? "譲渡者のホーム" : role === "admin" ? "管理者のホーム" : "里親希望者のホーム",
    description: role === "reviewer" ? "担当する相談と申込みの確認・記録を行います。" : role === "rehomer" ? "掲載中のペット、審査進捗、届いた相談を確認できます。" : role === "admin" ? "運営の履歴・審査状況を確認したり設定の変更やユーザ管理が行えます" : "ペット探し、プロファイルの管理、相談・申込みの確認ができます。",
    backHref: "/", backLabel: "トップへ戻る",
  };
  const exact: Record<string, PageContext> = {
    "/login": { title: "ログイン", description: "画面確認に使用するテストユーザを選択します。", backHref: "/", backLabel: "トップへ戻る" },
    "/guide": { title: "譲渡までの流れ", description: "ペットを探してから正式譲渡に至るまでの手順と確認事項を説明します。", backHref: "/", backLabel: "トップへ戻る" },
    "/pets": { title: "里親募集中のペットたち", description: "写真や募集条件からペットを探し、詳細を確認できます。", backHref: "/", backLabel: "トップへ戻る" },
    "/adopter/profile": { title: "プロファイルと書類", description: "里親希望者の基本情報、飼育環境、本人確認、提出書類を管理します。", backHref: "/dashboard", backLabel: "ホームへ戻る" },
    "/adopter/history": { title: "相談・申込履歴", description: "これまでの相談、メッセージ、申込み後の審査進捗を確認できます。", backHref: "/dashboard", backLabel: "ホームへ戻る" },
    "/rehoming": { title: "掲載中のペット一覧", description: "掲載しているペットと、ペットごとの審査状況を確認できます。", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/rehoming/consultations": { title: "届いた相談", description: "掲載ペットへの相談を確認し、ペット固有の質問へ譲渡者として返信できます。", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/reviews/progress": { title: "審査進捗ボード", description: "受付から最終判断までの進捗を一目で確認できます。", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/reviews/consultations": { title: "相談一覧", description: "届いた相談を確認し、申込みの準備へ進めるか対応を記録します。", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/reviews/adopters": { title: "里親希望者のプロファイル", description: "登録情報、本人確認、提出書類の状態を確認できます。", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/admin/records": { title: "管理記録", description: "条件に該当する審査ケースと確認事項の内訳を表示します。", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/admin/analytics": { title: "審査の履歴・累積分析", description: "審査状況、判断、保存された操作履歴を集計して確認できます。", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/admin/users": { title: "ユーザ管理", description: "テストユーザの権限変更、アカウントの停止・再開を行います。", backHref: "/dashboard", backLabel: "管理者ホームへ戻る" },
    "/research": { title: "研究評価", description: "形成的評価の手順、評価項目、現在の研究設定を確認します。", backHref: "/dashboard", backLabel: "マイページへ戻る" },
    "/research/setup": { title: "審査項目と重みの設定", description: "審査項目の配点と変更理由を設定し、審査画面へ反映します。", backHref: "/research", backLabel: "研究評価へ戻る" },
    "/research/results": { title: "審査の比較と評価結果", description: "参加者評価の回答と指標を集計し、工程ごとの課題を確認します。", backHref: "/research", backLabel: "研究評価へ戻る" },
    "/terms": { title: "利用条件", description: "このサイトの利用範囲と、安全な譲渡に必要な前提を説明します。", backHref: "/", backLabel: "トップへ戻る" },
    "/privacy": { title: "データの取扱い", description: "入力・保存される情報と、研究評価での取扱いを説明します。", backHref: "/", backLabel: "トップへ戻る" },
    "/docs": { title: "API案内", description: "ペットと申込みのAPI仕様およびデータ構成を確認できます。", backHref: "/", backLabel: "トップへ戻る" },
    "/access-denied": { title: "アクセスできません", description: "現在のロールではこの機能を利用できません。", backHref: "/", backLabel: "トップへ戻る" },
  };
  if (exact[pathname]) return exact[pathname];
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "pets" && parts.length === 3 && parts[2] === "consult") return { title: "相談内容を入力", description: "相談内容と連絡先を入力し、譲渡者へ問い合わせます。", backHref: `/pets/${parts[1]}`, backLabel: "ペットの詳細へ戻る" };
  if (parts[0] === "pets" && parts.length === 2) return { title: "ペットの詳細", description: "ペットのプロファイル、健康状態、必要なケア、譲渡条件を確認できます。", backHref: "/pets", backLabel: "ペット一覧へ戻る" };
  if (parts[0] === "reviews" && parts[1] === "applicants" && parts.length === 3) return { title: "申込者のプロファイル", description: "申込者の基本情報と詳しい飼育環境を確認できます。", backHref: `/reviews/${parts[2]}`, backLabel: "審査ケースへ戻る" };
  if (parts[0] === "reviews" && parts[1] === "adopters" && parts.length === 3) return { title: "里親希望者のプロファイル", description: "里親希望者の登録情報、本人確認、提出書類を確認できます。", backHref: role === "rehomer" ? "/reviews/progress" : "/reviews/adopters", backLabel: role === "rehomer" ? "審査進捗へ戻る" : "里親希望者一覧へ戻る" };
  if (parts[0] === "reviews" && parts.length === 2 && parts[1] !== "records") return { title: "審査ケース", description: "ペットと申込者の情報を照合し、現在の工程の確認結果を記録します。", backHref: "/reviews/progress", backLabel: "審査進捗へ戻る" };
  if (parts[0] === "consultations" && parts.length === 2) return { title: "相談の詳細", description: "里親希望者・譲渡者・PawMatch運営のメッセージと、申込み・審査への進捗を確認できます。", backHref: role === "adopter" ? "/adopter/history" : role === "rehomer" ? "/rehoming/consultations" : "/reviews/consultations", backLabel: "相談一覧へ戻る" };
  if (parts[0] === "research" && parts[1] === "session" && parts.length === 3) return { title: "研究評価セッション", description: "用意されたケースを確認し、各工程の分かりやすさと有用性を評価します。", backHref: "/research", backLabel: "研究評価へ戻る" };
  return null;
}
