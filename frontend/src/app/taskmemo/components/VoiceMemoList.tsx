"use client";

import type { VoiceMemo } from "@/app/taskmemo/types/voiceMemo";

type VoiceMemoListProps = {
  memos: VoiceMemo[];
  selectedId: string | null;
  disabled: boolean;
  onSelectMemo: (memo: VoiceMemo) => void;
};

export function VoiceMemoList({
  memos,
  selectedId,
  disabled,
  onSelectMemo,
}: VoiceMemoListProps) {
  return (
    <aside
      aria-label="Voice memo list"
      className="grid min-h-0 content-start gap-2 overflow-y-auto rounded-md border border-gray-200 bg-white p-3 shadow-sm"
    >
      {memos.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 p-4 text-sm leading-6 text-gray-600">
          No memos yet.
        </div>
      ) : (
        memos.map((memo) => {
          const selected = memo.id === selectedId;

          return (
            <button
              key={memo.id}
              type="button"
              onClick={() => onSelectMemo(memo)}
              disabled={disabled}
              className={`mx-auto w-[350px] rounded-md border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? "border-teal-600 bg-teal-50"
                  : "border-gray-200 bg-white hover:border-gray-400"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="line-clamp-2 text-sm font-semibold text-gray-950">
                  {memo.title || "Untitled memo"}
                </h2>
              </div>

              <p className="mt-1 text-xs text-gray-500">
                Updated {formatDateTime(memo.updatedAt)}
              </p>

              {memo.transcript ? (
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-700">
                  {memo.transcript}
                </p>
              ) : null}
            </button>
          );
        })
      )}
    </aside>
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
