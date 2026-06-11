import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const token = await getAuthToken();

  return NextResponse.json(
    { authenticated: Boolean(token) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
