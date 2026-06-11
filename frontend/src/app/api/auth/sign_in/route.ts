import { NextRequest, NextResponse } from "next/server";
import {
  backendApiBaseUrl,
  invalidOriginResponse,
  isSameOriginRequest,
  setAuthCookie,
} from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return invalidOriginResponse();

  const body = await request.text();
  const backendResponse = await fetch(`${backendApiBaseUrl()}/auth/sign_in`, {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });

  const responseBody = await backendResponse.text();
  const response = new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: {
      "Content-Type": backendResponse.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });

  const authorization = backendResponse.headers.get("authorization");
  if (backendResponse.ok && authorization) {
    setAuthCookie(response, authorization);
  }

  return response;
}
