"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText, ShieldCheck, Upload } from "lucide-react";
import type { AdopterProfile, AdopterProfileFields } from "@/lib/adopter-profile";
import type { AdopterDocumentSummary } from "@/lib/adopter-documents";
import type { DocumentRequest } from "@/lib/document-requests";
import type { Consultation } from "@/lib/consultations";
import type { Applicant } from "@/lib/types";
import { stageLabels } from "@/lib/review-labels";
import { ConsultationHistory } from "./ConsultationHistory";

const profileFields: { key: keyof AdopterProfileFields; label: string; multiline?: boolean }[] = [
  { key: "fullName", label: "氏名" }, { key: "gender", label: "性別" }, { key: "ageRange", label: "年代" },
  { key: "employment", label: "仕事の状況" }, { key: "contact", label: "連絡先" }, { key: "region", label: "お住まいの地域" },
  { key: "household", label: "一緒に暮らす人", multiline: true }, { key: "householdConsent", label: "同居者の同意", multiline: true },
  { key: "allergies", label: "家族のアレルギー", multiline: true }, { key: "existingPets", label: "先住動物", multiline: true },
  { key: "housing", label: "住まいと飼育環境", multiline: true }, { key: "housingPermission", label: "住居の飼育許可", multiline: true },
  { key: "timeAway", label: "留守にする時間", multiline: true }, { key: "primaryCarer", label: "主なお世話の担当", multiline: true },
  { key: "careExperience", label: "飼育経験", multiline: true }, { key: "dailyCare", label: "日々のお世話", multiline: true },
  { key: "veterinaryPlan", label: "通院・健康管理の計画", multiline: true }, { key: "careBudget", label: "飼育費・医療費への備え", multiline: true },
  { key: "adoptionReason", label: "お迎えを希望する理由", multiline: true }, { key: "emergencyPlan", label: "緊急時の対応", multiline: true },
];
const basicProfileFields = profileFields.slice(0, 6);
const detailProfileFields = profileFields.slice(6);
const detailLimit = (key: keyof AdopterProfileFields) => ["careExperience", "dailyCare", "veterinaryPlan", "careBudget", "adoptionReason", "emergencyPlan"].includes(key) ? 500 : 300;

