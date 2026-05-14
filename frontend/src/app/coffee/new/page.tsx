"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

type AnalyzeResponse = {
  id?: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function NewCoffeePage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    const nextPreviewUrl = file ? URL.createObjectURL(file) : null;
    previewUrlRef.current = nextPreviewUrl;

    setErrorMessage(null);
    setSelectedImage(file);
    setPreviewUrl(nextPreviewUrl);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!API_BASE_URL) {
      setErrorMessage("NEXT_PUBLIC_API_BASE_URL が設定されていません。");
      return;
    }

    if (!selectedImage) {
      setErrorMessage("読み取るパッケージ画像を選択してください。");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedImage);

      const res = await fetch(`${API_BASE_URL}/coffee_beans/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const message = await getErrorMessage(res);
        setErrorMessage(message);
        return;
      }

      const data = (await res.json()) as AnalyzeResponse;

      if (typeof data.id !== "number") {
        setErrorMessage("読み取り結果にコーヒー豆 ID が含まれていません。");
        return;
      }

      router.push(`/coffee/edit/${data.id}`);
    } catch {
      setErrorMessage("Rails API に接続できませんでした。");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main className="h-full overflow-y-auto bg-stone-50 px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-6">
        <header className="border-b border-stone-200 pb-5">
          <Link
            href="/coffee"
            className="text-sm font-medium text-amber-800 transition hover:text-amber-950"
          >
            コーヒー豆一覧へ戻る
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">コーヒー豆を登録</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            PostCoffee のパッケージ画像を選択して、読み取り結果の確認画面へ進みます。
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
            <label
              htmlFor="coffee-image"
              className="block text-sm font-semibold text-gray-900"
            >
              パッケージ画像
            </label>
            <p className="mt-1 text-sm text-gray-600">
              スマートフォンではカメラ撮影、PC では画像ファイル選択ができます。
            </p>

            <input
              id="coffee-image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handleImageChange}
              disabled={isAnalyzing}
              className="mt-4 block w-full rounded-md border border-stone-300 bg-white text-sm text-gray-900 file:mr-4 file:min-h-11 file:border-0 file:bg-amber-800 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {previewUrl ? (
              <div className="mt-5 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                <Image
                  src={previewUrl}
                  alt="選択したコーヒーパッケージ画像のプレビュー"
                  width={960}
                  height={720}
                  className="h-auto max-h-[60vh] w-full object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="mt-5 flex min-h-64 items-center justify-center rounded-md border border-dashed border-stone-300 bg-stone-100 px-4 text-center text-sm text-gray-500">
                画像を選択すると、ここにプレビューが表示されます。
              </div>
            )}
          </section>

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/coffee"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-stone-300 px-4 text-sm font-semibold text-gray-700 transition hover:bg-white"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={!selectedImage || isAnalyzing}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-amber-800 px-4 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
            >
              {isAnalyzing ? "読み取り中..." : "AIで読み取る"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

async function getErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.join("\n");
    }

    if (typeof data.error === "string") {
      return data.error;
    }
  } catch {
    return "画像の読み取りに失敗しました。";
  }

  return "画像の読み取りに失敗しました。";
}
