import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const AUTH_COOKIE_NAME = "daily_auth_token";
export const AUTH_COOKIE_MAX_AGE = 24 * 60 * 60;

export function backendApiBaseUrl(): string {
  const url = process.env.BACKEND_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error("BACKEND_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL must be configured.");
  }

  return url.replace(/\/+$/, "");
}

export function backendOrigin(): string {
  return new URL(backendApiBaseUrl()).origin;
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export function setAuthCookie(response: NextResponse, authorizationHeader: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, normalizeAuthorizationHeader(authorizationHeader), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function authorizationHeader(token: string): string {
  return token.match(/^Bearer\s+/i) ? token : `Bearer ${token}`;
}

export function isMutatingMethod(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin) return origin === request.nextUrl.origin;

  const referer = request.headers.get("referer");
  if (!referer) return false;

  try {
    return new URL(referer).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export function invalidOriginResponse(): NextResponse {
  return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
}

function normalizeAuthorizationHeader(value: string): string {
  return value.replace(/^Bearer\s+/i, "");
}