export function AdopterHome({ initialProfile, initialDocuments, initialRequests=[], consultations, applications, petNames }: { initialProfile: AdopterProfile; initialDocuments: AdopterDocumentSummary[]; initialRequests?: DocumentRequest[]; consultations: Consultation[]; applications: Applicant[]; petNames: Record<string, string> }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState<AdopterProfileFields>(Object.fromEntries(profileFields.map(field => [field.key, initialProfile[field.key]])) as AdopterProfileFields);
  const [editing, setEditing] = useState(false);
  const [documents, setDocuments] = useState(initialDocuments);
  const [requests, setRequests] = useState(initialRequests);
  const [selectedRequest,setSelectedRequest]=useState("");
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/adopter-profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setProfile(result.profile); setEditing(false); setNotice("プロフィールを更新しました。"); router.refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "保存できませんでした。"); }
    finally { setBusy(false); }
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!file) return;
    setBusy(true); setNotice("");
    try {
      const body = new FormData(); body.set("label", label); body.set("file", file); if(selectedRequest)body.set("requestId",selectedRequest);
      const response = await fetch("/api/adopter-documents", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDocuments(current => [result.document, ...current]); setLabel(""); setFile(null); setSelectedRequest("");
      const input = document.getElementById("adopter-document-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setNotice("書類を登録しました。");
    } catch (error) { setNotice(error instanceof Error ? error.message : "登録できませんでした。"); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (!window.confirm("この書類を削除しますか？削除後は元に戻せません。")) return;
    setBusy(true); setNotice("");
    try {
      const response = await fetch(`/api/adopter-documents/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDocuments(current => current.filter(item => item.id !== id)); setNotice("書類を削除しました。");
    } catch (error) { setNotice(error instanceof Error ? error.message : "削除できませんでした。"); }
    finally { setBusy(false); }
  }
  async function requestIdentity() {
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/adopter-profile/identity", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setProfile(result.profile); setNotice("本人確認を申請しました。担当者の確認待ちです。");
    } catch (error) { setNotice(error instanceof Error ? error.message : "申請できませんでした。"); }
    finally { setBusy(false); }
  }
  async function acknowledge(id:string){
    if(!window.confirm("依頼された内容を確認しましたか？確認したことを記録します。"))return;
    setBusy(true);setNotice("");
    try{const response=await fetch(`/api/adopter-document-requests/${id}`,{method:"PATCH"});const result=await response.json();if(!response.ok)throw new Error(result.error);setRequests(items=>items.map(item=>item.id===id?result.request:item));setNotice("確認したことを記録しました。");}
    catch(error){setNotice(error instanceof Error?error.message:"記録できませんでした。");}finally{setBusy(false);}
  }
  return <div className="dashboard-page adopter-home">
    <header className="adopter-home-header"><div><span className="section-kicker">マイページ</span><h1>{profile.fullName}</h1></div></header>
    <p className="adopter-home-status" role="status" aria-live="polite">{notice}</p>
    <div className="adopter-home-grid">
      <section className="adopter-profile-card"><div className="adopter-card-heading"><h2>自分のプロフィール</h2><button type="button" className="task-secondary" onClick={() => { setEditing(value => !value); setNotice(""); }}>{editing ? "表示に戻る" : "編集する"}</button></div>
        {editing ? <form className="adopter-profile-form" onSubmit={saveProfile}>
          <h3>基本プロフィール <small>すべて必須</small></h3>
          {basicProfileFields.map(field => <label key={field.key}>{field.label}<input required maxLength={field.key === "fullName" ? 80 : field.key === "contact" ? 254 : field.key === "employment" ? 200 : 50} value={draft[field.key]} onChange={event => setDraft({ ...draft, [field.key]: event.target.value })} /></label>)}
          <h3>詳細 <small>任意</small></h3>
          {detailProfileFields.map(field => <label key={field.key}>{field.label}<textarea maxLength={detailLimit(field.key)} value={draft[field.key]} onChange={event => setDraft({ ...draft, [field.key]: event.target.value })} /></label>)}
          <button className="task-primary" disabled={busy}>プロフィールを保存</button>
        </form> : <div className="adopter-profile-tables">
          <h3>基本プロフィール</h3>
          <table className="adopter-profile-table"><tbody>{basicProfileFields.map(field => <tr key={field.key}><th scope="row">{field.label}</th><td>{profile[field.key] || "未入力"}</td></tr>)}</tbody></table>
          <h3>詳細 <small>任意</small></h3>
          <table className="adopter-profile-table"><tbody>{detailProfileFields.map(field => <tr key={field.key}><th scope="row">{field.label}</th><td>{profile[field.key] || "未入力"}</td></tr>)}</tbody></table>
        </div>}
      </section>
      <div className="adopter-home-side"><section className="adopter-documents-card"><div className="adopter-card-heading"><h2><FileText size={23} />書類</h2><span>{`${documents.length}/5件`}</span></div><p>登録済み書類は管理者・審査担当者が閲覧できます。飼育計画などの一般書類のみ登録してください。本人確認書類、顔写真、住所や収入の分かる書類は登録しないでください。</p>{requests.length>0&&<div className="adopter-request-list"><h3>担当者からの依頼</h3>{requests.map(item=>{const submitted=documents.some(doc=>doc.requestId===item.id);return <article key={item.id}><strong>{item.petName}：{item.label}</strong><p>{item.detail}</p><span>{item.kind==="document"?submitted?"書類提出済み":"書類の提出待ち":item.acknowledgedAt?"確認済み":"内容の確認待ち"}</span>{item.kind==="document"&&!submitted&&<button type="button" className="task-secondary" onClick={()=>{setSelectedRequest(item.id);setLabel(item.label);document.getElementById("adopter-document-file")?.scrollIntoView({behavior:"smooth",block:"center"});}}>この依頼の書類を提出</button>}{item.kind==="consent"&&!item.acknowledgedAt&&<button type="button" className="task-secondary" disabled={busy} onClick={()=>acknowledge(item.id)}>内容を確認した</button>}</article>})}</div>}<form onSubmit={upload} className="adopter-upload-form">{selectedRequest&&<p className="selected-document-request">依頼への提出：{requests.find(item=>item.id===selectedRequest)?.label} <button type="button" onClick={()=>setSelectedRequest("")}>解除</button></p>}<label>書類名<input required maxLength={80} value={label} onChange={event => setLabel(event.target.value)} placeholder="例：お世話の計画" /></label><label>ファイル（PDF・PNG・JPEG、2MB以下）<input id="adopter-document-file" type="file" required accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={event => setFile(event.target.files?.[0] ?? null)} /></label><button type="submit" className="task-primary" disabled={busy || !file || documents.length >= 5}><Upload size={20} />書類を登録</button></form>{!documents.length ? <p className="adopter-empty">登録した書類はありません。</p> : <ul className="adopter-document-list">{documents.map(item => <li key={item.id}><div><strong>{item.label}</strong><a href={`/api/adopter-documents/${item.id}`}>{item.filename}</a><small>{Math.ceil(item.size / 1024)} KB · {new Date(item.uploadedAt).toLocaleDateString("ja-JP")}</small></div>{!item.id.startsWith("sample-") && <button type="button" className="decision-button outline" disabled={busy} onClick={() => remove(item.id)}>削除</button>}</li>)}</ul>}</section>
      <section className="adopter-identity-card"><div className="adopter-card-heading"><h2><ShieldCheck size={23} />本人確認</h2><span className={`identity-state ${profile.identityStatus}`}>{profile.identityStatus === "verified" ? "確認済み" : profile.identityStatus === "pending" ? "担当者の確認待ち" : "未申請"}</span></div><p>登録情報を確認後、担当者に本人確認を依頼できます。実物の確認は対面等で行い、ここには結果だけを記録します。</p>{profile.identityStatus === "not_requested" && <button type="button" className="task-secondary" disabled={busy} onClick={requestIdentity}>本人確認を申請する</button>}{profile.identityStatus === "verified" && <p className="adopter-verified">担当者が確認結果を記録しました。</p>}</section></div>
    </div>
    <ConsultationHistory records={consultations} names={petNames} applications={applications} title="相談、申込履歴" />
    <section className="adopter-application-history"><h2>審査の進捗</h2>{applications.length ? <ul>{applications.map(application => <li key={application.id}><strong>{petNames[application.petId] ?? application.petId}</strong><span className={`application-stage ${application.review?.decisionRecorded && application.review.decision === "decline" ? "stopped" : application.review?.decisionRecorded && application.review.decision === "approve" ? "done" : "active"}`}>{application.review?.decisionRecorded ? application.review.decision === "approve" ? "譲渡へ進める判断" : application.review.decision === "decline" ? "今回は見送り" : "追加確認中" : stageLabels[application.stage]}</span><small>{`申込日：${application.submittedAt}`}</small></li>)}</ul> : <p>審査中の申込みはありません。</p>}</section>
  </div>;
}
