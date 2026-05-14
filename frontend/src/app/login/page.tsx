"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { setToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!API_BASE_URL) {
      setError("API URLが設定されていません。");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/sign_in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: { email, password } }),
      });

      if (!res.ok) {
        setError("メールアドレスまたはパスワードが正しくありません。");
        return;
      }

      const token = res.headers.get("Authorization");
      if (!token) {
        setError("認証トークンの取得に失敗しました。");
        return;
      }

      setToken(token);
      router.push("/calendar");
    } catch {
      setError("サーバーに接続できませんでした。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm rounded-md border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">ログイン</h1>
        <p className="mt-2 text-sm text-gray-500">Daily Life App</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-gray-700">メールアドレス</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="min-h-11 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-gray-700">パスワード</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="min-h-11 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
            />
          </label>

          {error ? (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 min-h-11 rounded-md bg-amber-800 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
