import { BASE_PATH } from "@/lib/publicPath";

const TOKEN_KEY = "auth_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: token } : {};
}

export async function apiFetch(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  const baseHeaders: Record<string, string> = { ...authHeaders() };

  // FormData の場合は Content-Type をセットしない（ブラウザが自動設定）
  if (!(init.body instanceof FormData)) {
    baseHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(input, {
    ...init,
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
    return res;
  }

  return res;
}
