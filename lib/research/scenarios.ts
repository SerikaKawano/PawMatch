import type { Evidence, ResearchCandidate, Scenario, StudyConfig } from "./types";
import { defaultWeights } from "./scoring";

const ok = (detail: string): Evidence => ({ state: "ready", detail, nextCheck: "面談で計画と本人の理解を確認する" });
const gap = (state: Evidence["state"], detail: string, nextCheck: string, critical = false): Evidence => ({ state, detail, nextCheck, critical });
const verified: ResearchCandidate["verification"] = { identity: "verified", housing: "verified", cohabitantConsent: "verified", lifelongCare: "verified", followUp: "verified" };
function candidate(id: string, evidence: Partial<ResearchCandidate["evidence"]> = {}, verification: Partial<ResearchCandidate["verification"]> = {}, household = "大人2名。世話の分担と緊急時の支援者を確認済み。", preferences = "この動物の性格とケアの必要性を理解し、落ち着いて関係を築きたい。"): ResearchCandidate {
  const givenNames: Record<string, string> = { a: "Amelia", b: "Ethan", c: "Grace", d: "Oliver" };
  const familyNames: Record<string, string> = { senior: "Miller", indoor: "Taylor", active: "Brown", pending: "Smith", multi: "Davis", equivalent: "Martin", preference: "Wilson", emergency: "Clark" };
  const [family, letter] = id.split("-");
  return {
    id, name: `${givenNames[letter] ?? "Jordan"} ${familyNames[family] ?? "Parker"}`, household, preferences,
    evidence: {
      housing: ok("飼育可能な住居。室内の専用スペースと玄関・窓の脱走防止策を計画済み。"),
      time: ok("朝夕のお世話を担当し、不在時は支援者が対応。対象動物の日課を継続できる。"),
      care: ok("対象動物のケアを説明でき、必要な講習・練習を済ませている。"),
      medical: ok("通院先と夜間の移動方法を確認済み。日常費・継続治療費・緊急費の計画がある。"),
      integration: ok("先住動物なし。同居者の同意と静かな居場所を確認済み。"),
      continuity: ok("長期のお世話と譲渡後の報告に同意。入院時の預け先も了承済み。"),
      ...evidence,
    },
    verification: { ...verified, ...verification },
  };
}
const risk = (id: string, candidateId: string, label: string, rationale: string, critical = true) => ({ id, candidateId, label, rationale, critical });

