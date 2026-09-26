import type { DemoRole, DemoUser } from "./demoUsers";
export type Capability = "consult" | "rehome" | "review" | "admin";
const grants: Record<Capability, readonly DemoRole[]> = {
  consult: ["adopter", "admin"],
  rehome: ["rehomer", "admin"],
  review: ["rehomer", "reviewer", "admin"],
  admin: ["admin"],
};
export function canAccess(user: Pick<DemoUser, "role"> | null, capability: Capability) {
  return Boolean(user && grants[capability].includes(user.role));
}
export function capabilityForPath(path: string): Capability | null {
  if (/^\/pets\/[^/]+\/consult$/.test(path) || path === "/api/consultations") return "consult";
  if (path === "/rehoming") return "rehome";
  if (path === "/reviews" || path.startsWith("/reviews/") || path === "/api/applications" || path.startsWith("/api/applications/")) return "review";
  if (path.startsWith("/admin/") || path === "/research" || path === "/research/setup" || path === "/research/results" || path === "/docs" || path === "/api/openapi" || path === "/api/seed" || (path.startsWith("/api/research/") && !/^\/api\/research\/sessions\/[^/]+$/.test(path))) return "admin";
  return null;
}
export function permittedDestination(user: Pick<DemoUser, "role">, destination: string) {
  const capability = capabilityForPath(destination.split(/[?#]/)[0]);
  return capability && !canAccess(user, capability) ? "/dashboard" : destination;
}
