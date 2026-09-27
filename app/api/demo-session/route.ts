import { NextResponse } from "next/server";
import { DEMO_COOKIE, resolveDemoUser } from "@/lib/demo-session";
import { currentDemoUser, isSameOrigin } from "@/lib/demo-session-server";
import { cookies } from "next/headers";
import { issueDemoSession, revokeDemoSession } from "@/lib/demo-session-store";

export async function GET() {
  return NextResponse.json({ user: await currentDemoUser() }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "このサイトから操作してください。" }, { status: 403 });
  if (await currentDemoUser()) return NextResponse.json({ error: "別のユーザーを選ぶには、先にログアウトしてください。" }, { status: 409 });
  const body = await request.json().catch(() => null);
  const user = resolveDemoUser(body?.userId);
  if (!user) return NextResponse.json({ error: "テストユーザーを選択してください。" }, { status: 400 });
  const response = NextResponse.json({ user });
  const token = await issueDemoSession(user.id);
  response.cookies.set(DEMO_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: new URL(request.url).protocol === "https:", path: "/", maxAge: 12 * 60 * 60 });
  response.cookies.set("pawmatch-demo-user", "", { path: "/", maxAge: 0 });
  return response;
}
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "このサイトから操作してください。" }, { status: 403 });
  await revokeDemoSession((await cookies()).get(DEMO_COOKIE)?.value);
  const response = NextResponse.json({ user: null });
  response.cookies.set(DEMO_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
