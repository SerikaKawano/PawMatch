import Link from "next/link";
import type { Consultation } from "@/lib/consultations";
import type { Applicant } from "@/lib/types";
import { journeySummary, linkedApplication } from "@/lib/consultation-journey";
import { stageLabels } from "@/lib/review-labels";

export function ConsultationHistory({ records, names, applications = [], title = "あなたの相談履歴" }: { records: Consultation[]; names: Record<string, string>; applications?: Applicant[]; title?: string }) {
  const reviewRecords = records.filter(record => linkedApplication(record, applications));
  const enquiryRecords = records.filter(record => !linkedApplication(record, applications));

  function recordList(items: Consultation[]) {
    return <ul>{items.map(record => {
      const application = linkedApplication(record, applications);
      const pathLabel = application ? "審査中" : record.status === "profile_requested" ? "審査準備中" : "相談のみ";
      return <li key={record.id}>
        <div><Link href={`/consultations/${record.id}`}>{`${names[record.petId] ?? record.petId}への相談`}</Link><span className={`consultation-path ${application ? "review" : "enquiry"}`}>{pathLabel}</span><span className={`consultation-status ${record.status ?? "received"}`}>{application ? stageLabels[application.stage] : record.status === "profile_requested" ? "事前情報の提出待ち" : record.status === "closed" ? "対応終了" : "審査担当者の確認待ち"}</span></div>
        <p><time dateTime={record.createdAt}>{new Date(record.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</time></p>
        <ol className="consultation-mini-progress" aria-label="相談の進捗"><li className="done">相談受付</li><li className={record.status === "received" || !record.status ? "active" : "done"}>担当者確認</li><li className={record.status === "closed" ? "stopped" : application || record.status === "profile_requested" ? "active" : "pending"}>{record.status === "closed" ? "審査前終了" : application ? stageLabels[application.stage] : "事前情報の提出"}</li></ol>
        <p className="consultation-next-step">{journeySummary(record, application)}</p>
        <p className="consultation-message">{record.message}</p>
      </li>;
    })}</ul>;
  }

  return <section className="consultation-history" id="consultations"><h2>{title}</h2>
    {!records.length ? <p className="consultation-empty">まだ相談はありません。</p> : <div className="consultation-history-groups">
      {reviewRecords.length > 0 && <section className="consultation-history-group review"><h3>審査へ進んだ相談 <span>{reviewRecords.length}件</span></h3><p>申込みを受け付け、審査工程に進んでいる相談です。</p>{recordList(reviewRecords)}</section>}
      {enquiryRecords.length > 0 && <section className="consultation-history-group enquiry"><h3>審査前の相談 <span>{enquiryRecords.length}件</span></h3><p>担当者の返信待ち、プロファイルの提出準備中、または相談のみで終了した記録です。</p>{recordList(enquiryRecords)}</section>}
    </div>}
  </section>;
}
