"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Home, PawPrint, Stethoscope } from "lucide-react";

const Field = ({ label, name, placeholder, type = "text" }: { label: string; name: string; placeholder?: string; type?: string }) => <label><span>{label}<b>必須</b></span><input name={name} type={type} placeholder={placeholder} required /></label>;
const TextArea = ({ label, name, placeholder }: { label: string; name: string; placeholder?: string }) => <label><span>{label}<b>必須</b></span><textarea name={name} placeholder={placeholder} required /></label>;

export function PetListingForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const payload: Record<string, FormDataEntryValue | boolean> = Object.fromEntries(form.entries());
    payload.birthDateApproximate = form.has("birthDateApproximate");
    try {
      const response = await fetch("/api/pets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "掲載内容を保存できませんでした。");
      router.push(`/pets/${result.pet.listingNumber}`); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "掲載内容を保存できませんでした。"); setBusy(false); }
  }
  return <form className="pet-listing-form" onSubmit={submit}>
    <section className="listing-form-section"><header><PawPrint /><div><span className="section-kicker">PET DETAILS</span><h2>基本情報</h2><p>公開ページの名前、種類、出生情報、募集地域を入力します。</p></div></header><div className="listing-form-grid two-columns">
      <Field label="名前" name="name" placeholder="例：Archie" /><label><span>種類<b>必須</b></span><select name="species" required defaultValue="Dog"><option value="Dog">犬</option><option value="Cat">猫</option></select></label>
      <Field label="犬種・猫種" name="breed" placeholder="例：コッカプー" /><label><span>性別<b>必須</b></span><select name="sex" required defaultValue="Female"><option value="Female">女の子</option><option value="Male">男の子</option></select></label>
      <Field label="出生年月日" name="birthDate" type="date" /><label className="listing-checkbox"><input type="checkbox" name="birthDateApproximate" /><span>出生年月日は推定</span></label>
      <Field label="募集地域" name="location" placeholder="例：London" /><Field label="性格の一言" name="temperament" placeholder="例：人と静かに過ごすのが好き" /><TextArea label="血統書" name="pedigree" placeholder="有無と、犬種・猫種を判断した根拠を記載してください。" />
    </div><p className="listing-photo-note">写真は掲載内容の確認後に追加できます。未登録の場合は犬・猫のアイコンを表示します。</p></section>
    <section className="listing-form-section"><header><Home /><div><span className="section-kicker">LIVING TOGETHER</span><h2>暮らしのポイント</h2><p>里親希望者が生活を具体的に想像できる情報を入力します。</p></div></header><div className="listing-form-grid two-columns">
      <TextArea label="住環境" name="housing" placeholder="飼育可能な住居、室内・屋外、安全対策など" /><TextArea label="お世話の時間" name="time" placeholder="留守時間、給餌、散歩、投薬、代わりに世話をする人など" /><TextArea label="必要なケアへの理解" name="care" placeholder="行動、しつけ、適応への配慮など" /><TextArea label="医療・費用への備え" name="medical" placeholder="病歴、受診先、継続ケアと費用など" /><TextArea label="家族・先住動物との生活" name="integration" placeholder="同居者の同意、安全な導入計画など" /><TextArea label="継続飼育・緊急時対応" name="continuity" placeholder="終生飼養、生活変化、緊急時、譲渡後の連絡など" />
    </div></section>
    <section className="listing-form-section"><header><Stethoscope /><div><span className="section-kicker">CARE &amp; HEALTH</span><h2>健康状態と必要なケア</h2><p>現在分かっている医療情報と、確認できる記録を入力します。</p></div></header><div className="listing-form-grid two-columns">
      <TextArea label="病歴・健康上の注意" name="medicalHistory" /><TextArea label="現在の投薬" name="medication" placeholder="投薬がない場合は「なし」と入力" /><TextArea label="ワクチン歴" name="vaccinations" placeholder="1行に1件、接種年月とワクチン名を記載" /><TextArea label="記録・証明書" name="recordEvidence" placeholder="1行に1件、提出・確認できる書類を記載" /><Field label="去勢・避妊" name="spayNeuter" placeholder="例：去勢済み（2024年5月）" /><Field label="マイクロチップ" name="microchip" placeholder="例：装着済み・番号確認済み" /><label><span>記録の確認状況<b>必須</b></span><select name="evidenceStatus" required defaultValue="未確認"><option>未確認</option><option>確認済</option></select></label>
    </div></section>
    <section className="listing-form-section"><header><HeartHandshake /><div><span className="section-kicker">BACKGROUND &amp; ADOPTION</span><h2>譲渡に至った経緯とお迎えの条件</h2><p>譲渡の背景と、譲渡者から希望者へ伝えたい条件を文章で入力します。</p></div></header><div className="listing-form-grid">
      <TextArea label="譲渡に出すことになった経緯" name="story" /><TextArea label="譲渡者からのメッセージ" name="conditionsMessage" /><TextArea label="トライアル期間" name="trial" /><TextArea label="費用" name="fees" placeholder="費用がない場合も、その旨を記載してください。" />
    </div></section>
    {error && <p className="listing-form-error" role="alert">{error}</p>}<div className="listing-form-actions"><button className="task-primary" type="submit" disabled={busy}>{busy ? "掲載内容を保存中…" : "この内容で掲載する"}</button></div>
  </form>;
}
