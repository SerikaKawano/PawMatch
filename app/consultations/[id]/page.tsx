import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentDemoUser } from "@/lib/demo-session-server";
import { consultationThread, getAllConsultations } from "@/lib/consultations";
import { journeySteps, journeySummary } from "@/lib/consultation-journey";
import { getApplicants, getPets } from "@/lib/repository";
import { demoUsers } from "@/lib/demoUsers";
import { ConsultationReplyForm } from "@/components/ConsultationReplyForm";
import { petPath } from "@/lib/pet-routes";
import { groupConsultations } from "@/lib/consultation-groups";
import { ConsultationWorkflowActions } from "@/components/ConsultationWorkflowActions";
import { getAdopterProfile } from "@/lib/adopter-profile";
import { listAdopterDocuments } from "@/lib/adopter-documents";
import { Building2, FileText, PawPrint, UserRound } from "lucide-react";

export const dynamic = "force-dynamic";

function displayDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.replaceAll("-", "/");
  return new Date(value).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", dateStyle: "medium", timeStyle: "short" });
}

export default async function ConsultationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentDemoUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/consultations/${id}`)}`);
  const [allConsultations, applications, pets] = await Promise.all([getAllConsultations(), getApplicants(), getPets()]);
  const selectedConsultation = allConsultations.find(item => item.id === id);
  const pet = pets.find(item => item.id === selectedConsultation?.petId);
  const maySeeAsRehomer = user.role === "rehomer" && pet?.ownerId === user.id;
  if (!selectedConsultation || (!maySeeAsRehomer && selectedConsultation.userId !== user.id && user.role !== "admin" && user.role !== "reviewer")) notFound();
  const group = groupConsultations(allConsultations, applications).find(item => item.key === `${selectedConsultation.userId}:${selectedConsultation.petId}`);
  if (!group) notFound();
  const consultation = group.representative;
  const application = group.application;
  const messages = group.records.flatMap(consultationThread).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const adopter = demoUsers.find(item => item.id === consultation.userId && item.role === "adopter");
  const rehomer = demoUsers.find(item => item.id === pet?.ownerId);
  const mayInspectProfiles = user.role === "reviewer" || user.role === "admin";
  const [adopterProfile, adopterDocuments] = mayInspectProfiles && adopter
    ? await Promise.all([getAdopterProfile(adopter), listAdopterDocuments(adopter.id)])
    : [null, []];
  const rehomerPets = mayInspectProfiles && rehomer ? pets.filter(item => item.ownerId === rehomer.id) : [];
  const outcome = application?.review?.decisionRecorded
    ? application.review.decision === "approve" ? "譲渡済" : application.review.decision === "decline" ? "今回は見送り" : "追加確認・保留"
    : group.status === "closed" ? "審査前に終了" : "未判定";

  return <div className="page-wrap consultation-detail-page">
    <h1>{pet?.name ?? consultation.petId}への相談</h1>
    <section className="consultation-role-policy" aria-labelledby="consultation-participants-title">
      <div><h2 id="consultation-participants-title">この相談に参加する人</h2><p>ペットの暮らし・健康・性格は譲渡者が回答し、審査・書類・手続きはPawMatch運営が担当します。里親希望者は同じ履歴で双方と連絡できます。</p></div>
      <ul>
        <li className="adopter"><strong>里親希望者</strong><span>{demoUsers.find(item => item.id === consultation.userId)?.name ?? "相談者"}</span></li>
        <li className="rehomer"><strong>譲渡者</strong><span>{rehomer?.name ?? "掲載者"}</span></li>
        <li className="operations"><strong>PawMatch運営</strong><span>審査担当者・管理者</span></li>
      </ul>
    </section>
    {mayInspectProfiles && adopter && rehomer && adopterProfile ? <section className="consultation-profile-overview" aria-labelledby="consultation-profile-title">
      <div className="consultation-profile-heading"><h2 id="consultation-profile-title">関係者のプロファイル</h2><p>審査・書類確認に必要な登録情報を確認できます。</p></div>
      <div className="consultation-profile-grid">
        <article className="adopter">
          <div className="consultation-profile-role"><span><UserRound aria-hidden="true" /></span><div><small>里親希望者</small><h3>{adopterProfile.fullName}</h3></div></div>
          <dl><div><dt>連絡先</dt><dd>{adopterProfile.contact || adopter.email}</dd></div><div><dt>お住まい</dt><dd>{adopterProfile.region || "未入力"}</dd></div><div><dt>本人確認</dt><dd>{adopterProfile.identityStatus === "verified" ? "本人確認済み" : adopterProfile.identityStatus === "pending" ? "本人確認待ち" : "本人確認未申請"}</dd></div><div><dt><FileText aria-hidden="true" /> 登録書類</dt><dd>{adopterDocuments.length}件</dd></div></dl>
          <Link className="task-secondary" href={`/reviews/adopters/${adopter.id}`}>里親希望者の詳細・書類を見る →</Link>
        </article>
        <article className="rehomer">
          <div className="consultation-profile-role"><span><Building2 aria-hidden="true" /></span><div><small>譲渡者</small><h3>{rehomer.name}</h3></div></div>
          <dl><div><dt>区分</dt><dd>{rehomer.kind === "organization" ? "団体" : "個人"}</dd></div><div><dt>所属・活動名</dt><dd>{rehomer.organization}</dd></div><div><dt>連絡先</dt><dd>{rehomer.email}</dd></div><div><dt><PawPrint aria-hidden="true" /> 掲載ペット</dt><dd>{rehomerPets.length}頭</dd></div></dl>
          <Link className="task-secondary" href={`/reviews/rehomers/${rehomer.id}`}>譲渡者の詳細を見る →</Link>
        </article>
      </div>
    </section> : null}
    <p className={`journey-summary ${group.status === "closed" || outcome === "今回は見送り" ? "stopped" : application ? "active" : "waiting"}`}>{journeySummary(consultation, application)}</p>
    {group.status==="profile_requested"&&<ConsultationWorkflowActions consultationId={consultation.id} applicationId={application?.id} role={user.role}/>} 
    <dl className="journey-facts">
      <div><dt>相談受付</dt><dd>{displayDate(group.firstAt)}</dd></div>
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
      <ConsultationReplyForm consultationId={consultation.id} role={user.role} closed={group.status === "closed"} />
    </section>
    {pet && <Link className="task-secondary" href={petPath(pet)}>{pet.name}の詳細を見る</Link>}
  </div>;
}
