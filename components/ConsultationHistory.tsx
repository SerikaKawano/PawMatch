import Link from "next/link";
import type { Consultation } from "@/lib/consultations";
import type { Applicant } from "@/lib/types";
import { linkedApplication } from "@/lib/consultation-journey";
import { stageLabels } from "@/lib/review-labels";

type CompactStep = { label: string; state: "done" | "active" | "pending" | "stopped" };

function compactProgress(record: Consultation, application: Applicant | null): CompactStep[] {
  const status = record.status ?? "received";
  if (status === "closed") return [
    { label: "相談受付済み", state: "done" },
    { label: "担当者確認済み", state: "done" },
    { label: "審査に進まず終了", state: "stopped" },
  ];
  if (application) return [
    { label: "相談受付済み", state: "done" },
    { label: "担当者確認済み", state: "done" },
    { label: "申込み前情報の提出済み", state: "done" },
    { label: `${stageLabels[application.stage]} を進行中`, state: "active" },
  ];
  if (status === "profile_requested") return [
    { label: "相談受付済み", state: "done" },
    { label: "担当者確認済み", state: "done" },
    { label: "申込み前情報を提出中", state: "active" },
  ];
  return [
    { label: "相談受付済み", state: "done" },
    { label: "担当者が確認中", state: "active" },
    { label: "申込み前情報の提出", state: "pending" },
  ];
}

export function ConsultationHistory({ records, names, applications = [], title = "あなたの相談履歴" }: { records: Consultation[]; names: Record<string, string>; applications?: Applicant[]; title?: string }) {
  const reviewRecords = records.filter(record => linkedApplication(record, applications));
  const enquiryRecords = records.filter(record => !linkedApplication(record, applications));

  function recordList(items: Consultation[]) {
    return <ul>{items.map(record => {
      const application = linkedApplication(record, applications);
      const steps = compactProgress(record, application);
      return <li key={record.id}>
        <div className="consultation-record-heading"><Link href={`/consultations/${record.id}`}>{`${names[record.petId] ?? record.petId}への相談`}</Link><time dateTime={record.createdAt}>{new Date(record.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</time></div>
        <ol className="consultation-mini-progress" aria-label="相談の進捗">{steps.map((step, index) => <li className={step.state} key={step.label}><span className="consultation-step-marker" aria-hidden="true">{step.state === "done" ? "✓" : index + 1}</span><span>{step.label}</span></li>)}</ol>
        <p className="consultation-message">{record.message}</p>
      </li>;
    })}</ul>;
  }

  return <section className="consultation-history" id="consultations"><h2>{title}</h2>
    {!records.length ? <p className="consultation-empty">まだ相談はありません。</p> : <div className="consultation-history-groups">
      {reviewRecords.length > 0 && <section className="consultation-history-group review"><h3>審査へ進んだ相談 <span>{reviewRecords.length}件</span></h3><p>申込みを受け付け、審査工程に進んでいる相談です。</p>{recordList(reviewRecords)}</section>}
      {enquiryRecords.length > 0 && <section className="consultation-history-group enquiry"><h3>審査前の相談 <span>{enquiryRecords.length}件</span></h3><p>審査に進む前の相談内容と対応経過です。</p>{recordList(enquiryRecords)}</section>}
    </div>}
  </section>;
}
