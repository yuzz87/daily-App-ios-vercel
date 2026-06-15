"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL, apiFetch } from "@/lib/auth";
import { publicUrl } from "@/lib/publicPath";
import { getDemoCoffeeBeans, isDemoCoffeePath } from "./demoCoffeeStore";
import type { CoffeeBean } from "./types";
import { buildImageUrl, formatDate } from "./utils";

function getDisplayName(coffeeBean: CoffeeBean): string {
  return coffeeBean.name || coffeeBean.name_ja || "名称未設定";
}

export default function CoffeePage() {
  const pathname = usePathname();
  const isDemo = isDemoCoffeePath(pathname);
  const basePath = isDemo ? "/demo/coffee" : "/coffee";
  const [coffeeBeans, setCoffeeBeans] = useState<CoffeeBean[]>([]);
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
        didFinish = true;
        setCoffeeBeans(getDemoCoffeeBeans());
        setError(null);
        setLoading(false);
      }, 0);

      return () => {
        cancelled = true;
        window.clearTimeout(loadingTimer);
        window.clearTimeout(demoTimer);
      };
    }

    apiFetch(`${API_BASE_URL}/coffee_beans`)
      .then((res) => {
        if (cancelled) return null;
        if (!res.ok) {
          setError("コーヒー豆の取得に失敗しました。");
          return null;
        }
        return res.json() as Promise<CoffeeBean[]>;
      })
      .then((data) => {
        if (!cancelled && data) setCoffeeBeans(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setError("Rails API に接続できませんでした。");
      })
      .finally(() => {
        didFinish = true;
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimer);
    };
  }, [isDemo]);

  return (
    <main className="h-full overflow-y-auto bg-teal-100/80">
      <header className="w-full bg-teal-900/10 px-4 py-2 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl items-center">
          <Link
            href={`${basePath}/new`}
            aria-label="登録"
            title="登録"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full transition-all hover:bg-rose-400/50 duration-200 ease-out hover:scale-110 hover:rotate-360"
          >
            <Image
              src={publicUrl("/image-plus.svg")}
              alt=""
              width={32}
              height={32}
              aria-hidden="true"
            />
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 pb-6 sm:px-6 lg:px-8">
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

        {!loading && !error && coffeeBeans.length === 0 ? (
          <section className="rounded-md border border-dashed border-stone-300 bg-white p-8 text-center">
            <p>まだ登録されている豆はありません。</p>
          </section>
        ) : null}

        {coffeeBeans.length > 0 ? (
          <section
            aria-label="コーヒー豆一覧"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {coffeeBeans.map((coffeeBean) => {
              const imageUrl = buildImageUrl(coffeeBean.image_url);

              return (
                <Link
                  key={coffeeBean.id}
                  href={`${basePath}/detail?id=${coffeeBean.id}`}
                  className="flex min-h-[26rem] flex-col overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm transition hover:border-amber-700 hover:shadow-md"
                >
                  {imageUrl ? (
                    <div className="relative aspect-[4/3] w-full bg-stone-100">
                      <Image
                        src={imageUrl}
                        alt={`${getDisplayName(coffeeBean)} のパッケージ画像`}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-contain p-3"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center bg-stone-100 px-4 text-center text-sm text-gray-500">
                      画像なし
                    </div>
                  )}

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                            {coffeeBean.brand || "Brand unknown"}
                          </p>
                          <h2 className="mt-2 line-clamp-2 text-xl font-semibold">
                            {getDisplayName(coffeeBean)}
                          </h2>
                        </div>
                      </div>

                      <dl className="mt-4 grid gap-2 text-sm text-gray-600">
                        <div className="flex justify-between gap-3"></div>
                        <div className="flex justify-between gap-3">
                          <dt>Country</dt>
                          <dd className="text-right text-gray-900">
                            {coffeeBean.country || "-"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt>Roast</dt>
                          <dd className="text-right text-gray-900">
                            {coffeeBean.roast_level || "-"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt>Process</dt>
                          <dd className="text-right text-gray-900">
                            {coffeeBean.process || "-"}
                          </dd>
                        </div>
                      </dl>

                      {coffeeBean.flavor_notes &&
                      coffeeBean.flavor_notes.length > 0 ? (
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {coffeeBean.flavor_notes.slice(0, 4).map((note) => (
                            <li
                              key={note}
                              className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
                            >
                              {note}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <p className="mt-5 text-xs text-gray-500">
                      {formatDate(coffeeBean.created_at, "登録日未設定")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </section>
        ) : null}
      </div>
    </main>
  );
}
