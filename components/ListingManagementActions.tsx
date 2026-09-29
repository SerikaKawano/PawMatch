"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ListingManagementActions({ petId, canManage }: { petId: string; canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function stopListing() {
    if (!window.confirm("このペットの掲載を停止しますか？掲載一覧と検索結果から非表示になります。")) return;
    setBusy(true); setError("");
    const response = await fetch(`/api/pets/${encodeURIComponent(petId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "stop" }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setError(result.error ?? "掲載を停止できませんでした。"); setBusy(false); return; }
    router.refresh();
  }
  return <div className="listing-management-actions">
    {canManage ? <Link href={`/rehoming/${encodeURIComponent(petId)}/edit`}>編集</Link> : <button type="button" disabled>編集</button>}
    <button className="stop-listing" type="button" disabled={!canManage || busy} onClick={stopListing}>{busy ? "掲載停止中…" : "掲載停止"}</button>
    {!canManage && <p className="listing-management-note">進行中の審査があるため、編集・掲載停止はできません。</p>}
    {error && <p className="listing-management-note" role="alert">{error}</p>}
  </div>;
}
