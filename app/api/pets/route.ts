import { NextResponse } from "next/server";
import { getPets } from "@/lib/repository";
export async function GET() { return NextResponse.json({ data: await getPets() }); }
