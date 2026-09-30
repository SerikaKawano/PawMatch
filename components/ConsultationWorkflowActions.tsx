"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DemoRole } from "@/lib/demoUsers";

export function ConsultationWorkflowActions({ consultationId, applicationId, role }: { consultationId: string; applicationId?: string; role: DemoRole }) {
  const router = useRouter();
  const [createdId,setCreatedId]=useState(applicationId);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  async function startReview(){
    if(!window.confirm("提出されたプロファイルと書類を確認し、申込みを受け付けて審査を開始しますか？"))return;
    setBusy(true);setNotice("");
    try{
      const response=await fetch(`/api/consultations/${consultationId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"start_review"})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setCreatedId(result.application.id);setNotice("申込みを受け付け、審査ケースを作成しました。");router.refresh();
    }catch(error){setNotice(error instanceof Error?error.message:"審査を開始できませんでした。");}finally{setBusy(false);}
  }
  if(createdId)return <section className="consultation-workflow-action active"><div><h2>審査へ進んでいます</h2><p>提出された情報は審査ケースへ引き継がれています。</p></div><Link className="task-primary" href={`/reviews/${createdId}`}>審査ケースを開く →</Link></section>;
  if(role==="adopter")return <section className="consultation-workflow-action waiting"><div><h2>プロファイルと書類を提出してください</h2><p>プロファイルを確認し、飼育計画などの一般書類をアップロードすると、審査担当者が申込みを受け付けられます。</p></div><Link className="task-primary" href="/adopter/profile#adopter-documents">書類をアップロードする →</Link></section>;
  if(role==="reviewer"||role==="admin")return <section className="consultation-workflow-action waiting"><div><h2>事前情報の提出待ち</h2><p>里親希望者のプロファイルと登録済み書類を確認してから、審査を開始してください。</p></div><button type="button" className="task-primary" disabled={busy} onClick={startReview}>{busy?"処理中…":"申込みを受け付けて審査へ進める"}</button>{notice&&<p className="consultation-workflow-notice" role="status">{notice}</p>}</section>;
  return null;
}
