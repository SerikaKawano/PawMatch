import { CalendarCheck2, HeartHandshake, MessageCircle, Search } from "lucide-react";

// The public home and guide deliberately share the same four steps and wording.
export const adoptionSteps = [
  { icon: Search, title: "探す", text: "里親募集中のペットの詳細や譲渡の条件をよく読みます。" },
  { icon: MessageCircle, title: "相談", text: "譲渡を希望する場合は、譲渡者へ相談します。書類で提出された里親希望者のプロファイルとペットの飼育条件が適合しているかどうかを審査担当者がチェックします。" },
  { icon: CalendarCheck2, title: "面談、トライアル", text: "書類チェックを通過後、面談とトライアル飼育を行います。" },
  { icon: HeartHandshake, title: "譲渡", text: "環境や相性に問題がないと判断されれば、両者の合意後に譲渡が成立します。" },
] as const;