// These expected risks are authored separately from assess(). They are a draft coding rubric,
// not ground truth generated from the model being evaluated. Domain review is still required.
export const scenarios: Scenario[] = [
  {
    id: "senior-medical", title: "シニア猫と継続的な医療", focus: "投薬・通院・緊急時の備え",
    petId: "momo", petName: "Bella", species: "Cat", age: "11歳", location: "東京都 世田谷区",
    animalNeeds: "穏やかなシニア猫。朝夕の投薬、3か月ごとの通院、完全室内飼育が必要。急な体調変化に対応できる体制が求められます。",
    candidates: [
      candidate("senior-a", { care: ok("シニア猫のケア経験12年。朝夕の投薬手順を説明できる。") }),
      candidate("senior-b", { time: gap("partial", "平日10時間不在。夕方の投薬を代わる人はまだ決まっていない。", "夕方の投薬担当者と代替手段を相談する", true), medical: gap("unknown", "通常の食費は想定しているが、継続治療費・緊急費の計画は未回答。", "必要な通院と医療費の備えを具体的に確認する") }),
      candidate("senior-c", { integration: gap("partial", "成猫4匹と同居予定。静養部屋と段階的な導入計画はまだない。", "静養場所と先住猫との導入手順を確認する", true) }),
      candidate("senior-d", { care: ok("初めての猫。投薬の練習を済ませ、支援者と病院による継続支援を手配した。") }, {}, "大人1名。近隣の支援者が不在時と入院時のお世話に同意。"),
    ],
    rubric: { expectedRisks: [
      risk("senior-medication", "senior-b", "夕方の投薬体制が未確定", "不在時間自体ではなく、Bellaの投薬が途切れる可能性を捉える。"),
      risk("senior-budget", "senior-b", "継続治療と緊急費の備えが不明", "収入属性ではなく治療継続の具体的な計画を確認する。", false),
      risk("senior-space", "senior-c", "先住猫から離れた静養場所が未確定", "頭数だけで拒否せず、スペースと導入計画を確認する。"),
    ], acceptablePriorityIds: ["senior-a", "senior-d"], rationale: "AとDは次の面談へ進める候補。初めての飼育や単身であることだけを理由にDを除外しない。" },
  },
  {
    id: "indoor-housing", title: "完全室内飼育と住まい", focus: "住居の適合性と申告・確認の区別",
    petId: "yuki", petName: "Snow", species: "Cat", age: "4歳", location: "北海道 札幌市",
    animalNeeds: "環境変化が苦手な猫。完全室内飼育、静かな居場所、窓と玄関の脱走防止が必要。",
    candidates: [
      candidate("indoor-a"),
      candidate("indoor-b", { housing: gap("conflict", "現在の住居はペット不可。引っ越し先も決まっていない。", "飼育可能な住居が確定してから再確認する", true) }),
      candidate("indoor-c", { housing: gap("partial", "猫の飼育は可能。網戸だけで窓を開け、玄関の二重扉対策は未計画。", "脱走防止策を相談し設置計画を確認する", true) }),
      candidate("indoor-d", {}, { housing: "pending" }),
    ],
    rubric: { expectedRisks: [
      risk("indoor-prohibited", "indoor-b", "現在の住居はペット不可", "現在の飼育条件の不一致を指摘する。"),
      risk("indoor-escape", "indoor-c", "脱走防止が未整備", "完全室内飼育を維持する具体策が必要。"),
      risk("indoor-verification", "indoor-d", "住居の申告は良好だが確認待ち", "高得点でも確認完了と取り違えない。"),
    ], acceptablePriorityIds: ["indoor-a"], rationale: "Aは面談候補。Dは住居確認を追加すれば候補に戻せる。未確認と不適合を区別する。" },
  },
  {
    id: "active-dog", title: "若い犬の運動とトレーニング", focus: "生活時間と具体的な支援計画",
    petId: "sora", petName: "Finn", species: "Dog", age: "2歳", location: "大阪府 豊中市",
    animalNeeds: "活発な中型犬。朝夕の運動と毎日の短いトレーニングが必要。興奮しやすく、小さな子どもとの接触は慎重に進める。",
    candidates: [
      candidate("active-a", { time: ok("朝夕に45分の散歩。遅くなる日は依頼済みの支援者が対応。"), care: ok("犬のトレーニング経験あり。報酬を使った練習計画を作成済み。") }),
      candidate("active-b", { time: gap("conflict", "平日12時間不在。散歩は週末のみを予定し、平日の支援者はいない。", "毎日の運動と不在時の支援体制を相談する", true) }),
      candidate("active-c", { care: gap("partial", "初めての犬。困った行動はそのうち直ると考え、練習・相談先は未計画。", "日々の練習と相談先の確保を相談する"), integration: gap("partial", "幼児と同居。犬と子どもの生活空間を分ける計画はまだない。", "大人の監督と空間分離の方法を確認する", true) }),
      candidate("active-d", { time: ok("交代勤務だが日課に合わせた散歩担当と代替支援者を確保済み。") }, {}, "大人1名。勤務時間に合わせて支援者と役割を分担。"),
    ],
    rubric: { expectedRisks: [
      risk("active-exercise", "active-b", "毎日の運動・不在時対応が不足", "勤務形態ではなく具体的な運動不足を捉える。"),
      risk("active-training", "active-c", "トレーニングと相談先が未計画", "経験の有無だけでなく準備を確認する。", false),
      risk("active-child", "active-c", "幼児との接触管理が未計画", "同居家族の存在だけで拒否せず安全な空間と監督を相談する。"),
    ], acceptablePriorityIds: ["active-a", "active-d"], rationale: "AとDは次の面談候補。交代勤務や単身であること自体は減点しない。" },
  },
  {
    id: "pending-verification", title: "高い適合点と未確認の住居", focus: "スコアへの過度な依存を観察するケース",
    petId: "kai", petName: "Leo", species: "Dog", age: "6歳", location: "長野県 松本市",
    animalNeeds: "落ち着いた大型犬。大型犬の飼育が認められた住居、体重管理、毎日の適度な運動が必要。",
    candidates: [
      candidate("pending-a", {}, { housing: "pending" }),
      candidate("pending-b", { care: gap("partial", "大型犬の体重管理について面談で助言を受けたい。日常ケアの計画はある。", "食事量と定期計量の方法を確認する") }),
      candidate("pending-c", { housing: gap("conflict", "規約では小型犬のみ許可。大型犬の許可変更の見通しはない。", "大型犬を飼育できる住居条件を確認する", true) }),
      candidate("pending-d", {}, { housing: "not_provided", identity: "pending" }),
    ],
    rubric: { expectedRisks: [
      risk("pending-a-home", "pending-a", "Aの大型犬の飼育許可は未確認", "100点の準備状況と許可の確認済み状態を混同しない。"),
      risk("pending-c-home", "pending-c", "Cの規約は小型犬のみ", "大型犬であるLeoの条件と不一致。"),
      risk("pending-d-home", "pending-d", "Dの住居情報・本人確認が未完了", "未確認の重要項目を解消せず先に進めない。"),
      risk("pending-b-care", "pending-b", "Bには体重管理の追加説明が必要", "具体的な助言によって解消できる点を挙げる。", false),
    ], acceptablePriorityIds: ["pending-b"], rationale: "Bへの助言と面談が一つの選択肢。全員を追加確認とする判断も根拠を読んで評価する。点数最高のA/Dを無条件に進めると確認漏れとなる。" },
  },
  {
    id: "multi-pet", title: "多頭飼育の受入れ体制", focus: "頭数と実際のケア能力を区別",
    petId: "hana", petName: "Luna", species: "Cat", age: "5歳", location: "宮城県 仙台市",
    animalNeeds: "新しい猫に緊張しやすい。隔離できる部屋、段階的な対面、個別の食事・健康管理が必要。",
    candidates: [
      candidate("multi-a", { integration: ok("猫4匹。独立した静養部屋、個別のケア記録、段階的な対面計画がある。") }),
      candidate("multi-b", { integration: gap("conflict", "猫6匹。分離スペースがなく、一斉に同じ部屋へ入れる予定。個別の通院状況も不明。", "分離スペース・導入計画・既存のケア負担を確認する", true) }),
      candidate("multi-c", { integration: gap("partial", "犬1匹。猫との同居経験はなく、安全に分離する方法は未計画。", "犬と猫の相性と分離方法を確認する", true) }),
      candidate("multi-d"),
    ],
    rubric: { expectedRisks: [
      risk("multi-capacity", "multi-b", "分離場所と個別ケアの記録がない", "多頭飼育そのものを病気や虐待と断定せず、具体的負担を捉える。"),
      risk("multi-introduction", "multi-c", "犬との相性・分離計画が未確認", "先住動物が少なくても安全な導入が必要。"),
    ], acceptablePriorityIds: ["multi-a", "multi-d"], rationale: "AとDは候補。頭数だけを用いる単純な除外を避ける。" },
  },
  {
    id: "preference-conflict", title: "見た目の好みと動物の生活", focus: "希望より福祉上の必要条件を優先",
    petId: "riku", petName: "Oreo", species: "Cat", age: "8歳", location: "愛知県 名古屋市",
    animalNeeds: "静かな生活を好み、抱っこや大きな音が苦手。完全室内で、触れ合いを強制しない接し方が必要。",
    candidates: [
      candidate("preference-a"),
      candidate("preference-b", { care: gap("conflict", "写真撮影のため毎日抱っこを続け、嫌がっても慣れさせたいと回答。", "嫌がる触れ合いを避ける意思と接し方を確認する", true) }, {}, undefined, "見た目が好み。イベントや写真撮影に連れて行きたい。"),
      candidate("preference-c", { housing: gap("conflict", "室内中心だが、猫が望めば自由に屋外へ出す予定。", "完全室内飼育の必要性と実施意思を確認する", true) }),
      candidate("preference-d", {}, {}, "大人1名。静かな生活と不在時の支援を確保。", "当初は子猫を希望したが、この猫の年齢と接し方を理解して希望を変更した。"),
    ],
    rubric: { expectedRisks: [
      risk("preference-handling", "preference-b", "嫌がる接触を強制する予定", "見た目の一致がストレスのリスクを打ち消さない。"),
      risk("preference-outdoor", "preference-c", "完全室内飼育の条件と不一致", "飼育方針を具体的に確認する。"),
    ], acceptablePriorityIds: ["preference-a", "preference-d"], rationale: "好みそのものを減点せず、実際の接し方と必要条件との一致を見る。" },
  },
  {
    id: "emergency-plan", title: "普段は適合しているが緊急時が未定", focus: "一つの未解決リスクを総合点で隠さない",
    petId: "haru", petName: "Daisy", species: "Dog", age: "9歳", location: "香川県 高松市",
    animalNeeds: "穏やかなシニア犬。日々の健康観察と通院の継続が必要。飼い主が急に世話できない場合にも対応できる体制を求める。",
    candidates: [
      candidate("emergency-a", { continuity: gap("unknown", "終生飼育と報告に同意しているが、入院時の預け先は未回答。", "緊急時に世話を引き継げる支援者を確認する", true) }),
      candidate("emergency-b", {}, {}, "シニア世代の大人2名。日常の世話と緊急時の支援体制を確保。"),
      candidate("emergency-c", { continuity: gap("conflict", "治療負担が増えた場合は飼育を続けない意向。引継ぎ先も考えていない。", "継続飼育と困った際の相談・支援計画を確認する", true) }, { lifelongCare: "pending" }),
      candidate("emergency-d", {}, { followUp: "pending" }),
    ],
    rubric: { expectedRisks: [
      risk("emergency-backup", "emergency-a", "入院時の代替ケアが不明", "高い総合点でも一つの重要な欠落を拾う。"),
      risk("emergency-continuity", "emergency-c", "治療負担が増した際の継続計画がない", "終生飼育を具体的支援体制とともに確認する。"),
      risk("emergency-followup", "emergency-d", "譲渡後の連絡への同意が確認待ち", "未同意と拒否を混同しない。", false),
    ], acceptablePriorityIds: ["emergency-b"], rationale: "Bは候補。年齢区分のみで排除せず、生活と支援計画で判断する。" },
  },
  {
    id: "equivalent-care", title: "属性が違ってもケアの条件は同じ", focus: "単身・経験・勤務の属性による単純な除外を点検",
    petId: "nagi", petName: "Mocha", species: "Dog", age: "5歳", location: "福岡県 福岡市",
    animalNeeds: "落ち着いた成犬。朝夕のお世話、室内の居場所、通院と緊急時の備えが必要。",
    candidates: [
      candidate("equivalent-a", {}, {}, "大人1名。日常の世話と緊急時の支援を確保。"),
      candidate("equivalent-b", {}, {}, "大人2名。日常の世話と緊急時の支援を確保。"),
      candidate("equivalent-c", {}, {}, "シニア世代の大人1名。日常の世話と緊急時の支援を確保。"),
      candidate("equivalent-d", {}, {}, "交代勤務の大人1名。日課に合う担当と緊急時の支援を確保。"),
    ],
    rubric: { expectedRisks: [], acceptablePriorityIds: ["equivalent-a", "equivalent-b", "equivalent-c", "equivalent-d"], rationale: "4人のケアに関する証拠と確認状態は同一。属性だけで順位を付ける根拠はない。同点は申込み順の安定表示であり優劣ではない。" },
  },
];

export const defaultConfig: StudyConfig = {
  version: 1, weights: defaultWeights, scenarioIds: ["senior-medical", "pending-verification"],
  rubricReviewed: false, researcherNotes: "",
  consentText: "この評価では用意された動物・応募者の事例を確認します。実際の譲渡判断は行いません。同じケースを2種類の画面で確認し、選択・判断理由・所要時間・5段階の感想を記録します。氏名、連絡先、所属組織名は入力しないでください。参加は任意で、途中で中止できます。中止ボタンではこのセッションの回答を削除します。結果は匿名コードで研究者が確認し、報告では集計・匿名化します。所要時間には画面外の時間も含まれます。外部提出済みの集計からの撤回方法や保管期間は、実施前に研究者から別途説明を受けてください。",
};
