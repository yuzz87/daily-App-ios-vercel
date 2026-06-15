"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL, apiFetch } from "@/lib/auth";
import DeleteCoffeeBeanButton from "./DeleteCoffeeBeanButton";
import { getDemoCoffeeBean, isDemoCoffeePath } from "../demoCoffeeStore";
import type { CoffeeBean } from "../types";
import { buildImageUrl, formatDate, formatValue } from "../utils";

const detailFields: Array<{ label: string; value: keyof CoffeeBean }> = [
  { label: "Brand", value: "brand" },
  { label: "Code", value: "code" },
  { label: "Roast level", value: "roast_level" },
  { label: "Country", value: "country" },
  { label: "Region", value: "region" },
  { label: "Process", value: "process" },
  { label: "Variety", value: "variety" },
  { label: "Elevation", value: "elevation" },
  { label: "Farmer", value: "farmer" },
  { label: "Farm", value: "farm" },
];

export default function CoffeeDetailClient({ id }: { id: string }) {
  const pathname = usePathname();
  const isDemo = isDemoCoffeePath(pathname);
  const basePath = isDemo ? "/demo/coffee" : "/coffee";
  const [coffeeBean, setCoffeeBean] = useState<CoffeeBean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let didFinish = false;

    const loadingTimer = window.setTimeout(() => {
      if (cancelled || didFinish) return;
      setLoading(true);
      setError(null);
    }, 0);

    if (isDemo) {
      const demoTimer = window.setTimeout(() => {
        if (cancelled) return;
        const data = getDemoCoffeeBean(id);
        didFinish = true;
        setCoffeeBean(data);
        setError(data ? null : "Coffee bean not found.");
        setLoading(false);
      }, 0);

      return () => {
        cancelled = true;
        window.clearTimeout(loadingTimer);
        window.clearTimeout(demoTimer);
      };
    }

    const controller = new AbortController();

    apiFetch(`${API_BASE_URL}/coffee_beans/${id}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => {
        if (cancelled) return null;
        if (!res.ok) throw new Error("コーヒー豆の取得に失敗しました。");
        return res.json() as Promise<CoffeeBean>;
      })
      .then((data) => {
        if (!cancelled && data) setCoffeeBean(data);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!cancelled) {
          setError(err.message ?? "Rails API に接続できませんでした。");
        }
      })
      .finally(() => {
        didFinish = true;
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimer);
      controller.abort();
    };
  }, [id, isDemo]);

  const imageUrl = buildImageUrl(coffeeBean?.image_url ?? null);

  return (
    <main className="h-full overflow-y-auto bg-stone-50 px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-6">
        <header className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href={basePath}
              className="text-sm font-medium text-amber-800 transition hover:text-amber-950"
            >
              コーヒー豆一覧へ戻る
            </Link>
            <h1 className="mt-4 text-3xl font-semibold">
              {coffeeBean?.name || coffeeBean?.name_ja || "コーヒー豆詳細"}
            </h1>
            {coffeeBean?.name_ja ? (
              <p className="mt-2 text-sm text-gray-600">{coffeeBean.name_ja}</p>
            ) : null}
          </div>

          {coffeeBean ? (
            <DeleteCoffeeBeanButton coffeeBeanId={coffeeBean.id} />
          ) : null}
        </header>

        {loading ? (
          <section className="rounded-md border border-stone-200 bg-white p-6 text-sm text-gray-600">
            読み込み中...
          </section>
        ) : null}

        {!loading && error ? (
          <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </section>
        ) : null}

        {!loading && coffeeBean ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
            <div className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">パッケージ画像</h2>
              {imageUrl ? (
                <div className="mt-4 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                  <Image
                    src={imageUrl}
                    alt="アップロード済みコーヒーパッケージ画像"
                    width={720}
                    height={960}
                    className="h-auto max-h-[70vh] w-full object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="mt-4 flex min-h-64 items-center justify-center rounded-md border border-dashed border-stone-300 bg-stone-100 px-4 text-center text-sm text-gray-500">
                  アップロード画像はありません。
                </div>
              )}
            </div>

            <div className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
              {coffeeBean.is_limited ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
                    Limited
                  </span>
                </div>
              ) : null}

              {coffeeBean.description_ja ? (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {coffeeBean.description_ja}
                </p>
              ) : null}

              {coffeeBean.flavor_notes && coffeeBean.flavor_notes.length > 0 ? (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {coffeeBean.flavor_notes.map((note) => (
                    <li
                      key={note}
                      className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
                    >
                      {note}
                    </li>
                  ))}
                </ul>
              ) : null}

              <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                {detailFields.map((field) => (
                  <div
                    key={field.value}
                    className="rounded-md border border-stone-100 bg-stone-50 p-3"
                  >
                    <dt className="text-xs font-medium text-gray-500">
                      {field.label}
                    </dt>
                    <dd className="mt-1 break-words font-medium text-gray-900">
                      {formatValue(coffeeBean[field.value])}
                    </dd>
                  </div>
                ))}
                <div className="rounded-md border border-stone-100 bg-stone-50 p-3">
                  <dt className="text-xs font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {formatDate(coffeeBean.created_at)}
                  </dd>
                </div>
                <div className="rounded-md border border-stone-100 bg-stone-50 p-3">
                  <dt className="text-xs font-medium text-gray-500">Updated</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {formatDate(coffeeBean.updated_at)}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
