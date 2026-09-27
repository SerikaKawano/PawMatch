import { canAccess } from "@/lib/permissions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, ClipboardList, MessageCircle, PawPrint, ShieldCheck } from "lucide-react";
import { currentDemoUser } from "@/lib/demo-session-server";
import { getConsultations } from "@/lib/consultations";
import { ConsultationHistory } from "@/components/ConsultationHistory";
import { getApplicants, getPets } from "@/lib/repository";
import { selectRecords } from "@/lib/record-filters";
import { roleNavigation } from "@/lib/role-navigation";
import { visibleApplications, visiblePets } from "@/lib/ownership";
import { getAdopterProfile } from "@/lib/adopter-profile";
import { listAdopterDocuments } from "@/lib/adopter-documents";
import { AdopterHome } from "@/components/AdopterHome";
import { requestsForAdopter } from "@/lib/document-requests";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentDemoUser();
  if (!user) redirect("/login?next=%2Fdashboard");
  if (user.role === "adopter") {
    const [profile, documents, requests, consultations, applications, pets] = await Promise.all([getAdopterProfile(user), listAdopterDocuments(user.id), requestsForAdopter(user.id), getConsultations(user.id), getApplicants(), getPets()]);
    return <AdopterHome initialProfile={profile} initialDocuments={documents} initialRequests={requests} consultations={consultations} applications={applications.filter(application => application.userId === user.id)} petNames={Object.fromEntries(pets.map(pet => [pet.id, pet.name]))} />;
  }
  if (user.role === "rehomer") return <div className="rehomer-home page-wrap">
    <header className="rehomer-home-intro"><h2>{user.name}さん</h2><p>掲載、審査、相談を確認できます。</p></header>
    <nav className="rehomer-home-menu" aria-label="譲渡者のメニュー">
      <Link href="/rehoming" className="listing"><span className="rehomer-menu-icon"><PawPrint /></span><span><strong>掲載中のペット一覧</strong><small>自分が掲載しているペットと届いた申込みを見る</small></span><ArrowRight className="rehomer-menu-arrow" /></Link>
      <Link href="/reviews/progress" className="progress"><span className="rehomer-menu-icon"><ClipboardList /></span><span><strong>審査進捗ボード</strong><small>受付から最終判断までの現在地を見る</small></span><ArrowRight className="rehomer-menu-arrow" /></Link>
      <Link href="/rehoming/consultations" className="enquiries"><span className="rehomer-menu-icon"><MessageCircle /></span><span><strong>届いた相談を見る</strong><small>掲載ペットについて届いた相談と対応状況を見る</small></span><ArrowRight className="rehomer-menu-arrow" /></Link>
    </nav>
  </div>;
  if (user.role === "reviewer") return <div className="reviewer-home page-wrap">
    <header className="reviewer-home-intro"><h2>{user.name}さん</h2><p>担当する相談と申込みの確認・記録を行います。</p></header>
    <nav className="reviewer-home-menu" aria-label="審査担当者のメニュー">
      <Link href="/reviews/progress" className="progress"><span className="reviewer-menu-icon"><ClipboardList /></span><span><strong>審査進捗ボード</strong><small>担当する申込みを選び、現在の工程と次に確認する項目を見る</small></span><ArrowRight className="reviewer-menu-arrow" /></Link>
      <Link href="/reviews/consultations" className="enquiries"><span className="reviewer-menu-icon"><MessageCircle /></span><span><strong>届いた相談を見る</strong><small>相談内容を確認し、審査へ進めるか記録する</small></span><ArrowRight className="reviewer-menu-arrow" /></Link>
      <Link href="/reviews/records?view=pending" className="documents"><span className="reviewer-menu-icon"><ShieldCheck /></span><span><strong>書類の確認待ちを見る</strong><small>提出書類と同意の確認状況を更新する</small></span><ArrowRight className="reviewer-menu-arrow" /></Link>
    </nav>
  </div>;
  const [allApplications, allPets, consultations] = await Promise.all([canAccess(user, "review") ? getApplicants() : Promise.resolve([]), getPets(), canAccess(user, "consult") ? getConsultations(user.id) : Promise.resolve([])]);
  const applications = visibleApplications(user, allApplications, allPets);
  const pets = visiblePets(user, allPets);
  const navigation = roleNavigation[user.role];
  const primary = navigation.tasks[0];
  const RoleIcon = { rehomer: PawPrint, reviewer: ClipboardList, admin: BarChart3 }[user.role];
  const count = (view: string) => selectRecords(view, applications).length;
  const stats = {
    admin: [{ label: "全申込み", value: applications.length, href: "/reviews/progress" }, { label: "要確認", value: count("attention"), href: "/admin/records?view=attention" }, { label: "譲渡へ進める判断", value: count("adoptions"), href: "/admin/records?view=adoptions" }],
    reviewer: [{ label: "要確認の申込み", value: count("attention"), href: "/reviews/records?view=attention" }, { label: "書類・項目の確認待ち", value: count("pending"), href: "/reviews/records?view=pending" }, { label: "面談の工程にある申込み", value: count("meetings"), href: "/reviews/records?view=meetings" }],
    rehomer: [{ label: "掲載中のペット", value: pets.length, href: "/rehoming" }, { label: "届いた里親申込み", value: applications.length, href: "/reviews" }, { label: "トライアル中", value: count("trials"), href: "/reviews/records?view=trials" }],
  }[user.role];

  return <div className="dashboard-page role-dashboard">
    <div className="dashboard-welcome"><div><span className="section-kicker">{user.roleLabel}としてログイン中</span><h2>{user.name}{user.kind === "organization" ? "" : "さん"}</h2><p>{navigation.purpose}</p></div><div className="dashboard-user"><span className={`demo-avatar ${user.color}`}>{user.initials}</span><div><strong>{user.organization}</strong><small>{user.email}</small></div><Link href="/login">ユーザーを切り替える</Link></div></div>
    <section className="next-task-panel"><span className="role-hero-art" aria-hidden="true"><RoleIcon size={100} strokeWidth={1.35} /></span><div><span className="task-eyebrow">まずは、ここから</span><h2>{primary.label}</h2><p>{primary.description}</p></div><Link className="task-primary" href={primary.href}>{primary.label}<ArrowRight size={22} /></Link></section>
    <section className="other-tasks"><h2>目的に合わせて選ぶ</h2><div>{navigation.tasks.slice(1).map(task => <Link href={task.href} key={task.href}><h3>{task.label}<ArrowRight size={21} /></h3><p>{task.description}</p></Link>)}</div></section>
    <section className="dashboard-main"><h2>状況から確認する</h2><p>数字を押すと、該当する一覧が開きます。</p><div className="dashboard-stats">{stats.map(stat => <Link href={stat.href} key={stat.label} aria-label={`${stat.label} ${stat.value}件の内容を見る`}><strong>{stat.value}</strong><span>{stat.label}</span><span className="stat-action">一覧を見る <ArrowRight size={20} /></span></Link>)}</div></section>
    {user.role === "admin" && <section className="admin-all-menus"><div className="admin-menu-heading"><div><span className="section-kicker">管理者はすべての画面を利用できます</span><h2>役割別の操作メニュー</h2></div><p>管理者のまま各画面を開きます。別ユーザーとして試す場合は、上の「ユーザーを切り替える」を使ってください。</p></div><div className="role-menu-grid">{Object.entries(roleNavigation).map(([id, group], index) => <article className={["pink", "yellow", "brown", "cream"][index]} key={id}><h3>{group.title}</h3>{group.tasks.map(task => <Link href={task.href} key={task.href}><strong>{task.label}</strong><ArrowRight /></Link>)}</article>)}</div></section>}
    {canAccess(user, "consult") && <ConsultationHistory records={consultations} names={Object.fromEntries(pets.map(pet => [pet.id, pet.name]))} applications={applications} />}
    <div className="demo-notice"><ShieldCheck /><p><strong>操作上のご案内</strong>相談と審査の履歴はこのサイト内に保存されます。実際の譲渡や外部送信は行いません。</p></div>
  </div>;
}
