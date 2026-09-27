import Link from "next/link";
import type { Consultation } from "@/lib/consultations";

export function ConsultationHistory({ records, names }: { records: Consultation[]; names: Record<string, string> }) {
  return <section className="consultation-history" id="consultations"><h2>あなたの相談履歴</h2>
    <p>このテストユーザーで保存した相談です。募集者への実際の送信・返信はありません。</p>
    {!records.length ? <p className="consultation-empty">まだ相談はありません。気になるペットの詳細から相談できます。</p> :
      <ul>{records.map(record => <li key={record.id}>
        <div><Link href={`/pets/${record.petId}/consult`}>{names[record.petId] ?? record.petId}への相談</Link><span>保存済み</span></div>
        <p><strong>{record.topic}</strong> · <time dateTime={record.createdAt}>{new Date(record.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</time></p>
        <p className="consultation-message">{record.message}</p>
      </li>)}</ul>}
  </section>;
}
