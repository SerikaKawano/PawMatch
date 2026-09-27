// Shared labels for the same action across public and role-specific screens.
export const uiCopy = {
  findPets: "里親募集中の子を探す",
  manageListings: "掲載・里親申込みを管理",
  seeDetails: "詳細を見る",
  adoptionFlow: "譲渡までの流れ",
  viewFlow: "流れを見る",
  contactPet: (name: string) => `${name}について問い合わせる`,
} as const;
