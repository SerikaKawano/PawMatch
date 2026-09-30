import { AlertCircle, CheckCircle2, CircleHelp } from "lucide-react";
import type { Assessment } from "@/lib/research/types";
import { evidenceLabels } from "@/lib/research/scoring";

export function AssessmentPanel({ assessment }: { assessment: Assessment }) {
  const scoreTone = assessment.score === 100 ? "score-high" : assessment.score < 50 ? "score-low" : "score-mid";
  const highRiskIds = new Set(assessment.risks.filter(risk => risk.severity === "high").map(risk => risk.id));
  const highRiskCount = highRiskIds.size;
  return <section className="assessment-panel" id="assessment-important-items" aria-label="確認項目と要確認事項">
    <div className="assessment-heading"><h3>確認項目</h3><div className={`research-score ${scoreTone}`}><strong>{assessment.score}<small> / 100点</small></strong><span>確認済みの情報 {assessment.coverage}%</span></div></div>
    <p className="assessment-caution">点数だけで譲渡の可否は決めません。各項目の内容と要確認事項を確認してください。</p>
    <div className="assessment-evidence-grid">{[...assessment.breakdown].sort((a, b) => b.weight - a.weight).map(row => {
      const tone = row.weight > 0 && row.earned === row.weight ? "score-high" : row.weight > 0 && row.earned < row.weight / 2 ? "score-low" : "score-mid";
      const important = highRiskIds.has(row.criterion);
      return <article className={`evidence-card ${important ? "important" : tone}`} key={row.criterion}>
        <div className="evidence-card-top"><strong>{row.label}</strong><span className="evidence-score"><b>{row.earned}</b><span> / {row.weight}点</span></span></div>
        {important&&<span className="evidence-important-badge"><AlertCircle aria-hidden="true"/>重要な確認</span>}
        <span className="evidence-state">{row.state === "ready" ? <CheckCircle2 /> : row.state === "conflict" ? <AlertCircle /> : <CircleHelp />}{evidenceLabels[row.state]}</span>
        <p className="evidence-detail">{row.detail}</p>
      </article>;
    })}</div>
    <section className="assessment-checks"><h4><AlertCircle />要確認事項{highRiskCount>0&&<span className="assessment-important-count">重要な確認 {highRiskCount}件</span>}</h4>
      {assessment.risks.length ? <ul>{assessment.risks.map(risk => <li key={risk.id} className={risk.severity === "high" ? "high" : "medium"}>{risk.severity==="high"&&<span className="assessment-risk-badge"><AlertCircle aria-hidden="true"/>重要な確認</span>}<strong>{risk.label}</strong><p>{risk.detail}</p><span>確認すること：{risk.nextCheck}</span></li>)}</ul> : <p>現時点で記録された要確認事項はありません。面談などの確認は続けます。</p>}
    </section>
  </section>;
}
