"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { API_BASE_URL, apiFetch } from "@/lib/auth";

type CoffeeBeanAnalyzeResult = {
  brand: string | null;
  code: string | null;
  country: string | null;
  description_ja: string | null;
  elevation: string | null;
  farm: string | null;
  farmer: string | null;
  flavor_notes: string[];
  is_limited: boolean;
  name: string | null;
  name_ja: string | null;
  process: string | null;
  raw_text: string | null;
  region: string | null;
  roast_level: string | null;
  status: "draft";
  variety: string | null;
};

const resultFields: Array<{
  key: keyof CoffeeBeanAnalyzeResult;
  label: string;
}> = [
  { key: "brand", label: "Brand" },
  { key: "code", label: "Code" },
  { key: "name", label: "Name" },
  { key: "name_ja", label: "Japanese name" },
  { key: "country", label: "Country" },
  { key: "region", label: "Region" },
  { key: "process", label: "Process" },
  { key: "roast_level", label: "Roast level" },
  { key: "variety", label: "Variety" },
  { key: "elevation", label: "Elevation" },
  { key: "farmer", label: "Farmer" },
  { key: "farm", label: "Farm" },
  { key: "description_ja", label: "Description" },
  { key: "raw_text", label: "Raw text" },
];

export default function NewCoffeePage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<CoffeeBeanAnalyzeResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    setResult(null);
    setSelectedImage(file);
    setPreviewUrl(nextPreviewUrl);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedImage) {
      setErrorMessage("Select a coffee package image.");
      return;
    }

    await analyzeWithMastra(selectedImage);
  }

  async function analyzeWithMastra(image: File) {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", image);

      const res = await fetch("/api/coffee/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const message = await getErrorMessage(res, "Mastra image analysis failed.");
        setErrorMessage(message);
        return;
      }

      const data = (await res.json()) as { coffee_bean?: CoffeeBeanAnalyzeResult };
      if (!data.coffee_bean) {
        setErrorMessage("The Mastra response did not include coffee bean data.");
        return;
      }

      setResult(data.coffee_bean);
    } catch {
      setErrorMessage("Could not connect to the Mastra analysis API.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSaveMastraResult() {
    if (!result || !selectedImage) {
      setErrorMessage("Analyze an image before saving.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const formData = buildCreateFormData(result, selectedImage);
      const res = await apiFetch(`${API_BASE_URL}/coffee_beans`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to save the coffee bean.");
        setErrorMessage(message);
        return;
      }

      const data = (await res.json()) as { id?: number };
      if (typeof data.id === "number") {
        router.push(`/coffee/edit?id=${data.id}`);
        return;
      }

      router.push("/coffee");
    } catch {
      setErrorMessage("Could not connect to the Rails API.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="h-full overflow-y-auto bg-stone-50 px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-6">
        <header className="border-b border-stone-200 pb-5">
          <Link
            href="/coffee"
            className="text-sm font-medium text-amber-800 transition hover:text-amber-950"
          >
            Back to coffee records
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">Register coffee package</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Choose the extraction method, upload a package image, and review the result before saving.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
            <label htmlFor="coffee-image" className="block text-sm font-semibold text-gray-900">
              Package image
            </label>
            <p className="mt-1 text-sm text-gray-600">
              JPEG, PNG, and WebP images are supported.
            </p>

            <input
              id="coffee-image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handleImageChange}
              disabled={isAnalyzing || isSaving}
              className="mt-4 block w-full rounded-md border border-stone-300 bg-white text-sm text-gray-900 file:mr-4 file:min-h-11 file:border-0 file:bg-amber-800 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {previewUrl ? (
              <div className="mt-5 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                <Image
                  src={previewUrl}
                  alt="Selected coffee package preview"
                  width={960}
                  height={720}
                  className="h-auto max-h-[60vh] w-full object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="mt-5 flex min-h-64 items-center justify-center rounded-md border border-dashed border-stone-300 bg-stone-100 px-4 text-center text-sm text-gray-500">
                Select an image to preview it here.
              </div>
            )}
          </section>

          {errorMessage ? (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {result ? (
            <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Mastra analysis result</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Save the result to create a draft, then confirm the fields on the edit screen.
                  </p>
                </div>
                <span className="w-fit rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                  {result.status}
                </span>
              </div>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {resultFields.map((field) => (
                  <div key={field.key} className="rounded-md border border-stone-200 bg-stone-50 p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {field.label}
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                      {formatResultValue(result[field.key])}
                    </dd>
                  </div>
                ))}
                <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Flavor notes
                  </dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {result.flavor_notes.length > 0 ? (
                      result.flavor_notes.map((note) => (
                        <span
                          key={note}
                          className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-950"
                        >
                          {note}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </dd>
                </div>
                <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Limited coffee
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {result.is_limited ? "Yes" : "No"}
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/coffee"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-stone-300 px-4 text-sm font-semibold text-gray-700 transition hover:bg-white"
            >
              Cancel
            </Link>
            {result ? (
              <button
                type="button"
                onClick={handleSaveMastraResult}
                disabled={isSaving || isAnalyzing}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-amber-800 px-4 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
              >
                {isSaving ? "Saving..." : "Save Mastra result"}
              </button>
            ) : (
              <button
                type="submit"
                disabled={!selectedImage || isAnalyzing || isSaving}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-amber-800 px-4 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze with Mastra"}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

function buildCreateFormData(result: CoffeeBeanAnalyzeResult, image: File): FormData {
  const formData = new FormData();
  formData.append("image", image);

  Object.entries(result).forEach(([key, value]) => {
    if (key === "flavor_notes") {
      result.flavor_notes.forEach((note) => formData.append("coffee_bean[flavor_notes][]", note));
      return;
    }

    if (value === null || value === undefined) return;
    formData.append(`coffee_bean[${key}]`, String(value));
  });

  return formData;
}

function formatResultValue(value: CoffeeBeanAnalyzeResult[keyof CoffeeBeanAnalyzeResult]): string {
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value || "-";
}

async function getErrorMessage(res: Response, fallbackMessage: string): Promise<string> {
  try {
    const data = await res.json();

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.join("\n");
    }

    if (typeof data.error === "string") {
      return data.error;
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
}
