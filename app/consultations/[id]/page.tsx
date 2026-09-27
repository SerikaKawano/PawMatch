import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentDemoUser } from "@/lib/demo-session-server";
import { consultationReply, getAllConsultations } from "@/lib/consultations";
import { journeySteps, journeySummary, linkedApplication } from "@/lib/consultation-journey";
import { getApplicants, getPets } from "@/lib/repository";
import { demoUsers } from "@/lib/demoUsers";

export const dynamic = "force-dynamic";

function displayDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.replaceAll("-", "/");
  return new Date(value).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", dateStyle: "medium", timeStyle: "short" });
}

export default async function ConsultationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentDemoUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/consultations/${id}`)}`);
  const consultation = (await getAllConsultations()).find(item => item.id === id);
  const [applications, pets] = await Promise.all([getApplicants(), getPets()]);
  const pet = pets.find(item => item.id === consultation?.petId);
  const maySeeAsRehomer = user.role === "rehomer" && pet?.ownerId === user.id;
  if (!consultation || (!maySeeAsRehomer && consultation.userId !== user.id && user.role !== "admin" && user.role !== "reviewer")) notFound();
  const application = linkedApplication(consultation, applications);
  const reviewer = demoUsers.find(item => item.id === consultation.reviewedBy);
  const response = consultation.replyMessage ?? (consultation.reviewedAt && consultation.status && consultation.status !== "received" ? consultationReply(consultation.status) : null);
  const outcome = application?.review?.decisionRecorded
    ? application.review.decision === "approve" ? "譲渡へ進める判断" : application.review.decision === "decline" ? "今回は見送り" : "追加確認・保留"
    : consultation.status === "closed" ? "審査前に終了" : "未判定";

  return <div className="page-wrap consultation-detail-page">
    <Link href={user.role === "adopter" ? "/dashboard#consultations" : user.role === "rehomer" ? "/rehoming/consultations" : "/reviews/consultations"} className="back-link">← 相談一覧へ戻る</Link>
    <span className="section-kicker">相談・申込みの記録</span>
    <h1>{pet?.name ?? consultation.petId}への相談</h1>
    <p className={`journey-summary ${consultation.status === "closed" || outcome === "今回は見送り" ? "stopped" : application ? "active" : "waiting"}`}>{journeySummary(consultation, application)}</p>
    <dl className="journey-facts">
      <div><dt>相談受付</dt><dd>{displayDate(consultation.createdAt)}</dd></div>
      <div><dt>審査担当者の確認</dt><dd>{consultation.reviewedAt ? displayDate(consultation.reviewedAt) : "確認待ち"}</dd></div>
      <div><dt>申込みの受付</dt><dd>{application ? `${displayDate(application.submittedAt)}に受付` : "申込み前"}</dd></div>
      <div><dt>最終判断</dt><dd>{outcome}</dd></div>
    </dl>
    <section className="journey-panel"><h2>進捗タイムライン</h2>
      <ol className="journey-timeline">{journeySteps(consultation, application).map((step, index) => <li key={`${step.label}-${index}`} className={step.state}><span className="journey-number">{index + 1}</span><div><strong>{step.label}</strong><small>{step.at ? displayDate(step.at) : step.state === "pending" ? "未着手" : step.state === "active" ? "更新日時の記録なし" : "日時未記録"}</small></div></li>)}</ol>
      {application?.review?.history.length ? <div className="journey-actions"><h3>担当者が記録した工程の変更</h3><ul>{application.review.history.map((entry, index) => <li key={`${entry.at}-${index}`}>{displayDate(entry.at)}：{entry.action}</li>)}</ul></div> : null}
    </section>
    <section className="journey-panel"><h2>連絡・メッセージ履歴</h2>
      <article className="journey-message"><div><strong>{user.role === "adopter" ? "あなたからの相談" : `${demoUsers.find(item => item.id === consultation.userId)?.name ?? "里親希望者"}からの相談`}</strong><time dateTime={consultation.createdAt}>{displayDate(consultation.createdAt)}</time></div><p>{consultation.message}</p></article>
      {response && consultation.reviewedAt ? <article className="journey-message reviewer"><div><strong>{reviewer?.name ?? "審査担当者"}からの対応記録</strong><time dateTime={consultation.reviewedAt}>{displayDate(consultation.reviewedAt)}</time></div><p>{response}</p></article> : <p className="journey-no-reply">担当者からの連絡はまだありません。</p>}
    </section>
    {pet && <Link className="task-secondary" href={`/pets/${pet.id}`}>{pet.name}の詳細を見る</Link>}
  </div>;
}
