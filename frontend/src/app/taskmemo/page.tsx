"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/auth";

type RecordingState = "idle" | "recording" | "stopping";
type SyncStatus = "local" | "pending" | "synced" | "error";

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: { isFinal: boolean; [index: number]: { transcript: string } };
  };
}

type VoiceMemo = {
  id: string;
  serverId?: number;
  title: string;
  memo: string;
  tags: string[];
  audio?: Blob;
  audioUrl?: string;
  mimeType: string;
  durationMs: number | null;
  transcript: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
};

type ServerVoiceMemo = {
  id: number;
  client_uuid: string;
  title: string;
  memo: string | null;
  tags: string[];
  audio_url: string;
  mime_type: string;
  duration_ms: number | null;
  transcript: string | null;
  created_at: string;
  updated_at: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const DB_NAME = "taskmemo_voice_memos";
const DB_VERSION = 1;
const STORE_NAME = "voice_memos";

const AUDIO_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
];

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function openVoiceMemoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("このブラウザは端末内保存に対応していません。"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
        store.createIndex("createdAt", "createdAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getLocalVoiceMemos(): Promise<VoiceMemo[]> {
  const db = await openVoiceMemoDb();
  try {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const records = await requestToPromise<VoiceMemo[]>(
      transaction.objectStore(STORE_NAME).getAll(),
    );
    return sortVoiceMemos(
      records.map((memo) => ({
        ...memo,
        tags: memo.tags ?? [],
        transcript: memo.transcript ?? "",
        syncStatus: memo.syncStatus ?? (memo.serverId ? "synced" : "local"),
      })),
    );
  } finally {
    db.close();
  }
}

async function putLocalVoiceMemo(memo: VoiceMemo): Promise<void> {
  const db = await openVoiceMemoDb();
  try {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(memo);
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

async function removeLocalVoiceMemo(id: string): Promise<void> {
  const db = await openVoiceMemoDb();
  try {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${new Date().getTime()}-${Math.random().toString(36).slice(2)}`;
}

function selectSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return AUDIO_MIME_CANDIDATES.find((mimeType) =>
    MediaRecorder.isTypeSupported(mimeType),
  );
}

function parseTags(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, tags) => tags.indexOf(tag) === index);
}

function sortVoiceMemos(records: VoiceMemo[]): VoiceMemo[] {
  return [...records].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function mergeVoiceMemos(local: VoiceMemo[], remote: VoiceMemo[]): VoiceMemo[] {
  const byId = new Map<string, VoiceMemo>();

  // 未同期のメモだけ残す（syncedでサーバーにないものは別デバイスで削除済み）
  local
    .filter((memo) => memo.syncStatus !== "synced")
    .forEach((memo) => byId.set(memo.id, memo));

  remote.forEach((serverMemo) => {
    const localMemo = local.find((m) => m.id === serverMemo.id);
    byId.set(serverMemo.id, {
      ...serverMemo,
      audio: localMemo?.audio,
      syncStatus: "synced",
    });
  });

  return sortVoiceMemos([...byId.values()]);
}

function formatDuration(durationMs: number | null): string {
  if (durationMs === null) return "--:--";

  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function createDefaultTitle(date: Date): string {
  return `録音 ${new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)}`;
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

function downloadFileName(memo: VoiceMemo): string {
  const baseName = memo.title.trim().replace(/[\\/:*?"<>|]/g, "_") || "voice";
  return `${baseName}.${extensionForMimeType(memo.mimeType)}`;
}

function apiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL が設定されていません。");
  }
  return `${API_BASE_URL}${path}`;
}

function resolveAudioUrl(audioUrl: string | undefined): string | null {
  if (!audioUrl) return null;
  if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
    return audioUrl;
  }
  if (!API_BASE_URL) return audioUrl;

  const apiOrigin = new URL(API_BASE_URL).origin;
  return `${apiOrigin}${audioUrl}`;
}

function serverToVoiceMemo(serverMemo: ServerVoiceMemo): VoiceMemo {
  return {
    id: serverMemo.client_uuid,
    serverId: serverMemo.id,
    title: serverMemo.title,
    memo: serverMemo.memo ?? "",
    tags: serverMemo.tags ?? [],
    audioUrl: resolveAudioUrl(serverMemo.audio_url) ?? undefined,
    mimeType: serverMemo.mime_type,
    durationMs: serverMemo.duration_ms,
    transcript: serverMemo.transcript ?? "",
    createdAt: serverMemo.created_at,
    updatedAt: serverMemo.updated_at,
    syncStatus: "synced",
  };
}

async function fetchServerVoiceMemos(): Promise<VoiceMemo[]> {
  const response = await apiFetch(apiUrl("/voice_memos"), { cache: "no-store" });
  if (!response.ok) {
    throw new Error("同期済みメモを取得できませんでした。");
  }

  const records = (await response.json()) as ServerVoiceMemo[];
  return records.map(serverToVoiceMemo);
}

async function createServerVoiceMemo(memo: VoiceMemo): Promise<VoiceMemo> {
  if (!memo.audio) {
    throw new Error("同期する音声データがありません。");
  }

  const formData = new FormData();
  formData.append("client_uuid", memo.id);
  formData.append("title", memo.title);
  formData.append("memo", memo.memo);
  formData.append("tags", JSON.stringify(memo.tags));
  formData.append("mime_type", memo.mimeType);
  formData.append("duration_ms", String(memo.durationMs ?? ""));
  formData.append("transcript", memo.transcript);
  formData.append("audio", memo.audio, downloadFileName(memo));

  const response = await apiFetch(apiUrl("/voice_memos"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("ボイスメモをサーバーへ同期できませんでした。");
  }

  return {
    ...serverToVoiceMemo((await response.json()) as ServerVoiceMemo),
    audio: memo.audio,
  };
}

async function updateServerVoiceMemo(memo: VoiceMemo): Promise<VoiceMemo> {
  if (!memo.serverId) {
    return createServerVoiceMemo(memo);
  }

  const response = await apiFetch(apiUrl(`/voice_memos/${memo.serverId}`), {
    method: "PATCH",
    body: JSON.stringify({
      voice_memo: {
        title: memo.title,
        memo: memo.memo,
        tags: memo.tags,
        duration_ms: memo.durationMs,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("ボイスメモの更新を同期できませんでした。");
  }

  return {
    ...serverToVoiceMemo((await response.json()) as ServerVoiceMemo),
    audio: memo.audio,
  };
}

async function deleteServerVoiceMemo(memo: VoiceMemo): Promise<void> {
  if (!memo.serverId) return;

  const response = await apiFetch(apiUrl(`/voice_memos/${memo.serverId}`), {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("サーバー上のボイスメモを削除できませんでした。");
  }
}

type MemoDetailProps = {
  memo: VoiceMemo;
  onSave: (memo: VoiceMemo) => Promise<void>;
  onDelete: (memo: VoiceMemo) => Promise<void>;
};

function MemoDetail({ memo, onSave, onDelete }: MemoDetailProps) {
  const [title, setTitle] = useState(memo.title);
  const [memoText, setMemoText] = useState(memo.memo);
  const [tagsText, setTagsText] = useState(memo.tags.join(", "));
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (memo.audio) {
      const url = URL.createObjectURL(memo.audio);
      const timeoutId = window.setTimeout(() => setLocalAudioUrl(url), 0);
      return () => {
        window.clearTimeout(timeoutId);
        URL.revokeObjectURL(url);
      };
    }

    if (!memo.audioUrl) {
      const timeoutId = window.setTimeout(() => setLocalAudioUrl(null), 0);
      return () => window.clearTimeout(timeoutId);
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    apiFetch(memo.audioUrl)
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setLocalAudioUrl(objectUrl);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [memo.audio, memo.audioUrl]);

  const audioSource = localAudioUrl;

  async function handleSave() {
    await onSave({
      ...memo,
      title: title.trim() || "無題の録音",
      memo: memoText.trim(),
      tags: parseTags(tagsText),
      updatedAt: new Date().toISOString(),
      syncStatus: API_BASE_URL ? "pending" : "local",
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">選択中のメモ</p>
            <p className="mt-1 text-xs text-gray-500">
              作成 {formatDateTime(memo.createdAt)} / 更新{" "}
              {formatDateTime(memo.updatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {audioSource && (
              <a
                href={audioSource}
                download={downloadFileName(memo)}
                className="inline-flex h-10 items-center rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                音声を保存
              </a>
            )}
            <button
              type="button"
              onClick={() => onDelete(memo)}
              className="h-10 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              削除
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 p-4">
        {audioSource ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <audio
              src={audioSource}
              controls
              className="h-10 w-full"
              preload="metadata"
            >
              音声を再生できません。
            </audio>
            <p className="mt-2 text-xs text-gray-500">
              長さ {formatDuration(memo.durationMs)} / 形式 {memo.mimeType}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            音声 URL がありません。同期前の端末内データが失われた可能性があります。
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-gray-800">文字起こし</p>
          {memo.transcript ? (
            <div className="mt-2 rounded-md bg-gray-50 p-3 text-sm leading-6 text-gray-800 whitespace-pre-wrap border border-gray-200">
              {memo.transcript}
            </div>
          ) : (
            <p className="mt-2 text-xs leading-5 text-gray-500">
              文字起こしなし（Chrome または Edge で録音すると自動生成されます）
            </p>
          )}
        </div>

        <label className="block text-sm font-medium text-gray-800">
          タイトル
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />
        </label>

        <label className="block text-sm font-medium text-gray-800">
          タグ
          <input
            value={tagsText}
            onChange={(event) => setTagsText(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            placeholder="仕事, アイデア, 買い物"
          />
        </label>

        <label className="block text-sm font-medium text-gray-800">
          メモ本文
          <textarea
            value={memoText}
            onChange={(event) => setMemoText(event.target.value)}
            className="mt-2 min-h-48 w-full resize-y rounded-md border border-gray-300 px-3 py-3 text-sm leading-6 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            placeholder="録音内容の要約、次にやること、思いついたことを入力できます。"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-gray-600">
          保存すると、API 設定がある場合はサーバーにも同期されます。
        </p>
        <button
          type="button"
          onClick={handleSave}
          className="h-11 rounded-md bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          保存して同期
        </button>
      </div>
    </div>
  );
}

export default function TaskMemoPage() {
  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingState, setRecordingState] =
    useState<RecordingState>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [recordingSupported, setRecordingSupported] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const chunksRef = useRef<BlobPart[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef<string>("");

  const selectedMemo = useMemo(
    () => memos.find((memo) => memo.id === selectedId) ?? null,
    [memos, selectedId],
  );

  const filteredMemos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return memos;

    return memos.filter((memo) => {
      const searchable = [
        memo.title,
        memo.memo,
        memo.tags.join(" "),
        formatDateTime(memo.createdAt),
        memo.syncStatus,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [memos, searchQuery]);

  useEffect(() => {
    const canRecord =
      typeof window !== "undefined" &&
      typeof MediaRecorder !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia);
    const timeoutId = window.setTimeout(() => {
      setRecordingSupported(canRecord);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadMemos() {
      try {
        const localRecords = await getLocalVoiceMemos();
        if (ignore) return;
        setMemos(localRecords);
        setSelectedId((current) => current ?? localRecords[0]?.id ?? null);

        if (API_BASE_URL) {
          await syncRecords(localRecords);
        }
      } catch (error) {
        if (ignore) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "保存済みメモを読み込めませんでした。",
        );
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadMemos();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      recognitionRef.current?.stop();
    };
  }, []);

  async function syncRecords(sourceRecords = memos) {
    if (!API_BASE_URL) {
      setErrorMessage("NEXT_PUBLIC_API_BASE_URL が設定されていません。");
      return;
    }

    setIsSyncing(true);
    setErrorMessage(null);

    try {
      const uploadedRecords: VoiceMemo[] = [];
      for (const memo of sourceRecords) {
        if (
          (memo.syncStatus === "pending" ||
            memo.syncStatus === "error" ||
            memo.syncStatus === "local") &&
          memo.audio
        ) {
          const syncedMemo = await createServerVoiceMemo(memo);
          await putLocalVoiceMemo(syncedMemo);
          uploadedRecords.push(syncedMemo);
        }
      }

      const remoteRecords = await fetchServerVoiceMemos();
      const merged = mergeVoiceMemos(
        sourceRecords.map(
          (memo) =>
            uploadedRecords.find((uploaded) => uploaded.id === memo.id) ?? memo,
        ),
        remoteRecords,
      );

      const mergedIds = new Set(merged.map((m) => m.id));
      const removedLocally = sourceRecords.filter((m) => !mergedIds.has(m.id));
      await Promise.all([
        ...removedLocally.map((m) => removeLocalVoiceMemo(m.id)),
        ...merged.map((m) => putLocalVoiceMemo(m)),
      ]);
      setMemos(merged);
      setSelectedId((current) => current ?? merged[0]?.id ?? null);
      setLastSyncedAt(new Date().toISOString());
      setStatusMessage("同期しました。");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "同期に失敗しました。",
      );
    } finally {
      setIsSyncing(false);
    }
  }

  async function startRecording() {
    setErrorMessage(null);
    setStatusMessage(null);

    if (!recordingSupported) {
      setErrorMessage(
        "このブラウザでは録音を開始できません。Safari / Edge / Chrome の最新版で試してください。",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = selectSupportedMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      const startedAt = new Date().getTime();

      chunksRef.current = [];
      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      startedAtRef.current = startedAt;
      setElapsedMs(0);
      setRecordingState("recording");

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setErrorMessage("録音中にエラーが発生しました。");
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        stopActiveStream();
        setRecordingState("idle");
      };

      recorder.onstop = async () => {
        const stoppedAt = new Date().getTime();
        const recordingStartedAt = startedAtRef.current ?? stoppedAt;
        const durationMs = stoppedAt - recordingStartedAt;
        const recordedMimeType = recorder.mimeType || mimeType || "audio/webm";
        const audio = new Blob(chunksRef.current, { type: recordedMimeType });

        stopActiveStream();
        clearRecordingTimer();

        if (audio.size === 0) {
          setRecordingState("idle");
          setErrorMessage("音声データを取得できませんでした。もう一度録音してください。");
          return;
        }

        const now = new Date();
        const newMemo: VoiceMemo = {
          id: createId(),
          title: createDefaultTitle(now),
          memo: "",
          tags: [],
          audio,
          mimeType: recordedMimeType,
          durationMs,
          transcript: transcriptRef.current,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          syncStatus: API_BASE_URL ? "pending" : "local",
        };

        try {
          await putLocalVoiceMemo(newMemo);
          setMemos((current) => [newMemo, ...current]);
          setSelectedId(newMemo.id);
          setStatusMessage(
            API_BASE_URL
              ? "録音を保存しました。同期を開始します。"
              : "録音を端末内に保存しました。",
          );
          if (API_BASE_URL) {
            const syncedMemo = await createServerVoiceMemo(newMemo);
            await putLocalVoiceMemo(syncedMemo);
            setMemos((current) =>
              sortVoiceMemos(
                current.map((memo) =>
                  memo.id === syncedMemo.id ? syncedMemo : memo,
                ),
              ),
            );
            setLastSyncedAt(new Date().toISOString());
            setStatusMessage("録音を保存して同期しました。");
          }
        } catch (error) {
          const failedMemo = { ...newMemo, syncStatus: "error" as const };
          await putLocalVoiceMemo(failedMemo);
          setMemos((current) =>
            current.map((memo) => (memo.id === failedMemo.id ? failedMemo : memo)),
          );
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "録音の保存または同期に失敗しました。",
          );
        } finally {
          setRecordingState("idle");
          setElapsedMs(0);
          chunksRef.current = [];
          mediaRecorderRef.current = null;
          startedAtRef.current = null;
        }
      };

      recorder.start(1000);
      timerRef.current = window.setInterval(() => {
        if (startedAtRef.current !== null) {
          setElapsedMs(new Date().getTime() - startedAtRef.current);
        }
      }, 250);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Recognizer = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (Recognizer) {
          transcriptRef.current = "";
          const recognition: SpeechRecognitionInstance = new Recognizer();
          recognition.lang = "ja-JP";
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.onresult = (event: SpeechRecognitionResultEvent) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                transcriptRef.current += event.results[i][0].transcript;
              }
            }
          };
          recognition.onerror = () => {};
          recognitionRef.current = recognition;
          recognition.start();
        }
      } catch {
        // SpeechRecognition is optional; silently ignore
      }
    } catch (error) {
      setRecordingState("idle");
      stopActiveStream();
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "マイクの使用を許可できませんでした。",
      );
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    setRecordingState("stopping");
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    recorder.stop();
  }

  function clearRecordingTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopActiveStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function saveMemo(updatedMemo: VoiceMemo) {
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await putLocalVoiceMemo(updatedMemo);
      setMemos((current) =>
        sortVoiceMemos(
          current.map((memo) =>
            memo.id === updatedMemo.id ? updatedMemo : memo,
          ),
        ),
      );

      if (API_BASE_URL) {
        const syncedMemo = await updateServerVoiceMemo(updatedMemo);
        await putLocalVoiceMemo(syncedMemo);
        setMemos((current) =>
          sortVoiceMemos(
            current.map((memo) =>
              memo.id === syncedMemo.id ? syncedMemo : memo,
            ),
          ),
        );
        setLastSyncedAt(new Date().toISOString());
        setStatusMessage("メモを保存して同期しました。");
      } else {
        setStatusMessage("メモを端末内に保存しました。");
      }
    } catch (error) {
      const failedMemo = { ...updatedMemo, syncStatus: "error" as const };
      await putLocalVoiceMemo(failedMemo);
      setMemos((current) =>
        current.map((memo) => (memo.id === failedMemo.id ? failedMemo : memo)),
      );
      setErrorMessage(
        error instanceof Error ? error.message : "メモを保存できませんでした。",
      );
    }
  }

  async function deleteMemo(memoToDelete: VoiceMemo) {
    const confirmed = window.confirm("このボイスメモを削除しますか？");
    if (!confirmed) return;

    setErrorMessage(null);
    setStatusMessage(null);

    try {
      if (API_BASE_URL) {
        await deleteServerVoiceMemo(memoToDelete);
      }
      await removeLocalVoiceMemo(memoToDelete.id);
      setMemos((current) => {
        const nextMemos = current.filter((memo) => memo.id !== memoToDelete.id);
        setSelectedId(nextMemos[0]?.id ?? null);
        return nextMemos;
      });
      setStatusMessage("メモを削除しました。");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "メモを削除できませんでした。",
      );
    }
  }

  return (
    <main className="h-full overflow-y-auto bg-[#f7f6f1] px-4 py-5 text-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <header className="flex flex-col gap-3 border-b border-gray-300 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Synced Voice Notes
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-gray-950">
              ボイスメモ
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700">
              録音は端末内に保存し、API が設定されている場合は Rails
              にも同期します。同じ API を使う端末間でメモを共有できます。
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-900">
              {API_BASE_URL ? "同期: 有効" : "同期: API 未設定"}
            </div>
            {lastSyncedAt && (
              <p className="text-xs text-gray-500">
                最終同期 {formatDateTime(lastSyncedAt)}
              </p>
            )}
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <aside className="flex min-h-[520px] flex-col rounded-lg border border-gray-300 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-4">
              <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      新規録音
                    </p>
                    <p className="mt-1 font-mono text-3xl font-semibold text-gray-950">
                      {formatDuration(elapsedMs)}
                    </p>
                  </div>
                  {recordingState === "recording" ? (
                    <span className="h-3 w-3 rounded-full bg-red-600 shadow-[0_0_0_6px_rgba(220,38,38,0.16)]" />
                  ) : (
                    <span className="h-3 w-3 rounded-full bg-gray-300" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={
                    recordingState === "recording"
                      ? stopRecording
                      : startRecording
                  }
                  disabled={recordingState === "stopping"}
                  className={`mt-4 h-12 w-full rounded-md px-4 text-sm font-semibold transition ${
                    recordingState === "recording"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gray-950 text-white hover:bg-gray-800"
                  } disabled:cursor-not-allowed disabled:bg-gray-400`}
                >
                  {recordingState === "recording"
                    ? "録音を停止"
                    : recordingState === "stopping"
                      ? "保存中..."
                      : "録音を開始"}
                </button>

                <button
                  type="button"
                  onClick={() => syncRecords()}
                  disabled={!API_BASE_URL || isSyncing}
                  className="mt-3 h-10 w-full rounded-md border border-teal-300 px-4 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                >
                  {isSyncing ? "同期中..." : "今すぐ同期"}
                </button>

                {!recordingSupported && (
                  <p className="mt-3 text-xs leading-5 text-amber-800">
                    このブラウザでは録音機能を利用できない可能性があります。
                    iOS は Safari、Windows は Edge または Chrome
                    の最新版で確認してください。
                  </p>
                )}
              </div>

              <label className="mt-4 block text-sm font-medium text-gray-800">
                検索
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  placeholder="タイトル、本文、タグ"
                  type="search"
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {isLoading ? (
                <p className="px-2 py-6 text-sm text-gray-600">
                  読み込み中です。
                </p>
              ) : filteredMemos.length === 0 ? (
                <p className="px-2 py-6 text-sm leading-6 text-gray-600">
                  まだボイスメモがありません。録音を開始すると、この一覧に保存されます。
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredMemos.map((memo) => {
                    const selected = memo.id === selectedId;
                    return (
                      <button
                        key={memo.id}
                        type="button"
                        onClick={() => setSelectedId(memo.id)}
                        className={`w-full rounded-md border p-3 text-left transition ${
                          selected
                            ? "border-teal-600 bg-teal-50"
                            : "border-gray-200 bg-white hover:border-gray-400"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="line-clamp-2 text-sm font-semibold text-gray-950">
                            {memo.title}
                          </p>
                          <span className="shrink-0 font-mono text-xs text-gray-500">
                            {formatDuration(memo.durationMs)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="text-xs text-gray-500">
                            {formatDateTime(memo.updatedAt)}
                          </p>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[11px] ${
                              memo.syncStatus === "synced"
                                ? "bg-teal-50 text-teal-800"
                                : memo.syncStatus === "error"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            {memo.syncStatus === "synced"
                              ? "同期済み"
                              : memo.syncStatus === "error"
                                ? "同期失敗"
                                : "未同期"}
                          </span>
                        </div>
                        {memo.memo && (
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-700">
                            {memo.memo}
                          </p>
                        )}
                        {memo.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {memo.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-900"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className="min-h-[520px] rounded-lg border border-gray-300 bg-white shadow-sm">
            {selectedMemo ? (
              <MemoDetail
                key={selectedMemo.id}
                memo={selectedMemo}
                onSave={saveMemo}
                onDelete={deleteMemo}
              />
            ) : (
              <div className="flex h-full min-h-[520px] items-center justify-center p-6 text-center">
                <div className="max-w-sm">
                  <h2 className="text-xl font-semibold text-gray-950">
                    メモを選択してください
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    左側の一覧から選択するか、新しく録音を開始してください。
                  </p>
                </div>
              </div>
            )}
          </section>
        </section>

        {(statusMessage || errorMessage) && (
          <div
            className={`rounded-md border px-4 py-3 text-sm ${
              errorMessage
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-teal-200 bg-teal-50 text-teal-900"
            }`}
          >
            {errorMessage ?? statusMessage}
          </div>
        )}
      </div>
    </main>
  );
}
