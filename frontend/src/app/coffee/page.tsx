import Link from "next/link";

export const dynamic = "force-dynamic";

type CoffeeBean = {
  id: number;
  brand: string | null;
  code: string | null;
  roast_level: string | null;
  name: string | null;
  country: string | null;
  name_ja: string | null;
  flavor_notes: string[] | null;
  region: string | null;
  process: string | null;
  status: string | null;
  created_at: string | null;
};

type CoffeeBeanListResult =
  | {
      coffeeBeans: CoffeeBean[];
      error: null;
    }
  | {
      coffeeBeans: [];
      error: string;
    };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchCoffeeBeans(): Promise<CoffeeBeanListResult> {
  if (!API_BASE_URL) {
    return {
      coffeeBeans: [],
      error: "NEXT_PUBLIC_API_BASE_URL が設定されていません。",
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/coffee_beans`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        coffeeBeans: [],
        error: "コーヒー豆の取得に失敗しました。",
      };
    }

    const data = await res.json();

    return {
      coffeeBeans: Array.isArray(data) ? data : [],
      error: null,
    };
  } catch {
    return {
      coffeeBeans: [],
      error: "Rails API に接続できませんでした。",
    };
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return "登録日未設定";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getDisplayName(coffeeBean: CoffeeBean): string {
  return coffeeBean.name || coffeeBean.name_ja || "名称未設定";
}

export default async function CoffeePage() {
  const { coffeeBeans, error } = await fetchCoffeeBeans();

  return (
    <main className="h-full overflow-y-auto bg-stone-50 px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-6">
        <header className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-amber-700">Coffee Records</p>
            <h1 className="mt-1 text-3xl font-semibold">コーヒー豆一覧</h1>
          </div>
          <Link
            href="/coffee/new"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-amber-800 px-4 text-sm font-semibold text-white transition hover:bg-amber-900"
          >
            新しい豆を登録
          </Link>
        </header>

        {error ? (
          <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </section>
        ) : null}

        {!error && coffeeBeans.length === 0 ? (
          <section className="rounded-md border border-dashed border-stone-300 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold">登録済みの豆はありません</h2>
            <p className="mt-2 text-sm text-gray-600">
              画像アップロード画面の実装後、ここに保存済みのコーヒー豆が表示されます。
            </p>
            <Link
              href="/coffee/new"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-amber-800 px-4 text-sm font-semibold text-amber-900 transition hover:bg-amber-50"
            >
              登録ページへ
            </Link>
          </section>
        ) : null}

        {coffeeBeans.length > 0 ? (
          <section
            aria-label="コーヒー豆一覧"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {coffeeBeans.map((coffeeBean) => (
              <Link
                key={coffeeBean.id}
                href={`/coffee/${coffeeBean.id}`}
                className="flex min-h-56 flex-col justify-between rounded-md border border-stone-200 bg-white p-5 shadow-sm transition hover:border-amber-700 hover:shadow-md"
              >
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
                    {coffeeBean.status ? (
                      <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                        {coffeeBean.status}
                      </span>
                    ) : null}
                  </div>

                  <dl className="mt-4 grid gap-2 text-sm text-gray-600">
                    <div className="flex justify-between gap-3">
                      <dt>Code</dt>
                      <dd className="text-right text-gray-900">
                        {coffeeBean.code || "-"}
                      </dd>
                    </div>
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
                  {formatDate(coffeeBean.created_at)}
                </p>
              </Link>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
