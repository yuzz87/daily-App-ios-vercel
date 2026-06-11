import { NextRequest, NextResponse } from "next/server";
import {
  authorizationHeader,
  backendApiBaseUrl,
  clearAuthCookie,
  getAuthToken,
  invalidOriginResponse,
  isSameOriginRequest,
} from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) return invalidOriginResponse();

  const token = await getAuthToken();

  if (token) {
    await fetch(`${backendApiBaseUrl()}/auth/sign_out`, {
      method: "DELETE",
      headers: {
        Authorization: authorizationHeader(token),
        Accept: "application/json",
      },
      cache: "no-store",
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ message: "Signed out." }, { status: 200 });
  clearAuthCookie(response);
  return response;
}
