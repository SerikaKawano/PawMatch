import Link from "next/link";
import type { Consultation } from "@/lib/consultations";

export function ConsultationHistory({ records, names, title = "あなたの相談履歴" }: { records: Consultation[]; names: Record<string, string>; title?: string }) {
  return <section className="consultation-history" id="consultations"><h2>{title}</h2>
    <p>相談の受付と審査担当者の確認状況を表示します。相談だけで審査が始まることはありません。</p>
    {!records.length ? <p className="consultation-empty">まだ相談はありません。気になるペットの詳細から相談できます。</p> :
      <ul>{records.map(record => <li key={record.id}>
        <div><Link href={`/pets/${record.petId}/consult`}>{names[record.petId] ?? record.petId}への相談</Link><span className={`consultation-status ${record.status ?? "received"}`}>{record.status === "profile_requested" ? "事前情報の提出待ち" : record.status === "closed" ? "対応終了" : "審査担当者の確認待ち"}</span></div>
        <p><time dateTime={record.createdAt}>{new Date(record.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</time></p>
        <ol className="consultation-mini-progress" aria-label="相談の進捗"><li className="done">相談受付</li><li className={record.status === "profile_requested" ? "active" : record.status === "closed" ? "stopped" : "pending"}>{record.status === "closed" ? "対応終了" : "担当者確認"}</li><li className={record.status === "profile_requested" ? "active" : "pending"}>事前情報の提出</li></ol>
        {record.status === "profile_requested" && <p className="consultation-next-step">審査担当者が次の手続きへ進めました。事前情報の提出が済むまで、適合性の審査は始まりません。</p>}
        {record.status === "closed" && <p className="consultation-next-step">この相談は終了しました。必要な場合は新しくお問い合わせください。</p>}
        <p className="consultation-message">{record.message}</p>
      </li>)}</ul>}
  </section>;
}
