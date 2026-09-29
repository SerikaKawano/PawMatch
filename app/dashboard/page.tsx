import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, ClipboardList, MessageCircle, PawPrint, PlusCircle, Settings2, UsersRound } from "lucide-react";
import { currentDemoUser } from "@/lib/demo-session-server";
import { RoleHomeHero } from "@/components/RoleHomeHero";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentDemoUser();
  if (!user) redirect("/login?next=%2Fdashboard");
  if (user.role === "adopter") return <div className="role-menu-home page-wrap">
    <RoleHomeHero name={user.name} />
    <nav className="role-home-menu" aria-label="里親希望者のメニュー">
      <Link href="/pets"><span><strong>里親募集中のペットを探す</strong><small>写真とプロファイルから、気になる子の詳細を見る</small></span><ArrowRight /></Link>
      <Link href="/adopter/profile"><span><strong>プロファイルと書類</strong><small>ご自身の情報、本人確認、提出書類を確認・編集する</small></span><ArrowRight /></Link>
      <Link href="/adopter/history"><span><strong>相談・申込履歴</strong><small>相談内容と審査の進捗を確認する</small></span><ArrowRight /></Link>
    </nav>
  </div>;
  if (user.role === "rehomer") return <div className="rehomer-home page-wrap">
    <RoleHomeHero name={user.name} />
    <nav className="rehomer-home-menu" aria-label="譲渡者のメニュー">
      <Link href="/rehoming/new" className="create-listing"><span className="rehomer-menu-icon"><PlusCircle /></span><span><strong>ペットを掲載する</strong><small>新しい里親募集のプロファイルと譲渡条件を登録する</small></span><ArrowRight className="rehomer-menu-arrow" /></Link>
      <Link href="/rehoming" className="listing"><span className="rehomer-menu-icon"><PawPrint /></span><span><strong>掲載中のペット一覧</strong><small>自分が掲載しているペットと掲載内容を見る</small></span><ArrowRight className="rehomer-menu-arrow" /></Link>
      <Link href="/reviews/progress" className="progress"><span className="rehomer-menu-icon"><ClipboardList /></span><span><strong>審査進捗ボード</strong><small>受付から最終判断までの現在地を見る</small></span><ArrowRight className="rehomer-menu-arrow" /></Link>
      <Link href="/rehoming/consultations" className="enquiries"><span className="rehomer-menu-icon"><MessageCircle /></span><span><strong>届いた相談を見る</strong><small>掲載ペットについて届いた相談と対応状況を見る</small></span><ArrowRight className="rehomer-menu-arrow" /></Link>
    </nav>
  </div>;
  if (user.role === "reviewer") return <div className="reviewer-home page-wrap">
    <RoleHomeHero name={user.name} />
    <nav className="reviewer-home-menu" aria-label="審査担当者のメニュー">
      <Link href="/reviews/progress" className="progress"><span className="reviewer-menu-icon"><ClipboardList /></span><span><strong>審査進捗ボード</strong><small>担当する申込みを選び、現在の工程と次に確認する項目を見る</small></span><ArrowRight className="reviewer-menu-arrow" /></Link>
      <Link href="/reviews/consultations" className="enquiries"><span className="reviewer-menu-icon"><MessageCircle /></span><span><strong>届いた相談を見る</strong><small>相談内容を確認し、審査へ進めるか記録する</small></span><ArrowRight className="reviewer-menu-arrow" /></Link>
    </nav>
  </div>;
  return <div className="admin-home page-wrap">
    <RoleHomeHero name={user.name} />
    <nav className="reviewer-home-menu admin-home-menu" aria-label="管理者のメニュー">
      <Link href="/admin/analytics" className="analytics"><span className="reviewer-menu-icon"><BarChart3 /></span><span><strong>運営状況と履歴を確認する</strong><small>運営指標、審査状況、保存された操作履歴を確認する</small></span><ArrowRight className="reviewer-menu-arrow" /></Link>
      <Link href="/reviews/progress" className="progress"><span className="reviewer-menu-icon"><ClipboardList /></span><span><strong>審査進捗ボード</strong><small>すべての申込みの現在地と停滞している工程を確認する</small></span><ArrowRight className="reviewer-menu-arrow" /></Link>
      <Link href="/research/setup" className="settings"><span className="reviewer-menu-icon"><Settings2 /></span><span><strong>設定</strong><small>審査項目の配点と重みを変更する</small></span><ArrowRight className="reviewer-menu-arrow" /></Link>
      <Link href="/admin/users" className="users"><span className="reviewer-menu-icon"><UsersRound /></span><span><strong>ユーザ管理</strong><small>権限の変更、アカウントの停止・再開を行う</small></span><ArrowRight className="reviewer-menu-arrow" /></Link>
    </nav>
  </div>;
}
