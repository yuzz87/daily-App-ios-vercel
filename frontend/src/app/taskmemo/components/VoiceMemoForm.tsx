"use client";

import type { FormEvent } from "react";

export type VoiceMemoFormValue = {
  title: string;
  transcript: string;
};

export type VoiceMemoFormField = keyof VoiceMemoFormValue;

type VoiceMemoFormProps = {
  value: VoiceMemoFormValue;
  disabled: boolean;
  showTitle?: boolean;
  onChange: (field: VoiceMemoFormField, value: string) => void;
  onSubmit: () => void;
};

export function VoiceMemoForm({
  value,
  disabled,
  showTitle = true,
  onChange,
  onSubmit,
}: VoiceMemoFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="grid gap-4 p-4">
        <label className="grid gap-1.5">
          <span className="pb-2 text-center text-2xl font-bold border-b border-black/20">
            新規
          </span>
        </label>
        {showTitle ? (
          <label className="grid gap-1.5">
            <span className="text-center text-sm font-medium text-gray-800">
              Title
            </span>
            <input
              name="title"
              value={value.title}
              onChange={(event) => onChange("title", event.target.value)}
              className="min-h-11 rounded-md border border-black/40 px-3 text-center text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </label>
        ) : null}

        <label className="grid gap-1.5">
          <span className="text-center text-sm font-medium text-gray-800">
            文字起こし
          </span>
          <textarea
            name="transcript"
            value={value.transcript}
            onChange={(event) => onChange("transcript", event.target.value)}
            rows={6}
            className="min-h-60 resize-y rounded-md border border-black/40 px-3 py-3 text-center text-sm leading-6 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />
        </label>
      </div>
    </form>
  );
}
