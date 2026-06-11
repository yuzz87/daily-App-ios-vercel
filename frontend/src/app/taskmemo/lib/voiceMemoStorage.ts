import type { VoiceMemo } from "@/app/taskmemo/types/voiceMemo";

const STORAGE_KEY = "voice_memos";

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
    const raw = storage.getItem(STORAGE_KEY); //dataを取り出すmethod
    if (!raw) return [];

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
      STORAGE_KEY,
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
