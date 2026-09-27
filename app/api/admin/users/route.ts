import { NextResponse } from "next/server";
import { apiAccess } from "@/lib/access-control";
import { listManagedUsers, updateManagedUser } from "@/lib/admin-users";
import type { DemoRole, DemoUserId } from "@/lib/demoUsers";
import type { ManagedUserStatus } from "@/lib/admin-users";

export async function GET(request: Request) {
  const access = await apiAccess("admin", request);
  if (access.error) return access.error;
  return NextResponse.json({ users: await listManagedUsers() }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const access = await apiAccess("admin", request);
  if (access.error) return access.error;
  const body = await request.json().catch(() => null);
  try {
    const user = await updateManagedUser(
      body?.userId as DemoUserId,
      { role: body?.role as DemoRole, status: body?.status as ManagedUserStatus },
      access.user!.id,
    );
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "保存できませんでした。" }, { status: 400 });
  }
}
