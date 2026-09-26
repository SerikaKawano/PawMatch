import { AlertCircle, CheckCircle2, CircleHelp } from "lucide-react";
import type { Assessment } from "@/lib/research/types";
import { evidenceLabels } from "@/lib/research/scoring";

export function AssessmentPanel({ assessment }: { assessment: Assessment }) {
  const serious = assessment.risks.filter(risk => risk.severity === "high");
  const followUp = assessment.risks.filter(risk => risk.severity !== "high");
  return <section className="assessment-panel" aria-label="ケア計画と確認事項">
    <div className="assessment-heading"><div><span className="eyebrow">ケア計画の確認</span><h3>何を確認できて、何が残っているか</h3></div><div className="research-score"><strong>{assessment.score}<small> / 100</small></strong><span>暫定点<br />情報充足率 {assessment.coverage}%</span></div></div>
    <p className="assessment-caution">点数は下の6項目の記録状況を示す参考値です。譲渡成功率や応募者の順位ではありません。重要な不一致・確認待ちは点数と別に見てください。</p>
    <div className="assessment-evidence-grid">{[...assessment.breakdown].sort((a, b) => b.weight - a.weight).map(row => <article className={`evidence-card ${row.state}`} key={row.criterion}>
      <div className="evidence-card-top"><strong>{row.label}</strong><span className="evidence-weight">重み {row.weight}点</span></div>
      <p className="evidence-score"><b>{row.earned}</b><span> / {row.weight}点</span></p>
      <span className="evidence-state">{row.state === "ready" ? <CheckCircle2 /> : row.state === "conflict" ? <AlertCircle /> : <CircleHelp />}{evidenceLabels[row.state]}</span>
      <p className="evidence-detail">{row.detail}</p>
    </article>)}</div>
    {assessment.risks.length ? <div className="assessment-risk-groups">
      {serious.length > 0 && <section className="risk-group negative"><h4><AlertCircle />重要な不一致・確認</h4><ul>{serious.map(risk => <li key={risk.id}><strong>{risk.label}</strong><p>{risk.detail}</p><span>確認すること：{risk.nextCheck}</span></li>)}</ul></section>}
      {followUp.length > 0 && <section className="risk-group caution"><h4><CircleHelp />確認待ち・追加相談</h4><ul>{followUp.map(risk => <li key={risk.id}><strong>{risk.label}</strong><p>{risk.detail}</p><span>確認すること：{risk.nextCheck}</span></li>)}</ul></section>}
    </div> : <p className="research-notice"><CheckCircle2 />この仮ルールでは未解決の確認事項はありません。面談は省略しません。</p>}
    <details className="research-breakdown"><summary>採点規則と研究上の限界</summary>
      <p>計画あり＝重みの100%、一部不足＝50%、情報不足・条件不一致＝0%。情報不足と条件不一致は別の状態として表示します。属性、年齢区分、職業、所得は採点しません。</p>
      <p>重みは管理者が変更できますが、現時点では研究用の仮設定であり、引用論文から推定した係数ではありません。採点規則：{assessment.ruleVersion}。</p>
      <p>参照：<a href="https://doi.org/10.1292/jvms.12-0569" target="_blank" rel="noreferrer">Onoderaら</a>、<a href="https://doi.org/10.2460/javma.233.11.1715" target="_blank" rel="noreferrer">Lordら</a>、<a href="https://doi.org/10.3389/fvets.2020.617525" target="_blank" rel="noreferrer">Griffinら</a>。いずれも配点の妥当性を証明するものではありません。</p>
    </details>
  </section>;
}
