import { createHash, randomBytes } from "node:crypto";
import { mutateStore, readStore } from "./persistence";
import { resolveDemoUser } from "./demo-session";
import type { DemoUserId } from "./demoUsers";

type Session = { hash: string; userId: DemoUserId; expiresAt: number };
const key = "demo-sessions-v1";
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
export async function issueDemoSession(userId: DemoUserId) {
  if (!resolveDemoUser(userId)) throw new Error("Unknown demo user");
  const token = randomBytes(32).toString("hex");
  await mutateStore<Session[], void>(key, () => [], sessions => {
    const active = sessions.filter(session => session.expiresAt > Date.now());
    sessions.splice(0, sessions.length, ...active, { hash: hash(token), userId, expiresAt: Date.now() + 12 * 60 * 60 * 1000 });
  });
  return token;
}
export async function resolveDemoSession(token: string | undefined) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = (await readStore<Session[]>(key, () => [])).find(session => session.hash === hash(token) && session.expiresAt > Date.now());
  return session ? resolveDemoUser(session.userId) : null;
}
export async function revokeDemoSession(token: string | undefined) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return;
  await mutateStore<Session[], void>(key, () => [], sessions => {
    const remaining = sessions.filter(session => session.hash !== hash(token) && session.expiresAt > Date.now());
    sessions.splice(0, sessions.length, ...remaining);
  });
}
