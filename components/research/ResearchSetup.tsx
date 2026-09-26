"use client";

import { useState } from "react";
import type { Scenario, StudyConfig } from "@/lib/research/types";
import { criteria } from "@/lib/research/types";
import { criterionLabels } from "@/lib/research/scoring";

export function ResearchSetup({ initialConfig, scenarios }: { initialConfig: StudyConfig; scenarios: Scenario[] }) {
  const [config, setConfig] = useState(initialConfig);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const total = criteria.reduce((sum, key) => sum + config.weights[key], 0);
  function update(patch: Partial<StudyConfig>) { setConfig(current => ({ ...current, ...patch })); setDirty(true); setMessage(""); }
  async function save() {
    setBusy(true); setMessage("");
    try {
      const { version: _version, ...body } = config; void _version;
      const response = await fetch("/api/research/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setConfig(data); setDirty(false); setMessage("保存しました。通常の審査画面に新しい重みが反映されます。保存済みの人の判断は変更されません。");
    } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }
  return <>
    <section className="research-card"><h2>暫定点の重みを設定する</h2><p>ペット詳細と応募者審査は同じ6項目を、重みの大きい順に表示します。合計は100点にしてください。この配点は検証前の研究用仮設定で、応募者の合否や譲渡成功率を示しません。</p>
      <div className="research-weight-grid">{criteria.map(key => <label key={key}>{criterionLabels[key]}<input type="number" min="0" max="100" step="1" value={config.weights[key]} onChange={event => update({ weights: { ...config.weights, [key]: Number(event.target.value) } })} /></label>)}</div>
      <p className={total === 100 ? "weight-total valid" : "weight-total invalid"}>現在の合計：<strong>{total} / 100点</strong>{total !== 100 && " — 合計を100点にしてください"}</p>
      <label className="research-field">設定・変更の理由<textarea value={config.researcherNotes} onChange={event => update({ researcherNotes: event.target.value })} maxLength={3000} placeholder="配点を変えた理由と、確認したい影響を記録してください。" /></label>
      <button className="primary-button" disabled={busy || !dirty || total !== 100} onClick={save}>{busy ? "保存中…" : "重みを保存"}</button><span className="research-inline-note">設定 v{config.version}{dirty ? " · 未保存" : ""}</span><p role="status">{message}</p>
    </section>
    <section className="research-card"><h2>架空ケースの確認</h2><p>テスターに提示するケースは、住居の確認待ちや動物固有の医療・ケア条件など、異なる判断の難しさを含めます。これは想定された確認点であり、唯一の正解ではありません。</p>
      {scenarios.map(scenario => <details className="research-scenario" key={scenario.id}><summary>{scenario.petName} · {scenario.title}</summary><p>{scenario.animalNeeds}</p><ul>{scenario.rubric.expectedRisks.map(risk => <li key={risk.id}>{risk.label} — {risk.rationale}</li>)}</ul></details>)}
    </section>
  </>;
}
