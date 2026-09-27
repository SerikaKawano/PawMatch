import type { Pet } from "./types";

// All entries are synthetic study scenarios. Descriptions are not veterinary records.
export const petProfiles: Record<string, Pick<Pet, "health" | "rehoming">> = {
  momo: {
    health: { medicalHistory: "慢性腎臓病の経過観察中（譲渡者申告）。食欲・飲水量を毎日記録しています。", medicalRecords: ["2026年7月：定期血液検査と体重測定（3.8kg）", "2026年8月：尿検査と食事内容の確認"], vaccinations: "2025年11月：猫3種混合ワクチン接種（申告）", medication: "朝夕に内服薬1種類。処方内容は面談時に共有します。", spayNeuter: "避妊済み（2020年）", microchip: "装着済み（番号は非公開）", evidenceStatus: "未確認" },
    rehoming: { origin: "保護・飼育歴の詳細は確認中", pedigree: "血統書なし／血統の確認資料なし", houseTraining: "室内での生活を想定", compatibility: "先住猫との相性は個別に確認", requirements: ["朝夕の投薬を継続できること", "完全室内飼育と定期通院の計画"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
  yuki: {
    health: { medicalHistory: "2026年5月の健康診断で大きな指摘なし（譲渡者申告）。環境の変化で食欲が落ちやすい傾向があります。", medicalRecords: ["2026年5月：一般健康診断と体重測定（4.2kg）", "2026年5月：便検査"], vaccinations: "2026年4月：猫3種混合ワクチン接種", medication: "継続投薬なし", spayNeuter: "去勢済み（2023年）", microchip: "装着済み（番号は非公開）", evidenceStatus: "確認済" },
    rehoming: { origin: "保護経緯の詳細は確認中", pedigree: "血統書なし／血統の確認資料なし", houseTraining: "完全室内飼育を希望", compatibility: "環境変化に慎重。家族・先住動物との相性は未確認", requirements: ["静かな居場所の確保", "窓・玄関の脱走防止"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
  sora: {
    health: { medicalHistory: "大きな既往歴なし。運動量が多いため、足先や肉球の状態を日々確認しています（譲渡者申告）。", medicalRecords: ["2026年3月：健康診断と体重測定（13.6kg）", "2026年6月：便検査"], vaccinations: "2026年4月：犬の混合ワクチン、2026年5月：狂犬病予防接種", medication: "継続投薬なし", spayNeuter: "避妊済み（2025年）", microchip: "装着済み（番号は非公開）", evidenceStatus: "確認済" },
    rehoming: { origin: "保護・飼育歴の詳細は確認中", pedigree: "ミックス犬・血統書なし", houseTraining: "トイレ・留守番の習熟度を確認中", compatibility: "幼い子どもとの接触は大人が管理", requirements: ["朝夕の運動を続けられること", "短いトレーニングと家族の安全管理"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
  kai: {
    health: { medicalHistory: "体重が増えやすいため、食事量と関節への負担に配慮しています（譲渡者申告）。", medicalRecords: ["2026年2月：健康診断・体重31.2kg", "2026年7月：体重確認・30.6kg"], vaccinations: "2026年3月：犬の混合ワクチン、2026年4月：狂犬病予防接種", medication: "継続投薬なし", spayNeuter: "去勢済み（2022年）", microchip: "装着済み（番号は非公開）", evidenceStatus: "確認済" },
    rehoming: { origin: "保護・飼育歴の詳細は確認中", pedigree: "犬種は外見上の推定。血統書は未確認", houseTraining: "室内での生活経験を確認中", compatibility: "子ども・先住動物との相性は個別に確認", requirements: ["大型犬の飼育が許可された住居", "体重管理と毎日の運動"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
  hana: {
    health: { medicalHistory: "大きな既往歴なし。環境の変化で食事量が減ることがあるため、移動後の食欲を観察します（譲渡者申告）。", medicalRecords: ["2026年1月：一般健康診断・体重3.6kg", "2026年6月：便検査"], vaccinations: "2026年2月：猫3種混合ワクチン接種", medication: "継続投薬なし", spayNeuter: "避妊済み（2022年）", microchip: "装着済み（番号は非公開）", evidenceStatus: "確認済" },
    rehoming: { origin: "保護経緯の詳細は確認中", pedigree: "血統書なし／血統の確認資料なし", houseTraining: "室内飼育を希望", compatibility: "ほかの猫には緊張しやすく、段階的な対面が必要", requirements: ["隔離できる部屋", "食事・健康状態の個別管理"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
  riku: {
    health: { medicalHistory: "歯石がつきやすく、定期的な口腔チェックを続けています（譲渡者申告）。", medicalRecords: ["2026年3月：健康診断・体重4.5kg", "2026年3月：口腔内の確認"], vaccinations: "2025年12月：猫3種混合ワクチン接種", medication: "継続投薬なし", spayNeuter: "去勢済み（2019年）", microchip: "装着済み（番号は非公開）", evidenceStatus: "確認済" },
    rehoming: { origin: "これまでの飼育歴を確認中", pedigree: "血統書なし／血統の確認資料なし", houseTraining: "完全室内飼育を希望", compatibility: "抱っこや大きな音が苦手。子ども・先住動物との相性は未確認", requirements: ["静かな生活環境", "触れ合いを強制しないこと"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
  haru: {
    health: { medicalHistory: "後ろ脚にこわばりがあり、関節の経過観察を続けています（譲渡者申告）。", medicalRecords: ["2026年2月：整形外科の診察と歩行状態の確認", "2026年8月：定期診察・体重7.1kg"], vaccinations: "2026年3月：犬の混合ワクチン、2026年4月：狂犬病予防接種", medication: "関節ケアの内服薬を1日1回。処方内容は面談時に共有します。", spayNeuter: "避妊済み（2020年）", microchip: "装着済み（番号は非公開）", evidenceStatus: "未確認" },
    rehoming: { origin: "これまでの飼育歴を確認中", pedigree: "犬種は申告情報。血統書は未確認", houseTraining: "室内での生活を想定", compatibility: "家族・先住動物との相性は個別に確認", requirements: ["健康観察と通院を続けられること", "飼い主が不在になった場合の支援者"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
  nagi: {
    health: { medicalHistory: "大きな既往歴なし。皮膚が乾燥しやすいため、ブラッシング時に状態を確認しています（譲渡者申告）。", medicalRecords: ["2026年4月：健康診断・体重4.3kg", "2026年7月：皮膚と被毛の確認"], vaccinations: "2026年4月：犬の混合ワクチン、2026年5月：狂犬病予防接種", medication: "継続投薬なし", spayNeuter: "去勢済み（2023年）", microchip: "装着済み（番号は非公開）", evidenceStatus: "確認済" },
    rehoming: { origin: "これまでの飼育歴を確認中", pedigree: "犬種は申告情報。血統書は未確認", houseTraining: "トイレ・留守番の習熟度を確認中", compatibility: "家族・先住動物との相性は個別に確認", requirements: ["朝夕のお世話", "通院・緊急時の備え"], trial: "トライアルの可否・期間は相談時に確認", fees: "費用・実費の有無と内訳は事前に確認" },
  },
};
