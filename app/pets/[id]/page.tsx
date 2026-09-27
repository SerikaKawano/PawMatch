import { canAccess } from "@/lib/permissions";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  Home,
  MapPin,
  MessageCircle,
  PawPrint,
  Stethoscope,
  UserRoundCheck,
} from "lucide-react";
import { PetShareActions } from "@/components/PetShareActions";
import { currentDemoUser } from "@/lib/demo-session-server";
import { getPets } from "@/lib/repository";
import { getResearch } from "@/lib/research/store";
import { criteria } from "@/lib/research/types";
import { criterionLabels } from "@/lib/research/scoring";
import { demoUsers } from "@/lib/demoUsers";
import { mayReviewPet } from "@/lib/ownership";
import { uiCopy } from "@/lib/ui-copy";

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pet = (await getPets()).find((item) => item.id === id);
  if (!pet) notFound();

  const user = await currentDemoUser();
  const canReview = Boolean(user && mayReviewPet(user, pet));
  const canConsult = !user || canAccess(user, "consult");
  const owner = demoUsers.find(account => account.id === pet.ownerId);
  const species = pet.species === "Dog" ? "犬" : "猫";
  const sex = pet.sex === "Female" ? "女の子" : "男の子";
  const isAdmin = user?.role === "admin";
  const config = isAdmin ? (await getResearch()).config : null;
  const ageLabel = pet.birthDateApproximate ? `約${pet.age}` : pet.age;
  const factorText = {
    housing: pet.rehoming?.livingPoints?.housing ?? "飼育可能な住居と安全な生活空間を確認します。",
    time: pet.rehoming?.livingPoints?.time ?? "毎日の世話と不在時の体制を確認します。",
    care: pet.rehoming?.livingPoints?.care ?? "行動と適応に必要な理解を確認します。",
    medical: pet.rehoming?.livingPoints?.medical ?? "病歴・受診・費用への備えを確認します。",
    integration: pet.rehoming?.livingPoints?.integration ?? "同居者・先住動物との導入計画を確認します。",
    continuity: pet.rehoming?.livingPoints?.continuity ?? "終生飼養と緊急時の体制を確認します。",
  };
  const factors = config ? [...criteria].sort((a, b) => config.weights[b] - config.weights[a]) : [...criteria];

  return (
    <div className="page-wrap public-pet-detail">
      <div className="pet-detail-layout">
        <div className="pet-detail-main">
          <section className="pet-profile-hero">
            <div className="pet-gallery">
              <div className={`detail-art ${pet.accent} ${pet.imageUrl ? "has-photo" : ""}`} style={pet.imageUrl ? { backgroundImage: `url(${pet.imageUrl})` } : undefined}>
                <span>{pet.emoji}</span>{pet.urgent && <b className="urgent-ribbon">優先して募集中</b>}
              </div>
            </div>
            <div className="pet-profile-copy">
              <div className="detail-label-row"><span className="listing-status">里親募集中</span><span>掲載番号 {pet.listingNumber}</span></div>
              <div className="detail-title"><h1>{pet.name}</h1></div>
              <p className="detail-meta">{pet.breed} ・ {ageLabel} ・ {sex}</p>
              <p className="location"><MapPin size={20} />{pet.location}</p>
              <div className="pet-primary-actions">{canConsult && <Link href={`/pets/${pet.id}/consult`} className="task-primary">{uiCopy.contactPet(pet.name)} <MessageCircle size={22} /></Link>}{canReview && <Link href={`/reviews?pet=${pet.id}`} className="task-secondary">担当者向け：この子への申込みを確認</Link>}{!canConsult && !canReview && <Link href="/rehoming" className="task-secondary">自分の掲載ペットへ戻る</Link>}</div>
              <div className="tag-row">{pet.temperament.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
              <div className="profile-facts">
                <div><PawPrint /><span>種類</span><strong>{species}</strong></div>
                <div><CalendarDays /><span>出生年月日</span><strong>{pet.birthDate}（{ageLabel}）</strong></div>
                <div><Home /><span>募集地域</span><strong>{pet.location.split(" ")[0]}</strong></div>
                <div><PawPrint /><span>血統書</span><strong>{pet.rehoming?.pedigree ?? "未確認"}</strong></div>
              </div>
              <PetShareActions petId={pet.id} petName={pet.name} />
            </div>
          </section>

          <section className="detail-section pet-factors"><span className="section-kicker">LIVING TOGETHER</span><h2>暮らしのポイント</h2><p>ペットのプロファイルを里親希望者のプロファイルと照らし合わせて確認・審査を行います。</p><div className="pet-factor-grid">{factors.map((key, index) => <article key={key}><div><span>{String(index + 1).padStart(2, "0")}</span><strong>{criterionLabels[key]}</strong>{config && <b>重み {config.weights[key]}点</b>}</div><p>{factorText[key]}</p></article>)}</div></section>

          <section className="detail-section">
            <span className="section-kicker">CARE &amp; HEALTH</span><h2>健康状態と必要なケア</h2>
            <div className="health-card"><Stethoscope size={28} /><div><strong>記録・証明書の確認状況</strong><span className={`health-status ${pet.health?.evidenceStatus === "確認済" ? "verified" : "pending"}`}>{pet.health?.evidenceStatus ?? "未確認"}</span><ul className="detail-evidence-list">{pet.health?.recordEvidence?.map((record) => <li key={record}>{record}</li>)}</ul></div></div>
            <h3 className="detail-subheading">病歴・医療情報</h3>
            <dl className="pet-data-grid">
              <div><dt>病歴・健康上の注意</dt><dd>{pet.health?.medicalHistory ?? "確認中"}</dd></div>
              <div><dt>現在の投薬</dt><dd>{pet.health?.medication ?? "確認中"}</dd></div>
              <div className="pet-data-wide"><dt>ワクチン歴</dt><dd><ul className="detail-evidence-list">{pet.health?.vaccinationHistory?.map((entry) => <li key={entry}>{entry}</li>)}</ul></dd></div>
              <div><dt>去勢・避妊</dt><dd>{pet.health?.spayNeuter ?? "確認中"}</dd></div>
              <div><dt>マイクロチップ</dt><dd>{pet.health?.microchip ?? "確認中"}</dd></div>
            </dl>
            <h3 className="detail-subheading">診療・検査記録</h3>
            <ul className="detail-evidence-list">{(pet.health?.medicalRecords?.length ? pet.health.medicalRecords : ["記録は未提出です"]).map((record) => <li key={record}>{record}</li>)}</ul>
          </section>

          <section className="detail-section">
            <span className="section-kicker">BACKGROUND &amp; ADOPTION</span><h2>譲渡に至った経緯とお迎えの条件</h2>
            <h3 className="detail-subheading">譲渡に出すことになった経緯</h3>
            <p className="rehomer-message">{pet.rehoming?.story ?? pet.rehoming?.origin}</p>
            <h3 className="detail-subheading">譲渡者からのメッセージ</h3>
            <p className="rehomer-message">{pet.rehoming?.conditionsMessage}</p>
            <h3 className="detail-subheading">その他</h3>
            <p className="rehomer-message">{pet.rehoming?.trial} {pet.rehoming?.fees}</p>
          </section>

          <section className="detail-section provider-section">
            <div className="provider-heading"><span className="provider-logo"><PawPrint size={30} /></span><div><span className="section-kicker">REHOMER</span><h2>譲渡者について</h2></div></div>
            <div className="provider-card"><div><strong>{owner?.organization ?? "譲渡元情報確認中"}</strong><p>{owner?.kind === "organization" ? "複数地域の協力拠点で保護・譲渡活動を行う団体です。" : `${pet.location}で${pet.name}の新しい家族を探す個人譲渡者です。`}</p>{(owner?.websiteUrl || owner?.socialUrl) && <div className="provider-links">{owner.websiteUrl && <a href={owner.websiteUrl} target="_blank" rel="noopener noreferrer">Webサイト <ExternalLink size={18} /></a>}{owner.socialUrl && <a href={owner.socialUrl} target="_blank" rel="noopener noreferrer">SNS <ExternalLink size={18} /></a>}</div>}</div><div className="provider-verification"><UserRoundCheck size={23} /><span><strong>本人確認済み</strong>登録情報確認済み</span></div></div>
          </section>

        </div>

      </div>
    </div>
  );
}
