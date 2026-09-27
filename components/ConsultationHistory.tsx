import Link from "next/link";
import type { Consultation } from "@/lib/consultations";
import type { Applicant } from "@/lib/types";
import { journeySummary, linkedApplication } from "@/lib/consultation-journey";
import { stageLabels } from "@/lib/review-labels";

export function ConsultationHistory({ records, names, applications = [], title = "あなたの相談履歴" }: { records: Consultation[]; names: Record<string, string>; applications?: Applicant[]; title?: string }) {
  return <section className="consultation-history" id="consultations"><h2>{title}</h2>
    {!records.length ? <p className="consultation-empty">まだ相談はありません。</p> :
      <ul>{records.map(record => {
        const application = linkedApplication(record, applications);
        return <li key={record.id}>
        <div><Link href={`/consultations/${record.id}`}>{`${names[record.petId] ?? record.petId}への相談`}</Link><span className={`consultation-status ${record.status ?? "received"}`}>{application ? stageLabels[application.stage] : record.status === "profile_requested" ? "事前情報の提出待ち" : record.status === "closed" ? "対応終了" : "審査担当者の確認待ち"}</span></div>
        <p><time dateTime={record.createdAt}>{new Date(record.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</time></p>
        <ol className="consultation-mini-progress" aria-label="相談の進捗"><li className="done">相談受付</li><li className={record.status === "received" || !record.status ? "active" : "done"}>担当者確認</li><li className={record.status === "closed" ? "stopped" : application || record.status === "profile_requested" ? "active" : "pending"}>{record.status === "closed" ? "審査前終了" : application ? stageLabels[application.stage] : "事前情報の提出"}</li></ol>
        <p className="consultation-next-step">{journeySummary(record, application)}</p>
        <p className="consultation-message">{record.message}</p>
      </li>; })}</ul>}
  </section>;
}
