"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { API_BASE_URL, apiFetch } from "@/lib/auth";
import type { CoffeeBean } from "../types";
import {
  buildImageUrl,
  getErrorMessage,
  nullableString,
} from "../utils";
import {
  buttonClasses,
  inputClasses,
  textareaClasses,
} from "../styles";

type CoffeeBeanForm = {
  brand: string;
  code: string;
  roast_level: string;
  name: string;
  country: string;
  name_ja: string;
  description_ja: string;
  flavor_notes: string;
  region: string;
  process: string;
  variety: string;
  elevation: string;
  farmer: string;
  farm: string;
  is_limited: boolean;
};

type TextFieldName = Exclude<keyof CoffeeBeanForm, "is_limited">;

const textFields: Array<{
  name: TextFieldName;
  label: string;
  type?: "input" | "textarea";
}> = [
  { name: "brand", label: "Brand" },
  { name: "code", label: "Code" },
  { name: "roast_level", label: "Roast level" },
  { name: "name", label: "Name" },
  { name: "country", label: "Country" },
  { name: "name_ja", label: "Japanese name" },
  { name: "description_ja", label: "Japanese description", type: "textarea" },
  { name: "flavor_notes", label: "Flavor notes", type: "textarea" },
  { name: "region", label: "Region" },
  { name: "process", label: "Process" },
  { name: "variety", label: "Variety" },
  { name: "elevation", label: "Elevation" },
  { name: "farmer", label: "Farmer" },
  { name: "farm", label: "Farm" },
];

const emptyForm: CoffeeBeanForm = {
  brand: "",
  code: "",
  roast_level: "",
  name: "",
  country: "",
  name_ja: "",
  description_ja: "",
  flavor_notes: "",
  region: "",
  process: "",
  variety: "",
  elevation: "",
  farmer: "",
  farm: "",
  is_limited: false,
};

export default function EditCoffeeForm({
  coffeeBeanId,
}: {
  coffeeBeanId: string;
}) {
  const router = useRouter();
  const [coffeeBean, setCoffeeBean] = useState<CoffeeBean | null>(null);
  const [form, setForm] = useState<CoffeeBeanForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const imageUrl = useMemo(
    () => buildImageUrl(coffeeBean?.image_url ?? null),
    [coffeeBean]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function fetchCoffeeBean() {
      try {
        const res = await apiFetch(`${API_BASE_URL}/coffee_beans/${coffeeBeanId}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          const message = await getErrorMessage(res, "Failed to load the coffee bean.");
          setErrorMessage(message);
          return;
        }

        const data = (await res.json()) as CoffeeBean;
        setCoffeeBean(data);
        setForm(toForm(data));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setErrorMessage("Could not connect to the Rails API.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCoffeeBean();
    return () => controller.abort();
  }, [coffeeBeanId]);

  function handleTextChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleLimitedChange(event: ChangeEvent<HTMLInputElement>) {
    setForm((current) => ({ ...current, is_limited: event.target.checked }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await apiFetch(`${API_BASE_URL}/coffee_beans/${coffeeBeanId}`, {
        method: "PATCH",
        body: JSON.stringify({ coffee_bean: toPayload(form) }),
      });

      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to save the coffee bean.");
        setErrorMessage(message);
        return;
      }

      router.push(`/coffee/detail?id=${coffeeBeanId}`);
    } catch {
      setErrorMessage("Could not connect to the Rails API.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="h-full overflow-y-auto bg-stone-50 px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-6">
        <header className="border-b border-stone-200 pb-5">
          <Link
            href="/coffee"
            className="text-sm font-medium text-amber-800 transition hover:text-amber-950"
          >
            Back to coffee records
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">Confirm extraction result</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Review the extracted package fields, correct them, and save.
          </p>
        </header>

        {isLoading ? (
          <section className="rounded-md border border-stone-200 bg-white p-6 text-sm text-gray-600">
            Loading coffee bean...
          </section>
        ) : null}

        {!isLoading && errorMessage ? (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {!isLoading && coffeeBean ? (
          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
            <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Uploaded image</h2>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Uploaded coffee package"
                  className="mt-4 max-h-[70vh] w-full rounded-md border border-stone-200 bg-stone-100 object-contain"
                />
              ) : (
                <div className="mt-4 flex min-h-64 items-center justify-center rounded-md border border-dashed border-stone-300 bg-stone-100 px-4 text-center text-sm text-gray-500">
                  No uploaded image.
                </div>
              )}
            </section>

            <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Coffee bean fields</h2>
              <div className="mt-5 grid gap-4">
                {textFields.map((field) => (
                  <label key={field.name} className="grid gap-1.5">
                    <span className="text-sm font-medium text-gray-800">{field.label}</span>
                    {field.type === "textarea" ? (
                      <textarea
                        name={field.name}
                        value={form[field.name]}
                        onChange={handleTextChange}
                        disabled={isSaving}
                        rows={field.name === "flavor_notes" ? 4 : 5}
                        className={`min-h-28 ${textareaClasses}`}
                      />
                    ) : (
                      <input
                        name={field.name}
                        value={form[field.name]}
                        onChange={handleTextChange}
                        disabled={isSaving}
                        className={inputClasses}
                      />
                    )}
                    {field.name === "flavor_notes" ? (
                      <span className="text-xs text-gray-500">
                        Enter one flavor note per line, or separate notes with commas.
                      </span>
                    ) : null}
                  </label>
                ))}

                <label className="flex min-h-11 items-center gap-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={form.is_limited}
                    onChange={handleLimitedChange}
                    disabled={isSaving}
                    className="h-4 w-4 accent-amber-800 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-gray-800">Limited coffee</span>
                </label>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                  href={`/coffee/detail?id=${coffeeBeanId}`}
                  className={buttonClasses.secondary}
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={buttonClasses.primary}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </section>
          </form>
        ) : null}
      </div>
    </main>
  );
}

function toForm(coffeeBean: CoffeeBean): CoffeeBeanForm {
  return {
    brand: coffeeBean.brand ?? "",
    code: coffeeBean.code ?? "",
    roast_level: coffeeBean.roast_level ?? "",
    name: coffeeBean.name ?? "",
    country: coffeeBean.country ?? "",
    name_ja: coffeeBean.name_ja ?? "",
    description_ja: coffeeBean.description_ja ?? "",
    flavor_notes: (coffeeBean.flavor_notes ?? []).join("\n"),
    region: coffeeBean.region ?? "",
    process: coffeeBean.process ?? "",
    variety: coffeeBean.variety ?? "",
    elevation: coffeeBean.elevation ?? "",
    farmer: coffeeBean.farmer ?? "",
    farm: coffeeBean.farm ?? "",
    is_limited: coffeeBean.is_limited ?? false,
  };
}

function toPayload(form: CoffeeBeanForm) {
  return {
    brand: nullableString(form.brand),
    code: nullableString(form.code),
    roast_level: nullableString(form.roast_level),
    name: nullableString(form.name),
    country: nullableString(form.country),
    name_ja: nullableString(form.name_ja),
    description_ja: nullableString(form.description_ja),
    flavor_notes: form.flavor_notes.split(/[\n,]/).map((n) => n.trim()).filter(Boolean),
    region: nullableString(form.region),
    process: nullableString(form.process),
    variety: nullableString(form.variety),
    elevation: nullableString(form.elevation),
    farmer: nullableString(form.farmer),
    farm: nullableString(form.farm),
    is_limited: form.is_limited,
  };
}

