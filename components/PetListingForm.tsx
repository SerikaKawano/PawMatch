"use client";

import Image from "next/image";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Home, PawPrint, Stethoscope } from "lucide-react";
import type { Pet } from "@/lib/types";

const Field = ({ label, name, placeholder, type = "text", defaultValue }: { label: string; name: string; placeholder?: string; type?: string; defaultValue?: string }) => <label><span>{label}<b>必須</b></span><input name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} required /></label>;
const TextArea = ({ label, name, placeholder, defaultValue }: { label: string; name: string; placeholder?: string; defaultValue?: string }) => <label><span>{label}<b>必須</b></span><textarea name={name} placeholder={placeholder} defaultValue={defaultValue} required /></label>;

function inputBirthDate(pet?: Pet) {
  const match = pet?.birthDate.match(/^(\d{4})年(\d{1,2})月(?:(\d{1,2})日|頃)$/);
  return match ? `${match[1]}-${match[2].padStart(2, "0")}-${(match[3] ?? "1").padStart(2, "0")}` : "";
}

export function PetListingForm({ initialPet }: { initialPet?: Pet } = {}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState(initialPet?.imageUrl ?? "");
  const [imageName, setImageName] = useState(initialPet?.imageUrl ? "登録済みの画像" : "");
  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");
    if (!file) { setImageDataUrl(""); setImageName(""); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      event.target.value = ""; setImageDataUrl(""); setImageName(""); setError("JPEG・PNG・WebP形式の画像を選択してください。"); return;
    }
    if (file.size > 3 * 1024 * 1024) {
      event.target.value = ""; setImageDataUrl(""); setImageName(""); setError("画像は3MB以下にしてください。"); return;
    }
    const reader = new FileReader();
    reader.onload = () => { setImageDataUrl(String(reader.result)); setImageName(file.name); };
    reader.onerror = () => { setImageDataUrl(""); setImageName(""); setError("画像を読み込めませんでした。別の画像を選択してください。"); };
    reader.readAsDataURL(file);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const payload: Record<string, FormDataEntryValue | boolean> = Object.fromEntries(form.entries());
    delete payload.imageFile;
    payload.imageDataUrl = imageDataUrl;
    payload.birthDateApproximate = form.has("birthDateApproximate");
    try {
      const response = await fetch(initialPet ? `/api/pets/${encodeURIComponent(initialPet.id)}` : "/api/pets", { method: initialPet ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(initialPet ? { action: "update", input: payload } : payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "掲載内容を保存できませんでした。");
      router.push(`/pets/${result.pet.listingNumber}`); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "掲載内容を保存できませんでした。"); setBusy(false); }
  }
  return <form className="pet-listing-form" onSubmit={submit}>
    <section className="listing-form-section"><header><PawPrint /><div><span className="section-kicker">PET DETAILS</span><h2>基本情報</h2><p>公開ページの名前、種類、出生情報、募集地域を入力します。</p></div></header><div className="listing-form-grid two-columns">
      <Field label="名前" name="name" placeholder="例：Archie" defaultValue={initialPet?.name} /><label><span>種類<b>必須</b></span><select name="species" required defaultValue={initialPet?.species ?? "Dog"}><option value="Dog">犬</option><option value="Cat">猫</option></select></label>
      <Field label="犬種・猫種" name="breed" placeholder="例：コッカプー" defaultValue={initialPet?.breed} /><label><span>性別<b>必須</b></span><select name="sex" required defaultValue={initialPet?.sex ?? "Female"}><option value="Female">女の子</option><option value="Male">男の子</option></select></label>
      <Field label="出生年月日" name="birthDate" type="date" defaultValue={inputBirthDate(initialPet)} /><label className="listing-checkbox"><input type="checkbox" name="birthDateApproximate" defaultChecked={initialPet?.birthDateApproximate} /><span>出生年月日は推定</span></label>
      <Field label="募集地域" name="location" placeholder="例：London" defaultValue={initialPet?.location} /><Field label="性格の一言" name="temperament" placeholder="例：人と静かに過ごすのが好き" defaultValue={initialPet?.temperament.join("、")} /><TextArea label="血統書" name="pedigree" placeholder="有無と、犬種・猫種を判断した根拠を記載してください。" defaultValue={initialPet?.rehoming?.pedigree} />
    </div><div className="listing-photo-field"><div><span>ペットの写真<b>必須</b></span><p>JPEG・PNG・WebP形式、3MB以下の画像を1枚選択してください。</p><label className="listing-photo-picker"><input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" required={!imageDataUrl} onChange={chooseImage} /><span>{imageName || "画像を選択"}</span></label></div>{imageDataUrl && <div className="listing-photo-preview"><Image src={imageDataUrl} alt="選択したペット画像のプレビュー" width={360} height={280} unoptimized /><button type="button" onClick={() => { setImageDataUrl(""); setImageName(""); const input = document.querySelector<HTMLInputElement>('input[name="imageFile"]'); if (input) input.value = ""; }}>画像を削除</button></div>}</div></section>
    <section className="listing-form-section"><header><Home /><div><span className="section-kicker">LIVING TOGETHER</span><h2>暮らしのポイント</h2><p>里親希望者が生活を具体的に想像できる情報を入力します。</p></div></header><div className="listing-form-grid two-columns">
      <TextArea label="住環境" name="housing" placeholder="飼育可能な住居、室内・屋外、安全対策など" defaultValue={initialPet?.rehoming?.livingPoints?.housing} /><TextArea label="お世話の時間" name="time" placeholder="留守時間、給餌、散歩、投薬、代わりに世話をする人など" defaultValue={initialPet?.rehoming?.livingPoints?.time} /><TextArea label="必要なケアへの理解" name="care" placeholder="行動、しつけ、適応への配慮など" defaultValue={initialPet?.rehoming?.livingPoints?.care} /><TextArea label="医療・費用への備え" name="medical" placeholder="病歴、受診先、継続ケアと費用など" defaultValue={initialPet?.rehoming?.livingPoints?.medical} /><TextArea label="家族・先住動物との生活" name="integration" placeholder="同居者の同意、安全な導入計画など" defaultValue={initialPet?.rehoming?.livingPoints?.integration} /><TextArea label="継続飼育・緊急時対応" name="continuity" placeholder="終生飼養、生活変化、緊急時、譲渡後の連絡など" defaultValue={initialPet?.rehoming?.livingPoints?.continuity} />
    </div></section>
    <section className="listing-form-section"><header><Stethoscope /><div><span className="section-kicker">CARE &amp; HEALTH</span><h2>健康状態と必要なケア</h2><p>現在分かっている医療情報と、確認できる記録を入力します。</p></div></header><div className="listing-form-grid two-columns">
      <TextArea label="病歴・健康上の注意" name="medicalHistory" defaultValue={initialPet?.health?.medicalHistory} /><TextArea label="現在の投薬" name="medication" placeholder="投薬がない場合は「なし」と入力" defaultValue={initialPet?.health?.medication} /><TextArea label="ワクチン歴" name="vaccinations" placeholder="1行に1件、接種年月とワクチン名を記載" defaultValue={initialPet?.health?.vaccinations} /><TextArea label="記録・証明書" name="recordEvidence" placeholder="1行に1件、提出・確認できる書類を記載" defaultValue={initialPet?.health?.recordEvidence?.join("\n") ?? initialPet?.health?.medicalRecords.join("\n")} /><Field label="去勢・避妊" name="spayNeuter" placeholder="例：去勢済み（2024年5月）" defaultValue={initialPet?.health?.spayNeuter} /><Field label="マイクロチップ" name="microchip" placeholder="例：装着済み・番号確認済み" defaultValue={initialPet?.health?.microchip} /><label><span>記録の確認状況<b>必須</b></span><select name="evidenceStatus" required defaultValue={initialPet?.health?.evidenceStatus ?? "未確認"}><option>未確認</option><option>確認済</option></select></label>
    </div></section>
    <section className="listing-form-section"><header><HeartHandshake /><div><span className="section-kicker">BACKGROUND &amp; ADOPTION</span><h2>譲渡に至った経緯とお迎えの条件</h2><p>譲渡の背景と、譲渡者から希望者へ伝えたい条件を文章で入力します。</p></div></header><div className="listing-form-grid">
      <TextArea label="譲渡に出すことになった経緯" name="story" defaultValue={initialPet?.rehoming?.story ?? initialPet?.rehoming?.origin} /><TextArea label="譲渡者からのメッセージ" name="conditionsMessage" defaultValue={initialPet?.rehoming?.conditionsMessage ?? initialPet?.summary} /><TextArea label="トライアル期間" name="trial" defaultValue={initialPet?.rehoming?.trial} /><TextArea label="費用" name="fees" placeholder="費用がない場合も、その旨を記載してください。" defaultValue={initialPet?.rehoming?.fees} />
    </div></section>
    {error && <p className="listing-form-error" role="alert">{error}</p>}<div className="listing-form-actions"><button className="task-primary" type="submit" disabled={busy}>{busy ? "掲載内容を保存中…" : initialPet ? "変更を保存する" : "この内容で掲載する"}</button></div>
  </form>;
}
