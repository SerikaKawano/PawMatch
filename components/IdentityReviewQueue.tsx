"use client";
import { useState } from "react";
import type { AdopterProfile } from "@/lib/adopter-profile";

export function IdentityReviewQueue({ initialProfiles }: { initialProfiles: AdopterProfile[] }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  async function verify(profile: AdopterProfile) {
    if (!window.confirm(`${profile.fullName}さんの登録名と本人を対面等で確認済みですか？\n確認していない場合は保存しないでください。`)) return;
    setBusy(profile.userId); setNotice("");
    try {
      const response = await fetch(`/api/adopter-profile/identity/${profile.userId}`, { method: "PATCH" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setProfiles(current => current.filter(item => item.userId !== profile.userId));
      setNotice(`${profile.fullName}さんの確認結果を記録しました。`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "保存できませんでした。"); }
    finally { setBusy(null); }
  }
  return <section className="identity-review-queue"><h2>本人確認の申請</h2><p>実物の本人確認は対面等で行い、ここには結果だけを記録します。申請だけで確認済みにはなりません。</p>
    <p role="status" aria-live="polite">{notice}</p>
    {!profiles.length ? <p className="consultation-empty">確認待ちの申請はありません。</p> : profiles.map(profile => <article key={profile.userId}><div><strong>{profile.fullName}</strong><span>{profile.region}</span><small>申請日：{profile.identityRequestedAt ? new Date(profile.identityRequestedAt).toLocaleDateString("ja-JP") : "確認待ち"}</small></div><button type="button" className="decision-button" disabled={busy !== null} onClick={() => verify(profile)}>本人確認済みとして記録</button></article>)}
  </section>;
}
