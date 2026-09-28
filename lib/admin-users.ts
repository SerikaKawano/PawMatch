import { demoUsers, type DemoRole, type DemoUser, type DemoUserId } from "./demoUsers";
import { mutateStore, readStore } from "./persistence";

export type ManagedUserStatus = "active" | "suspended";
type UserOverride = { role: DemoRole; status: ManagedUserStatus; updatedAt: string; updatedBy: DemoUserId };
type UserOverrides = Partial<Record<DemoUserId, UserOverride>>;
export type ManagedUser = DemoUser & { status: ManagedUserStatus; updatedAt?: string };

const key = "admin-user-overrides";
const roles: DemoRole[] = ["admin", "reviewer", "rehomer", "adopter"];
const roleLabels: Record<DemoRole, string> = {
  admin: "管理者",
  reviewer: "審査担当",
  rehomer: "譲渡者",
  adopter: "里親希望者",
};
const roleColors: Record<DemoRole, string> = {
  admin: "green",
  reviewer: "green",
  rehomer: "pink",
  adopter: "yellow",
};

function mergeUser(user: DemoUser, override?: UserOverride): ManagedUser {
  const role = override?.role ?? user.role;
  return {
    ...user,
    role,
    roleLabel: roleLabels[role],
    color: roleColors[role],
    status: override?.status ?? "active",
    updatedAt: override?.updatedAt,
  };
}

export async function listManagedUsers() {
  const overrides = await readStore<UserOverrides>(key, () => ({}));
  return demoUsers.map(user => mergeUser(user, overrides[user.id]));
}

export async function effectiveDemoUser(user: DemoUser) {
  const overrides = await readStore<UserOverrides>(key, () => ({}));
  const managed = mergeUser(user, overrides[user.id]);
  return managed.status === "suspended" ? null : managed;
}

export async function updateManagedUser(
  userId: DemoUserId,
  input: { role: DemoRole; status: ManagedUserStatus },
  updatedBy: DemoUserId,
) {
  const base = demoUsers.find(user => user.id === userId);
  if (!base) throw new Error("対象のユーザが見つかりません。");
  if (!roles.includes(input.role) || !["active", "suspended"].includes(input.status)) throw new Error("権限または状態が不正です。");
  if (userId === "admin" && (input.role !== "admin" || input.status !== "active")) throw new Error("主管理者の権限変更・停止はできません。");
  const override: UserOverride = { ...input, updatedAt: new Date().toISOString(), updatedBy };
  await mutateStore<UserOverrides, void>(key, () => ({}), state => { state[userId] = override; });
  return mergeUser(base, override);
}
