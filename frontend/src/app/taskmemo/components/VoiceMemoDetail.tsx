"use client";

import type { KeyboardEvent } from "react";
import type { VoiceMemo } from "@/app/taskmemo/types/voiceMemo";

type VoiceMemoDetailProps = {
  memo: VoiceMemo;
  titleValue: string;
  disabled: boolean;
  onTitleChange: (value: string) => void;
  onTitleCommit: () => void;
  onDelete: () => void;
};

export function VoiceMemoDetail({
  memo,
  titleValue,
  disabled,
  onTitleChange,
  onTitleCommit,
  onDelete,
}: VoiceMemoDetailProps) {
  function handleTitleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  return (
    <section className="min-h-0 overflow-y-auto rounded-md border border-blue-200 bg-blue-50 shadow-sm">
      <div className="border-b border-gray-200 p-4">
        <label className="grid gap-1.5">
          <span className="mb-3 pb-2 border-b border-gray-300 text-center text-2xl font-bold">
            編集
          </span>
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <input
              name="title"
              value={titleValue}
              onChange={(event) => onTitleChange(event.target.value)}
              onBlur={onTitleCommit}
              onKeyDown={handleTitleKeyDown}
              disabled={disabled}
              placeholder="タイトル"
              aria-label="タイトル"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-lg font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="mt-4 text-sm text-gray-600">
              日付：{formatDateTime(memo.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled}
            className="min-h-10 shrink-0 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-4">
        <div className="grid gap-1.5">
          <span className="text-center font-bold text-gray-800">
            文字起こし
          </span>
          <p className="min-h-36 whitespace-pre-wrap rounded-md border border-gray-300 bg-white px-3 py-3 text-center text-sm leading-6 text-gray-900">
            {memo.transcript || "（文字起こしはありません）"}
          </p>
        </div>
      </div>
    </section>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
