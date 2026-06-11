import { BASE_PATH } from "@/lib/publicPath";

export const API_BASE_URL = "/api/backend";

export async function hasSession(): Promise<boolean> {
  const response = await fetch("/api/auth/session", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) return false;

  const data = (await response.json()) as { authenticated?: boolean };
  return data.authenticated === true;
}

export function getToken(): string | null {
  return null;
}

export function setToken(token: string): void {
  void token;
  // Tokens are stored in an HttpOnly cookie by the server.
}

export function removeToken(): void {
  void fetch("/api/auth/sign_out", {
    method: "DELETE",
    credentials: "same-origin",
  });
}

export function authHeaders(): Record<string, string> {
  return {};
}

export async function apiFetch(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  const baseHeaders: Record<string, string> = {};

  if (!(init.body instanceof FormData)) {
    baseHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(input, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...baseHeaders,
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 401) {
    removeToken();
    if (typeof window !== "undefined" && window.location.pathname !== `${BASE_PATH}/login`) {
      window.location.href = `${BASE_PATH}/login`;
    }
  }

  return res;
}
