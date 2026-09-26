"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight, CircleAlert, Scale, ShieldCheck } from "lucide-react";
import type { Applicant, Pet, ReviewStage } from "@/lib/types";
import { StatusPill } from "./StatusPill";
import { AssessmentPanel } from "./research/AssessmentPanel";

const verificationLabels = { identity: "本人確認", housing: "ペット可住宅", cohabitantConsent: "同居家族の同意", lifelongCare: "終生飼育の同意", followUp: "譲渡後の連絡" };
const stageLabels: Record<ReviewStage, string> = { screening: "初回確認", risk_review: "適合性の確認", verification: "書類確認", meeting: "面談・住環境確認", trial: "トライアル", final_review: "最終確認" };

export function ReviewWorkbench({ pets, initialApplicants, initialPetId }: { pets: Pet[]; initialApplicants: Applicant[]; initialPetId?: string }) {
  const firstPetWithApplicants = pets.find((pet) => initialApplicants.some((app) => app.petId === pet.id))?.id ?? pets[0]?.id;
  const validInitialPet = initialPetId && initialApplicants.some((app) => app.petId === initialPetId) ? initialPetId : firstPetWithApplicants;
  const [petId, setPetId] = useState(validInitialPet);
  const [records] = useState(initialApplicants);
  const candidates = useMemo(() => records.filter((app) => app.petId === petId).sort((a,b) => a.submittedAt.localeCompare(b.submittedAt)), [records, petId]);
  const [selectedId, setSelectedId] = useState(candidates[0]?.id ?? "");
  const selected = candidates.find((app) => app.id === selectedId) ?? candidates[0];
  const pet = pets.find((item) => item.id === petId);

  return <>
    <section className="review-toolbar">
      <label><span>確認する動物</span><select value={petId} onChange={(e) => setPetId(e.target.value)}>{pets.filter((p) => initialApplicants.some((a) => a.petId === p.id)).map((p) => <option value={p.id} key={p.id}>{p.name} · {p.careNeeds[0]}</option>)}</select></label>
    </section>
    <div className="human-banner"><Scale size={22} /><p><strong>この画面は判断を補助するものです。</strong> 次へ進める前に、プロフィールと未確認事項をご自身で確認してください。</p></div>
    <section className="review-layout">
      <div className="candidate-list" aria-label="確認する応募者を選択"><div className="panel-heading"><div><span className="eyebrow">{pet?.name}への申込み</span><h2>{candidates.length}名</h2></div><span className="sort-note">申込み順 · 点数順ではありません</span></div>{candidates.map((app, index) => {
        const high = app.risks.filter(r => r.severity === "high").length;
        const pending = Object.values(app.verification).filter(state => state !== "verified").length;
        return <button key={app.id} onClick={() => setSelectedId(app.id)} className={`candidate-row ${selected?.id === app.id ? "selected" : ""} ${high ? "has-risk" : pending ? "has-pending" : "is-ready"}`}><span className="candidate-rank">{String(index + 1).padStart(2,"0")}</span><span className="avatar">{app.name.split(" ").map(v => v[0]).join("")}</span><span className="candidate-copy"><strong>{app.name}</strong><small>{stageLabels[app.stage]}</small><span className={`risk-count ${high ? "negative" : pending ? "caution" : "positive"}`}>{high ? <><CircleAlert size={16} />重要な確認 {high}件</> : pending ? <><CircleAlert size={16} />確認待ち {pending}件</> : <><CheckCircle2 size={16} />重要な未確認なし</>}</span></span><ChevronRight size={20} /></button>;
      })}</div>
      {selected && <div className="review-detail">
        <div className="review-detail-top"><div><span className="eyebrow">申込み内容</span><h2>{selected.name}</h2><p>{selected.submittedAt} 受付 · {pet?.name}のケア条件に照らして確認</p></div><div className="score-ring" style={{"--score": `${selected.score * 3.6}deg`} as React.CSSProperties}><span><strong>{selected.score}</strong><small>計画の参考点</small></span></div></div>
        <div className="review-outcome-strip">{selected.risks.some(r => r.severity === "high") ? <strong className="negative"><CircleAlert />重要な確認が必要</strong> : Object.values(selected.verification).some(state => state !== "verified") ? <strong className="caution"><CircleAlert />確認待ちがあります</strong> : <strong className="positive"><CheckCircle2 />重要な未確認はありません</strong>}<span>この表示は合否ではありません。人が根拠と確認状態を見て判断します。</span></div>
        <div className="review-top-action"><Link href={`/reviews/${selected.id}`} className="task-primary">この申込みの確認・記録へ <ArrowRight size={21} /></Link></div>
        {selected.assessment && <AssessmentPanel assessment={selected.assessment} />}
        <div className="review-section"><h3>確認状態</h3><div className="verification-grid">{Object.entries(selected.verification).map(([key,value]) => <div key={key} className={`verification-item ${value}`}><span>{verificationLabels[key as keyof typeof verificationLabels]}</span><StatusPill state={value} /></div>)}</div></div>
        <div className="decision-box"><div><span><ShieldCheck size={19} /> 根拠と確認状態を記録してから進めます</span><Link href={`/reviews/${selected.id}`} className="primary-button">この申込みの確認・記録へ<ArrowRight size={20} /></Link></div></div>
      </div>}
    </section>
  </>;
}
