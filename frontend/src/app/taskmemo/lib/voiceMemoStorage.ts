import type { VoiceMemo } from "@/app/taskmemo/types/voiceMemo";

const STORAGE_KEY = "voice_memos";
const DEMO_STORAGE_KEY = "demo_voice_memos";

//最初の受け取り
type VoiceMemoRecord = {
  id?: unknown;
  title?: unknown;
  transcript?: unknown;
  durationSec?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};
// localStorageからVoiceMemo一覧を取得し、正しいデータだけ整えて返す
export function getVoiceMemos(): VoiceMemo[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(getStorageKey()); //dataを取り出すmethod
    if (!raw) return getFallbackMemos();

    const parsed = JSON.parse(raw); //JSON形式の文字列を JavaScript の値に戻すメソッド
    if (!Array.isArray(parsed)) return [];
    //一個ずつ渡して正しいデータを残す
    return sortVoiceMemos(parsed.map(normalizeVoiceMemo).filter(isVoiceMemo));
  } catch {
    return [];
  }
}
// localStorageにVoiceMemo一覧を保存する
export function saveVoiceMemos(memos: VoiceMemo[]): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    //key,valueで保存
    storage.setItem(
      getStorageKey(),
      JSON.stringify(
        sortVoiceMemos(memos.map(normalizeVoiceMemo).filter(isVoiceMemo)),
      ),
    );
  } catch {
    // 何もしない
  }
}
//新しい VoiceMemo を作成または上書き保存して、保存後の VoiceMemo 一覧を返す
export function createVoiceMemo(memo: VoiceMemo): VoiceMemo[] {
  const normalized = normalizeVoiceMemo(memo);
  if (!normalized) return getVoiceMemos();
  //重複を防ぐ
  const memos = getVoiceMemos().filter(
    (current) => current.id !== normalized.id,
  );
  const nextMemos = sortVoiceMemos([normalized, ...memos]);
  saveVoiceMemos(nextMemos);
  return nextMemos;
}

export function deleteVoiceMemo(id: string): VoiceMemo[] {
  const nextMemos = getVoiceMemos().filter((memo) => memo.id !== id);
  saveVoiceMemos(nextMemos);
  return nextMemos;
}

// localStorageを取得の判別を行う
function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getStorageKey(): string {
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/demo/taskmemo")
  ) {
    return DEMO_STORAGE_KEY;
  }

  return STORAGE_KEY;
}

function getFallbackMemos(): VoiceMemo[] {
  if (
    typeof window === "undefined" ||
    !window.location.pathname.startsWith("/demo/taskmemo")
  ) {
    return [];
  }

  const now = new Date();

  return sortVoiceMemos([
    demoMemo(
      "demo-memo-1",
      "今日やること",
      "Calendar の予定確認。Coffee デモの表示確認。夜に README を整理する。",
      42,
      addMinutes(now, -90),
    ),
    demoMemo(
      "demo-memo-2",
      "コーヒー豆メモ",
      "次はエチオピアの浅煎りを試す。フレーバーは柑橘、紅茶、花の印象。",
      36,
      addMinutes(now, -45),
    ),
    demoMemo(
      "demo-memo-3",
      "アプリ改善アイデア",
      "デモ画面をログインなしで見られるようにする。TaskMemo は通常データと demo データを分ける。",
      58,
      addMinutes(now, -20),
    ),
  ]);
}

function demoMemo(
  id: string,
  title: string,
  transcript: string,
  durationSec: number,
  date: Date,
): VoiceMemo {
  const isoDate = date.toISOString();

  return {
    id,
    title,
    transcript,
    durationSec,
    createdAt: isoDate,
    updatedAt: isoDate,
  };
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function normalizeVoiceMemo(value: unknown): VoiceMemo | null {
  if (!isRecord(value)) return null;

  const record = value as VoiceMemoRecord;
  const id = stringValue(record.id);
  if (!id) return null;

  const createdAt =
    dateStringValue(record.createdAt) ?? new Date().toISOString();
  const updatedAt = dateStringValue(record.updatedAt) ?? createdAt;

  return {
    id,
    title: stringValue(record.title),
    transcript: stringValue(record.transcript),
    durationSec: durationValue(record.durationSec),
    createdAt,
    updatedAt,
  };
}
//updatedAt が新しい順に並び替えた配列を返す
function sortVoiceMemos(memos: VoiceMemo[]): VoiceMemo[] {
  //直接変更しないように先にコピーをする
  return [...memos].sort(
    (a, b) => dateValue(b.updatedAt) - dateValue(a.updatedAt),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isVoiceMemo(value: VoiceMemo | null): value is VoiceMemo {
  return value !== null;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function dateStringValue(value: unknown): string | null {
  if (typeof value !== "string") return null;

  return Number.isNaN(Date.parse(value)) ? null : value;
}

function dateValue(value: string): number {
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function durationValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const duration = Number(value);
  return Number.isFinite(duration) && duration >= 0 ? duration : null;
}
