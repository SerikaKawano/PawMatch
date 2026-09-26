import { apiAccess } from "@/lib/access-control";
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { seedDatabase } from "@/lib/repository";
export async function POST(request: Request) {
  const access = await apiAccess("admin", request); if (access.error) return access.error;
 if (!isDatabaseConfigured()) return NextResponse.json({ error: "Set MONGODB_URI before seeding" }, { status: 503 }); return NextResponse.json({ data: await seedDatabase() }); }
