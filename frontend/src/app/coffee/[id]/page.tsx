import Image from "next/image";
import Link from "next/link";
import DeleteCoffeeBeanButton from "./DeleteCoffeeBeanButton";
import TastingNotesSection, {
  type TastingNote,
} from "./TastingNotesSection";

export const dynamic = "force-dynamic";

type CoffeeBean = {
  id: number;
  image_url: string | null;
  brand: string | null;
  code: string | null;
  roast_level: string | null;
  name: string | null;
  country: string | null;
  name_ja: string | null;
  description_ja: string | null;
  flavor_notes: string[] | null;
  region: string | null;
  process: string | null;
  variety: string | null;
  elevation: string | null;
  farmer: string | null;
  farm: string | null;
  is_limited: boolean | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  tasting_notes?: TastingNote[];
};

type CoffeeBeanResult =
  | {
      coffeeBean: CoffeeBean;
      error: null;
    }
  | {
      coffeeBean: null;
      error: string;
    };

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const detailFields: Array<{
  label: string;
  value: keyof CoffeeBean;
}> = [
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

async function fetchCoffeeBean(id: string): Promise<CoffeeBeanResult> {
  if (!API_BASE_URL) {
    return {
      coffeeBean: null,
      error: "NEXT_PUBLIC_API_BASE_URL が設定されていません。",
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/coffee_beans/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        coffeeBean: null,
        error: "コーヒー豆の取得に失敗しました。",
      };
    }

    return {
      coffeeBean: (await res.json()) as CoffeeBean,
      error: null,
    };
  } catch {
    return {
      coffeeBean: null,
      error: "Rails API に接続できませんでした。",
    };
  }
}

function buildImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) {
    return null;
  }

  if (/^https?:\/\//.test(imageUrl)) {
    return imageUrl;
  }

  if (!API_BASE_URL) {
    return imageUrl;
  }

  return `${new URL(API_BASE_URL).origin}${imageUrl}`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

export default async function CoffeeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { coffeeBean, error } = await fetchCoffeeBean(id);
  const imageUrl = buildImageUrl(coffeeBean?.image_url ?? null);
  const tastingNotes = coffeeBean?.tasting_notes ?? [];

  return (
    <main className="h-full overflow-y-auto bg-stone-50 px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-6">
        <header className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/coffee"
              className="text-sm font-medium text-amber-800 transition hover:text-amber-950"
            >
              コーヒー豆一覧へ戻る
            </Link>
            <h1 className="mt-4 text-3xl font-semibold">
              {coffeeBean?.name || coffeeBean?.name_ja || "コーヒー豆詳細"}
            </h1>
            {coffeeBean?.name_ja ? (
              <p className="mt-2 text-sm text-gray-600">
                {coffeeBean.name_ja}
              </p>
            ) : null}
          </div>

          {coffeeBean ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <Link
                href={`/coffee/${coffeeBean.id}/edit`}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-amber-800 px-4 text-sm font-semibold text-white transition hover:bg-amber-900"
              >
                編集する
              </Link>
              <DeleteCoffeeBeanButton coffeeBeanId={coffeeBean.id} />
            </div>
          ) : null}
        </header>

        {error ? (
          <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </section>
        ) : null}

        {coffeeBean ? (
          <>
            <section className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
              <div className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">アップロード画像</h2>
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
                <div className="flex flex-wrap items-center gap-2">
                  {coffeeBean.status ? (
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                      {coffeeBean.status}
                    </span>
                  ) : null}
                  {coffeeBean.is_limited ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
                      Limited
                    </span>
                  ) : null}
                </div>

                {coffeeBean.description_ja ? (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {coffeeBean.description_ja}
                  </p>
                ) : null}

                {coffeeBean.flavor_notes &&
                coffeeBean.flavor_notes.length > 0 ? (
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
                    <dt className="text-xs font-medium text-gray-500">
                      Created
                    </dt>
                    <dd className="mt-1 font-medium text-gray-900">
                      {formatDate(coffeeBean.created_at)}
                    </dd>
                  </div>
                  <div className="rounded-md border border-stone-100 bg-stone-50 p-3">
                    <dt className="text-xs font-medium text-gray-500">
                      Updated
                    </dt>
                    <dd className="mt-1 font-medium text-gray-900">
                      {formatDate(coffeeBean.updated_at)}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            <TastingNotesSection
              coffeeBeanId={coffeeBean.id}
              initialTastingNotes={tastingNotes}
            />
          </>
        ) : null}
      </div>
    </main>
  );
}
