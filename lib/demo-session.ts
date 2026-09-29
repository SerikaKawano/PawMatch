import { demoUsers } from "./demoUsers";

export const DEMO_COOKIE = "pawmatch-demo-session";
export function resolveDemoUser(value: unknown) {
  return demoUsers.find(user => user.id === value) ?? null;
}
// Deliberately allow only destinations used by the demo login flow.
export function safeLoginNext(value: unknown): string {
  if (typeof value !== "string") return "/dashboard";
  return /^(?:\/dashboard(?:#consultations)?|\/rehoming(?:\/new|\/consultations)?|\/consultations\/[a-zA-Z0-9-]+|\/pets(?:\/[a-zA-Z0-9-]+(?:\/consult)?)?)$/.test(value) ? value : "/dashboard";
}
