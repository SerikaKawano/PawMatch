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
  ShieldCheck,
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
  const factorText = {
    housing: pet.rehoming?.requirements.find(requirement => /室内|住居|部屋|居場所/.test(requirement)) ?? pet.rehoming?.houseTraining ?? "この子を安全に飼える住環境を確認します。",
    time: pet.careNeeds[0] ?? "毎日のお世話の時間を確認します。",
    care: pet.rehoming?.requirements[0] ?? pet.summary,
    medical: pet.health?.medicalHistory ?? "病歴・健康上の注意を確認します。",
    integration: pet.rehoming?.compatibility ?? "家族や先住動物との生活を確認します。",
    continuity: "不在時・緊急時にもお世話を続けられる計画を確認します。",
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
              <div className="detail-label-row"><span className="listing-status">里親募集中</span><span>掲載番号 PM-{pet.id.toUpperCase()}-26</span></div>
              <div className="detail-title"><h1>{pet.name}</h1></div>
              <p className="detail-meta">{pet.breed} ・ {pet.age} ・ {sex}</p>
              <p className="location"><MapPin size={20} />{pet.location}</p>
              <div className="pet-primary-actions">{canConsult && <Link href={`/pets/${pet.id}/consult`} className="task-primary">{pet.name}について相談する <MessageCircle size={22} /></Link>}{canReview && <Link href={`/reviews?pet=${pet.id}`} className="task-secondary">担当者向け：この子への申込みを確認</Link>}{!canConsult && !canReview && <Link href="/rehoming" className="task-secondary">自分の掲載ペットへ戻る</Link>}</div>
              <div className="tag-row">{pet.temperament.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
              <div className="profile-facts">
                <div><PawPrint /><span>種類</span><strong>{species}</strong></div>
                <div><CalendarDays /><span>年齢</span><strong>{pet.age}</strong></div>
                <div><Home /><span>募集地域</span><strong>{pet.location.split(" ")[0]}</strong></div>
              </div>
              <PetShareActions petId={pet.id} petName={pet.name} />
            </div>
          </section>

          <section className="detail-section pet-factors"><span className="section-kicker">PET PROFILE</span><h2>暮らしとケアのポイント</h2><p>ペットのプロファイルを里親希望者のプロファイルと照らし合わせて確認・審査を行います。</p><div className="pet-factor-grid">{factors.map((key, index) => <article key={key}><div><span>{String(index + 1).padStart(2, "0")}</span><strong>{criterionLabels[key]}</strong>{config && <b>重み {config.weights[key]}点</b>}</div><p>{factorText[key]}</p></article>)}</div></section>

          <section className="detail-section">
            <span className="section-kicker">CARE &amp; HEALTH</span><h2>健康状態と必要なケア</h2>
            <div className="care-overview">
              <div className="health-card"><Stethoscope size={28} /><div><strong>記録・証明書の確認状況</strong><span className={`health-status ${pet.health?.evidenceStatus === "確認済" ? "verified" : "pending"}`}>{pet.health?.evidenceStatus ?? "未確認"}</span></div></div>
              <ul className="care-list">{pet.careNeeds.map((need) => <li key={need}><ShieldCheck size={23} />{need}</li>)}</ul>
            </div>
            <h3 className="detail-subheading">病歴・医療情報</h3>
            <dl className="pet-data-grid">
              <div><dt>病歴・健康上の注意</dt><dd>{pet.health?.medicalHistory ?? "確認中"}</dd></div>
              <div><dt>現在の投薬</dt><dd>{pet.health?.medication ?? "確認中"}</dd></div>
              <div><dt>ワクチン歴</dt><dd>{pet.health?.vaccinations ?? "接種記録を確認中"}</dd></div>
              <div><dt>去勢・避妊</dt><dd>{pet.health?.spayNeuter ?? "確認中"}</dd></div>
              <div><dt>マイクロチップ</dt><dd>{pet.health?.microchip ?? "確認中"}</dd></div>
            </dl>
            <h3 className="detail-subheading">診療・検査記録</h3>
            <ul className="detail-evidence-list">{(pet.health?.medicalRecords?.length ? pet.health.medicalRecords : ["記録は未提出です"]).map((record) => <li key={record}>{record}</li>)}</ul>
          </section>

          <section className="detail-section">
            <span className="section-kicker">BACKGROUND &amp; ADOPTION</span><h2>これまでの経緯とお迎えの条件</h2>
            <dl className="pet-data-grid">
              <div><dt>これまでの飼育・保護経緯</dt><dd>{pet.rehoming?.origin ?? "確認中"}</dd></div>
              <div><dt>血統・血統書</dt><dd>{pet.rehoming?.pedigree ?? "確認中"}</dd></div>
              <div><dt>トイレ・室内での暮らし</dt><dd>{pet.rehoming?.houseTraining ?? "確認中"}</dd></div>
              <div><dt>子ども・先住動物との相性</dt><dd>{pet.rehoming?.compatibility ?? "個別に確認"}</dd></div>
              <div><dt>トライアル</dt><dd>{pet.rehoming?.trial ?? "相談時に確認"}</dd></div>
              <div><dt>譲渡に伴う費用</dt><dd>{pet.rehoming?.fees ?? "内訳と事前合意を確認"}</dd></div>
            </dl>
            <h3 className="detail-subheading">お迎え前に確認する条件</h3>
            <ul className="detail-evidence-list">{(pet.rehoming?.requirements?.length ? pet.rehoming.requirements : pet.careNeeds).map((item) => <li key={item}>{item}</li>)}</ul>
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
