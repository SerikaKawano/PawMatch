import { canAccess } from "@/lib/permissions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, ClipboardList, PawPrint, ShieldCheck } from "lucide-react";
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
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentDemoUser();
  if (!user) redirect("/login?next=%2Fdashboard");
  if (user.role === "adopter") {
    const [profile, documents, consultations, pets] = await Promise.all([getAdopterProfile(user), listAdopterDocuments(user.id), getConsultations(user.id), getPets()]);
    return <AdopterHome initialProfile={profile} initialDocuments={documents} consultations={consultations} petNames={Object.fromEntries(pets.map(pet => [pet.id, pet.name]))} />;
  }
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
    <div className="dashboard-welcome"><div><span className="section-kicker">{user.roleLabel}としてログイン中</span><h1>{navigation.title}</h1><p>{user.name}{user.kind === "organization" ? "の担当者へ。" : "さん、"}{navigation.purpose}</p></div><div className="dashboard-user"><span className={`demo-avatar ${user.color}`}>{user.initials}</span><div><strong>{user.organization}</strong><small>{user.email}</small></div><Link href="/login">ユーザーを切り替える</Link></div></div>
    <section className="next-task-panel"><span className="role-hero-art" aria-hidden="true"><RoleIcon size={100} strokeWidth={1.35} /></span><div><span className="task-eyebrow">まずは、ここから</span><h2>{primary.label}</h2><p>{primary.description}</p></div><Link className="task-primary" href={primary.href}>{primary.label}<ArrowRight size={22} /></Link></section>
    <section className="other-tasks"><h2>目的に合わせて選ぶ</h2><div>{navigation.tasks.slice(1).map(task => <Link href={task.href} key={task.href}><h3>{task.label}<ArrowRight size={21} /></h3><p>{task.description}</p></Link>)}</div></section>
    <section className="dashboard-main"><h2>状況から確認する</h2><p>数字を押すと、該当する一覧が開きます。</p><div className="dashboard-stats">{stats.map(stat => <Link href={stat.href} key={stat.label} aria-label={`${stat.label} ${stat.value}件の内容を見る`}><strong>{stat.value}</strong><span>{stat.label}</span><span className="stat-action">一覧を見る <ArrowRight size={20} /></span></Link>)}</div></section>
    {user.role === "admin" && <section className="admin-all-menus"><div className="admin-menu-heading"><div><span className="section-kicker">管理者はすべての画面を利用できます</span><h2>役割別の操作メニュー</h2></div><p>管理者のまま各画面を開きます。別ユーザーとして試す場合は、上の「ユーザーを切り替える」を使ってください。</p></div><div className="role-menu-grid">{Object.entries(roleNavigation).map(([id, group], index) => <article className={["pink", "yellow", "brown", "cream"][index]} key={id}><h3>{group.title}</h3>{group.tasks.map(task => <Link href={task.href} key={task.href}><strong>{task.label}</strong><ArrowRight /></Link>)}</article>)}</div></section>}
    {canAccess(user, "consult") && <ConsultationHistory records={consultations} names={Object.fromEntries(pets.map(pet => [pet.id, pet.name]))} />}
    <div className="demo-notice"><ShieldCheck /><p><strong>操作上のご案内</strong>相談と審査の履歴はこのサイト内に保存されます。実際の譲渡や外部送信は行いません。</p></div>
  </div>;
}
