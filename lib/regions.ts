export const REGIONS = ["全国", "北海道", "東北", "関東", "中部", "甲信越", "近畿", "中国", "四国", "九州", "沖縄"] as const;

const PREFECTURES_BY_REGION: Record<(typeof REGIONS)[number], string[]> = {
  "全国": [],
  "北海道": ["北海道"],
  "東北": ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  "関東": ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
  "甲信越": ["新潟県", "山梨県", "長野県"],
  "中部": ["富山県", "石川県", "福井県", "岐阜県", "静岡県", "愛知県", "三重県"],
  "近畿": ["滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
  "中国": ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  "四国": ["徳島県", "香川県", "愛媛県", "高知県"],
  "九州": ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県"],
  "沖縄": ["沖縄県"],
};

export function locationMatchesRegion(location: string, region: string) {
  if (region === "全国") return true;
  return (PREFECTURES_BY_REGION[region as keyof typeof PREFECTURES_BY_REGION] ?? []).some((prefecture) => location.includes(prefecture));
}
