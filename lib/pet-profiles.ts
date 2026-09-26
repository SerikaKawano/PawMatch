import type { Pet } from "./types";

// All entries are synthetic study scenarios. Descriptions are not veterinary records.
export const petProfiles: Record<string, Pick<Pet, "health" | "rehoming">> = {
  momo: {
    health: { medicalHistory: "継続的な通院と朝夕の投薬が必要というデモ設定です。診断名は未設定です。", medicalRecords: ["通院頻度：3か月ごと（架空の申告）", "診療明細・検査結果：未提出"], vaccinations: "接種日・種類を確認中", medication: "朝夕の投薬あり（薬剤名・用量は未確認）", spayNeuter: "確認中", microchip: "確認中", evidenceStatus: "医療・接種記録の原本は未確認" },
    rehoming: { origin: "保護・飼育歴の詳細は確認中", pedigree: "血統書なし／血統の確認資料なし", houseTraining: "室内での生活を想定", compatibility: "先住猫との相性は個別に確認", requirements: ["朝夕の投薬を継続できること", "完全室内飼育と定期通院の計画"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
  yuki: {
    health: { medicalHistory: "既往歴は未申告。『病歴なし』を意味しません。", medicalRecords: ["診療履歴：未提出"], vaccinations: "接種履歴を確認中", medication: "継続投薬の有無を確認中", spayNeuter: "確認中", microchip: "確認中", evidenceStatus: "健康情報は未確認項目があります" },
    rehoming: { origin: "保護経緯の詳細は確認中", pedigree: "血統書なし／血統の確認資料なし", houseTraining: "完全室内飼育を希望", compatibility: "環境変化に慎重。家族・先住動物との相性は未確認", requirements: ["静かな居場所の確保", "窓・玄関の脱走防止"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
  sora: {
    health: { medicalHistory: "既往歴は未申告。活動量を踏まえた日常の健康観察が必要です。", medicalRecords: ["直近の診療・検査記録：未提出"], vaccinations: "犬の混合ワクチン・狂犬病予防接種の記録を確認中", medication: "継続投薬の有無を確認中", spayNeuter: "確認中", microchip: "確認中", evidenceStatus: "接種証明・診療記録は未確認" },
    rehoming: { origin: "保護・飼育歴の詳細は確認中", pedigree: "ミックス犬・血統書なし", houseTraining: "トイレ・留守番の習熟度を確認中", compatibility: "幼い子どもとの接触は大人が管理", requirements: ["朝夕の運動を続けられること", "短いトレーニングと家族の安全管理"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
  kai: {
    health: { medicalHistory: "大型犬として体重管理が必要というデモ設定です。既往歴は未確認。", medicalRecords: ["体重・健診の記録：未提出"], vaccinations: "接種履歴を確認中", medication: "継続投薬の有無を確認中", spayNeuter: "確認中", microchip: "確認中", evidenceStatus: "医療情報の原本は未確認" },
    rehoming: { origin: "保護・飼育歴の詳細は確認中", pedigree: "犬種は外見上の推定。血統書は未確認", houseTraining: "室内での生活経験を確認中", compatibility: "子ども・先住動物との相性は個別に確認", requirements: ["大型犬の飼育が許可された住居", "体重管理と毎日の運動"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
  hana: {
    health: { medicalHistory: "既往歴は未申告。健康状態の詳細は確認中。", medicalRecords: ["診療履歴：未提出"], vaccinations: "接種履歴を確認中", medication: "継続投薬の有無を確認中", spayNeuter: "確認中", microchip: "確認中", evidenceStatus: "医療・接種記録の原本は未確認" },
    rehoming: { origin: "保護経緯の詳細は確認中", pedigree: "血統書なし／血統の確認資料なし", houseTraining: "室内飼育を希望", compatibility: "ほかの猫には緊張しやすく、段階的な対面が必要", requirements: ["隔離できる部屋", "食事・健康状態の個別管理"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
  riku: {
    health: { medicalHistory: "既往歴は未申告。シニア期に向けた健診履歴を確認中。", medicalRecords: ["健診結果：未提出"], vaccinations: "接種履歴を確認中", medication: "継続投薬の有無を確認中", spayNeuter: "確認中", microchip: "確認中", evidenceStatus: "医療・接種記録の原本は未確認" },
    rehoming: { origin: "これまでの飼育歴を確認中", pedigree: "血統書なし／血統の確認資料なし", houseTraining: "完全室内飼育を希望", compatibility: "抱っこや大きな音が苦手。子ども・先住動物との相性は未確認", requirements: ["静かな生活環境", "触れ合いを強制しないこと"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
  haru: {
    health: { medicalHistory: "日々の健康観察と継続通院が必要というデモ設定です。診断名は未設定です。", medicalRecords: ["継続通院の頻度：確認中", "検査結果・処方記録：未提出"], vaccinations: "犬の混合ワクチン・狂犬病予防接種の記録を確認中", medication: "薬の有無・内容を確認中", spayNeuter: "確認中", microchip: "確認中", evidenceStatus: "継続ケアの根拠資料は未確認" },
    rehoming: { origin: "これまでの飼育歴を確認中", pedigree: "犬種は申告情報。血統書は未確認", houseTraining: "室内での生活を想定", compatibility: "家族・先住動物との相性は個別に確認", requirements: ["健康観察と通院を続けられること", "飼い主が不在になった場合の支援者"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
  nagi: {
    health: { medicalHistory: "既往歴は未申告。『病歴なし』を意味しません。", medicalRecords: ["診療履歴：未提出"], vaccinations: "犬の混合ワクチン・狂犬病予防接種の記録を確認中", medication: "継続投薬の有無を確認中", spayNeuter: "確認中", microchip: "確認中", evidenceStatus: "医療・接種記録の原本は未確認" },
    rehoming: { origin: "これまでの飼育歴を確認中", pedigree: "犬種は申告情報。血統書は未確認", houseTraining: "トイレ・留守番の習熟度を確認中", compatibility: "家族・先住動物との相性は個別に確認", requirements: ["朝夕のお世話", "通院・緊急時の備え"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
};
