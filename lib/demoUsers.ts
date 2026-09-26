export type DemoRole = "admin" | "reviewer" | "rehomer" | "adopter";
export type DemoUserId = DemoRole | "reviewer-alex" | "adopter-olivia" | "rehomer-hana" | "rehomer-riku" | "rehomer-haru" | "rehomer-nagi";
export type DemoUser = { id: DemoUserId; role: DemoRole; name: string; organization: string; roleLabel: string; email: string; initials: string; description: string; color: string; kind?: "organization" | "individual" };

export const demoUsers: DemoUser[] = [
  { id: "admin", role: "admin", name: "Serika Kawano", organization: "PawMatch Research", roleLabel: "管理者", email: "serika@pawmatch.test", initials: "SK", description: "評価設定、審査基準、履歴を管理します。", color: "navy" },
  { id: "reviewer", role: "reviewer", name: "Sophie Bennett", organization: "PawMatch Review Team", roleLabel: "審査担当", email: "sophie@pawmatch.test", initials: "SB", description: "申込みの根拠と未確認事項を整理します。", color: "green" },
  { id: "reviewer-alex", role: "reviewer", name: "Alex Morgan", organization: "PawMatch Review Team", roleLabel: "審査担当", email: "alex@pawmatch.test", initials: "AM", description: "審査フローと記録を確認します。", color: "green" },
  { id: "rehomer", role: "rehomer", name: "Emma Wilson", organization: "North Star Rescue", roleLabel: "譲渡者（団体）", email: "emma@pawmatch.test", initials: "EW", description: "4頭の募集と届いた申込みを管理します。", color: "orange", kind: "organization" },
  { id: "rehomer-hana", role: "rehomer", name: "Daniel Carter", organization: "宮城県・個人譲渡者", roleLabel: "譲渡者（個人）", email: "daniel@pawmatch.test", initials: "DC", description: "Lunaの新しい家族を探します。", color: "orange", kind: "individual" },
  { id: "rehomer-riku", role: "rehomer", name: "Olivia Reed", organization: "愛知県・個人譲渡者", roleLabel: "譲渡者（個人）", email: "olivia.reed@pawmatch.test", initials: "OR", description: "Oreoの新しい家族を探します。", color: "orange", kind: "individual" },
  { id: "rehomer-haru", role: "rehomer", name: "Lucas Meyer", organization: "香川県・個人譲渡者", roleLabel: "譲渡者（個人）", email: "lucas@pawmatch.test", initials: "LM", description: "Daisyの新しい家族を探します。", color: "orange", kind: "individual" },
  { id: "rehomer-nagi", role: "rehomer", name: "Mia Thompson", organization: "福岡県・個人譲渡者", roleLabel: "譲渡者（個人）", email: "mia@pawmatch.test", initials: "MT", description: "Mochaの新しい家族を探します。", color: "orange", kind: "individual" },
  { id: "adopter", role: "adopter", name: "Noah Williams", organization: "個人利用", roleLabel: "里親希望者", email: "noah@pawmatch.test", initials: "NW", description: "ペットを探し、相談内容を確認します。", color: "yellow" },
  { id: "adopter-olivia", role: "adopter", name: "Olivia Parker", organization: "個人利用", roleLabel: "里親希望者", email: "olivia.parker@pawmatch.test", initials: "OP", description: "ペットの条件を読み、相談を保存します。", color: "yellow" },
];
