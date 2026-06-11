"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { API_BASE_URL, apiFetch } from "@/lib/auth";
import type { TastingNote } from "../types";
import {
  formatDate,
  formatValue,
  getErrorMessage,
  nullableString,
} from "../utils";
import {
  buttonClasses,
  inputClasses,
  textareaClasses,
} from "../styles";

type TastingNoteForm = {
  rating: string;
  acidity: string;
  bitterness: string;
  sweetness: string;
  aroma: string;
  body: string;
  memo: string;
  brew_method: string;
  grind_size: string;
  water_temp: string;
  coffee_grams: string;
  water_grams: string;
  brew_time: string;
};

type FieldName = keyof TastingNoteForm;

const emptyForm: TastingNoteForm = {
  rating: "",
  acidity: "",
  bitterness: "",
  sweetness: "",
  aroma: "",
  body: "",
  memo: "",
  brew_method: "",
  grind_size: "",
  water_temp: "",
  coffee_grams: "",
  water_grams: "",
  brew_time: "",
};

const scoreFields: Array<{ name: FieldName; label: string }> = [
  { name: "rating", label: "Rating" },
  { name: "acidity", label: "Acidity" },
  { name: "bitterness", label: "Bitterness" },
  { name: "sweetness", label: "Sweetness" },
  { name: "aroma", label: "Aroma" },
  { name: "body", label: "Body" },
];

const brewFields: Array<{
  name: FieldName;
  label: string;
  inputMode?: "decimal" | "numeric";
  placeholder?: string;
}> = [
  { name: "brew_method", label: "Brew method", placeholder: "V60" },
  { name: "grind_size", label: "Grind size", placeholder: "Medium fine" },
  { name: "water_temp", label: "Water temp", inputMode: "numeric" },
  { name: "coffee_grams", label: "Coffee grams", inputMode: "decimal" },
  { name: "water_grams", label: "Water grams", inputMode: "decimal" },
  { name: "brew_time", label: "Brew time", inputMode: "numeric" },
];

export default function TastingNotesSection({
  coffeeBeanId,
  initialTastingNotes,
}: {
  coffeeBeanId: number;
  initialTastingNotes: TastingNote[];
}) {
  const [tastingNotes, setTastingNotes] = useState(initialTastingNotes);
  const [form, setForm] = useState<TastingNoteForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await apiFetch(
        `${API_BASE_URL}/coffee_beans/${coffeeBeanId}/tasting_notes`,
        {
          method: "POST",
          body: JSON.stringify({
            tasting_note: toPayload(form),
          }),
        }
      );

      if (!res.ok) {
        const message = await getErrorMessage(
          res,
          "味メモの保存に失敗しました。"
        );
        setErrorMessage(message);
        return;
      }

      const createdNote = (await res.json()) as TastingNote;
      setTastingNotes((current) => [createdNote, ...current]);
      setForm(emptyForm);
    } catch {
      setErrorMessage("Rails API に接続できませんでした。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">味メモ</h2>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-5">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {scoreFields.map((field) => (
            <label key={field.name} className="grid gap-1.5">
              <span className="text-sm font-medium text-gray-800">
                {field.label}
              </span>
              <select
                name={field.name}
                value={form[field.name]}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [field.name]: event.target.value,
                  }))
                }
                disabled={isSaving}
                className={inputClasses}
              >
                <option value="">-</option>
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brewFields.map((field) => (
            <label key={field.name} className="grid gap-1.5">
              <span className="text-sm font-medium text-gray-800">
                {field.label}
              </span>
              <input
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                disabled={isSaving}
                inputMode={field.inputMode}
                placeholder={field.placeholder}
                className={inputClasses}
              />
            </label>
          ))}
        </div>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-gray-800">Memo</span>
          <textarea
            name="memo"
            value={form.memo}
            onChange={handleChange}
            disabled={isSaving}
            rows={5}
            className={`min-h-32 ${textareaClasses}`}
          />
        </label>

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={buttonClasses.primary}
          >
            {isSaving ? "保存中..." : "味メモを追加"}
          </button>
        </div>
      </form>

      {tastingNotes.length > 0 ? (
        <div className="mt-6 grid gap-3">
          {tastingNotes.map((note) => (
            <article
              key={note.id}
              className="rounded-md border border-stone-200 bg-stone-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">
                  {note.brew_method || "抽出方法未設定"}
                </h3>
                <span className="text-xs text-gray-500">
                  {formatDate(note.created_at)}
                </span>
              </div>

              {note.memo ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {note.memo}
                </p>
              ) : null}

              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                <NoteMetric label="Rating" value={note.rating} />
                <NoteMetric label="Acidity" value={note.acidity} />
                <NoteMetric label="Bitterness" value={note.bitterness} />
                <NoteMetric label="Sweetness" value={note.sweetness} />
                <NoteMetric label="Aroma" value={note.aroma} />
                <NoteMetric label="Body" value={note.body} />
                <NoteMetric label="Grind" value={note.grind_size} />
                <NoteMetric
                  label="Water temp"
                  value={note.water_temp === null ? null : `${note.water_temp} C`}
                />
                <NoteMetric
                  label="Coffee"
                  value={
                    note.coffee_grams === null ? null : `${note.coffee_grams}g`
                  }
                />
                <NoteMetric
                  label="Water"
                  value={
                    note.water_grams === null ? null : `${note.water_grams}g`
                  }
                />
                <NoteMetric label="Brew time" value={note.brew_time} />
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-gray-600">まだ味メモはありません。</p>
      )}
    </section>
  );
}

function toPayload(form: TastingNoteForm) {
  return {
    rating: nullableNumber(form.rating),
    acidity: nullableNumber(form.acidity),
    bitterness: nullableNumber(form.bitterness),
    sweetness: nullableNumber(form.sweetness),
    aroma: nullableNumber(form.aroma),
    body: nullableNumber(form.body),
    memo: nullableString(form.memo),
    brew_method: nullableString(form.brew_method),
    grind_size: nullableString(form.grind_size),
    water_temp: nullableNumber(form.water_temp),
    coffee_grams: nullableNumber(form.coffee_grams),
    water_grams: nullableNumber(form.water_grams),
    brew_time: nullableNumber(form.brew_time),
  };
}

function nullableNumber(value: string): number | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function NoteMetric({
  label,
  value,
}: {
  label: string;
  value: number | string | null;
}) {
  return (
    <div className="rounded-md bg-white px-3 py-2">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 font-medium text-gray-900">{formatValue(value)}</dd>
    </div>
  );
}
