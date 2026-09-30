import type { DemoRole, DemoUser } from "./demoUsers";
export type Capability = "consult" | "rehome" | "review" | "reviewCase" | "admin";
const grants: Record<Capability, readonly DemoRole[]> = {
  consult: ["adopter", "admin"],
  rehome: ["rehomer", "admin"],
  review: ["rehomer", "reviewer", "admin"],
  reviewCase: ["adopter", "rehomer", "reviewer", "admin"],
  admin: ["admin"],
};
export function canAccess(user: Pick<DemoUser, "role"> | null, capability: Capability) {
  return Boolean(user && grants[capability].includes(user.role));
}
export function capabilityForPath(path: string): Capability | null {
  if (path === "/adopter/profile" || path === "/adopter/history") return "consult";
  if (/^\/api\/adopter-profile\/identity\/[^/]+$/.test(path)) return "review";
  if (path === "/api/adopter-profile" || path === "/api/adopter-profile/identity" || path === "/api/adopter-documents" || /^\/api\/adopter-documents\/[^/]+$/.test(path)) return "consult";
  if (/^\/pets\/[^/]+\/consult$/.test(path) || path === "/api/consultations") return "consult";
  if (path === "/rehoming" || path.startsWith("/rehoming/")) return "rehome";
  if (/^\/reviews\/[^/]+$/.test(path) && !["progress", "consultations", "adopters", "applicants", "records"].includes(path.slice("/reviews/".length))) return "reviewCase";
  if (path === "/reviews" || path.startsWith("/reviews/") || path === "/api/applications" || path.startsWith("/api/applications/")) return "review";
  if (path.startsWith("/admin/") || path === "/research" || path === "/research/setup" || path === "/research/results" || path === "/docs" || path === "/api/openapi" || path === "/api/seed" || (path.startsWith("/api/research/") && !/^\/api\/research\/sessions\/[^/]+$/.test(path))) return "admin";
  return null;
}
export function permittedDestination(user: Pick<DemoUser, "role">, destination: string) {
  const capability = capabilityForPath(destination.split(/[?#]/)[0]);
  return capability && !canAccess(user, capability) ? "/dashboard" : destination;
}
