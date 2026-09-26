import { redirect } from "next/navigation";
import { currentDemoUser, isSameOrigin } from "./demo-session-server";
import { canAccess, type Capability } from "./permissions";

export async function requirePageAccess(capability: Capability, next: string) {
  const user = await currentDemoUser();
  if (!user) redirect("/login?next=" + encodeURIComponent(next));
  if (!canAccess(user, capability)) redirect("/access-denied");
  return user;
}
export async function apiAccess(capability: Capability, request?: Request) {
  const user = await currentDemoUser();
  if (!user) return { user: null, error: Response.json({ error: "ログインしてください。" }, { status: 401 }) };
  if (!canAccess(user, capability)) return { user: null, error: Response.json({ error: "このロールでは利用できません。" }, { status: 403 }) };
  if (request && !["GET", "HEAD"].includes(request.method) && !isSameOrigin(request)) return { user: null, error: Response.json({ error: "このサイトから操作してください。" }, { status: 403 }) };
  return { user, error: null };
}
