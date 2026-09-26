import { cookies } from "next/headers";
import { DEMO_COOKIE } from "./demo-session";
import { resolveDemoSession } from "./demo-session-store";

export async function currentDemoUser() {
  return resolveDemoSession((await cookies()).get(DEMO_COOKIE)?.value);
}
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  // Next may rewrite request.url to its internal hostname. The browser's Host
  // header retains localhost / 127.0.0.1 and the public port it actually used.
  try {
    const source = new URL(origin);
    const target = new URL(request.url);
    return source.protocol === target.protocol && source.host === (request.headers.get("host") ?? target.host);
  } catch { return false; }
}
