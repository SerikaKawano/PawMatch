import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentDemoUser } from "@/lib/demo-session-server";
import { consultationThread, getAllConsultations } from "@/lib/consultations";
import { journeySteps, journeySummary, linkedApplication } from "@/lib/consultation-journey";
import { getApplicants, getPets } from "@/lib/repository";
import { demoUsers } from "@/lib/demoUsers";
import { ConsultationReplyForm } from "@/components/ConsultationReplyForm";

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
  const messages = consultationThread(consultation);
  const rehomer = demoUsers.find(item => item.id === pet?.ownerId);
  const outcome = application?.review?.decisionRecorded
    ? application.review.decision === "approve" ? "譲渡へ進める判断" : application.review.decision === "decline" ? "今回は見送り" : "追加確認・保留"
    : consultation.status === "closed" ? "審査前に終了" : "未判定";

  return <div className="page-wrap consultation-detail-page">
    <Link href={user.role === "adopter" ? "/adopter/history" : user.role === "rehomer" ? "/rehoming/consultations" : "/reviews/consultations"} className="back-link">← 相談一覧へ戻る</Link>
    <h1>{pet?.name ?? consultation.petId}への相談</h1>
    <section className="consultation-role-policy" aria-labelledby="consultation-participants-title">
      <div><h2 id="consultation-participants-title">この相談に参加する人</h2><p>ペットの暮らし・健康・性格は譲渡者が回答し、審査・書類・手続きはPawMatch運営が担当します。里親希望者は同じ履歴で双方と連絡できます。</p></div>
      <ul>
        <li className="adopter"><strong>里親希望者</strong><span>{demoUsers.find(item => item.id === consultation.userId)?.name ?? "相談者"}</span></li>
        <li className="rehomer"><strong>譲渡者</strong><span>{rehomer?.name ?? "掲載者"}</span></li>
        <li className="operations"><strong>PawMatch運営</strong><span>審査担当者・管理者</span></li>
      </ul>
    </section>
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
      {messages.map((message, index) => {
        const author = demoUsers.find(item => item.id === message.authorId);
        const isReviewer = author?.role === "reviewer" || author?.role === "admin";
        const isRehomer = author?.role === "rehomer";
        const label = message.authorId === user.id ? "あなた"
          : isReviewer ? `${author?.name ?? "担当者"}（PawMatch運営）`
            : isRehomer ? `${author?.name ?? "掲載者"}（譲渡者）`
              : `${author?.name ?? "相談者"}（里親希望者）`;
        const messageRole = isReviewer ? "operations" : isRehomer ? "rehomer" : "applicant";
        return <article className={`journey-message ${messageRole}`} key={message.id}>
          <div><strong>{index === 0 ? `${label}からの相談` : label}</strong><time dateTime={message.createdAt}>{displayDate(message.createdAt)}</time></div><p>{message.body}</p>
        </article>;
      })}
      {messages.length === 1 && <p className="journey-no-reply">譲渡者またはPawMatch運営からの返信をお待ちください。</p>}
      <ConsultationReplyForm consultationId={consultation.id} role={user.role} closed={consultation.status === "closed"} />
    </section>
    {pet && <Link className="task-secondary" href={`/pets/${pet.id}`}>{pet.name}の詳細を見る</Link>}
  </div>;
}
