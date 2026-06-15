"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { API_BASE_URL, apiFetch } from "@/lib/auth";
import { buttonClasses } from "../styles";
import {
  createDemoCoffeeBeanFromAnalysis,
  demoAnalyzeResult,
  isDemoCoffeePath,
  type CoffeeBeanAnalyzeResult,
} from "../demoCoffeeStore";

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
  const pathname = usePathname();
  const isDemo = isDemoCoffeePath(pathname);
  const basePath = isDemo ? "/demo/coffee" : "/coffee";
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

    if (!selectedImage && !isDemo) {
      setErrorMessage("Select a coffee package image.");
      return;
    }

    await analyzeWithMastra(selectedImage);
  }

  async function analyzeWithMastra(image: File | null) {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setResult(null);

    try {
      if (isDemo) {
        setResult(demoAnalyzeResult);
        return;
      }

      if (!image) {
        setErrorMessage("Select a coffee package image.");
        return;
      }

      const formData = new FormData();
      formData.append("image", image);

      const res = await fetch("/api/coffee/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const message = await getErrorMessage(
          res,
          "Mastra image analysis failed.",
        );
        setErrorMessage(message);
        return;
      }

      const data = (await res.json()) as {
        coffee_bean?: CoffeeBeanAnalyzeResult;
      };
      if (!data.coffee_bean) {
        setErrorMessage(
          "The Mastra response did not include coffee bean data.",
        );
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
    if (!result || (!selectedImage && !isDemo)) {
      setErrorMessage("Analyze an image before saving.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (isDemo) {
        createDemoCoffeeBeanFromAnalysis(result);
        router.push(basePath);
        return;
      }

      if (!selectedImage) {
        setErrorMessage("Analyze an image before saving.");
        return;
      }

      const formData = buildCreateFormData(result, selectedImage);
      const res = await apiFetch(`${API_BASE_URL}/coffee_beans`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const message = await getErrorMessage(
          res,
          "Failed to save the coffee bean.",
        );
        setErrorMessage(message);
        return;
      }

      router.push(basePath);
    } catch {
      setErrorMessage("Could not connect to the Rails API.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="h-full overflow-y-auto bg-teal-100/80 px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 pb-6">
        <header className="flex flex-col gap-3 border-b border-gray-500 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href={basePath} className={buttonClasses.coffeeButton}>
            Back
          </Link>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link href={basePath} className={buttonClasses.cancelButton}>
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
                form="coffee-form"
                disabled={
                  (!isDemo && !selectedImage) || isAnalyzing || isSaving
                }
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-amber-800 px-4 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze with Mastra"}
              </button>
            )}
          </div>
        </header>

        <form
          id="coffee-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="flex min-w-0 items-center gap-3">
                <label
                  htmlFor="coffee-image"
                  className={buttonClasses.fileButton}
                >
                  画像を選択
                </label>

                <input
                  id="coffee-image"
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={handleImageChange}
                  disabled={isAnalyzing || isSaving}
                  className="sr-only"
                />
              </div>

              {previewUrl ? (
                <div className="h-90 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    width={360}
                    height={360}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                </div>
              ) : null}
            </div>
          </section>

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {errorMessage}
            </div>
          ) : null}

          {result ? (
            <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Mastra analysis result
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Save the result to register this coffee bean.
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {resultFields.map((field) => (
                  <div
                    key={field.key}
                    className="rounded-md border border-stone-200 bg-stone-50 p-3"
                  >
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
        </form>
      </div>
    </main>
  );
}

function buildCreateFormData(
  result: CoffeeBeanAnalyzeResult,
  image: File,
): FormData {
  const formData = new FormData();
  formData.append("image", image);

  Object.entries(result).forEach(([key, value]) => {
    if (key === "flavor_notes") {
      result.flavor_notes.forEach((note) =>
        formData.append("coffee_bean[flavor_notes][]", note),
      );
      return;
    }

    if (value === null || value === undefined) return;
    formData.append(`coffee_bean[${key}]`, String(value));
  });

  return formData;
}

function formatResultValue(
  value: CoffeeBeanAnalyzeResult[keyof CoffeeBeanAnalyzeResult],
): string {
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value || "-";
}

async function getErrorMessage(
  res: Response,
  fallbackMessage: string,
): Promise<string> {
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
