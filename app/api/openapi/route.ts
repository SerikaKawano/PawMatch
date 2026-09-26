import { apiAccess } from "@/lib/access-control";
import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/openapi";
export async function GET(request: Request) {
  const access = await apiAccess("admin", request); if (access.error) return access.error;
 return NextResponse.json(openApiSpec); }
