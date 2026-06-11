"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { publicUrl } from "@/lib/publicPath";
import { VoiceMemoDetail } from "./components/VoiceMemoDetail";
import {
  VoiceMemoForm,
  type VoiceMemoFormField,
  type VoiceMemoFormValue,
} from "./components/VoiceMemoForm";
import { VoiceMemoList } from "./components/VoiceMemoList";
import {
  VoiceMemoRecorder,
  type RecordingCompleteResult,
} from "./components/VoiceMemoRecorder";
import {
  createVoiceMemo,
  deleteVoiceMemo,
  getVoiceMemos,
} from "@/app/taskmemo/lib/voiceMemoStorage";
import type { VoiceMemo } from "@/app/taskmemo/types/voiceMemo";

const emptyForm: VoiceMemoFormValue = {
  title: "",
  transcript: "",
};

// 画面中央ポップアップの通知。成功＝laugh / 失敗・警告＝frown
type Notification = { kind: "success" | "error"; message: string };

// 通知の表示時間（ここを変えると表示秒数が変わる）
const NOTIFICATION_VISIBLE_MS = 1000;
// スライドイン/アウトの長さ。globals.css のアニメ時間と合わせる
const NOTIFICATION_ANIM_MS = 350;

export default function TaskMemoPage() {
  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<VoiceMemoFormValue>(emptyForm);
  const [loaded, setLoaded] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [notificationClosing, setNotificationClosing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [draftDurationSec, setDraftDurationSec] = useState<number | null>(null);

  const selectedMemo = useMemo(
    () => memos.find((memo) => memo.id === selectedId) ?? null,
    [memos, selectedId],
  );

  // 録音は新規作成のみなので、再生時間は録音中のドラフト値だけを使う
  const editorDurationSec = draftDurationSec;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      // 初期表示は新規作成モード（既存メモは選択しない）
      setMemos(getVoiceMemos());
      setLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  // 表示時間が過ぎたら閉じアニメ（スライドアウト）を開始する
  useEffect(() => {
    if (!notification || notificationClosing) return;

    const timeoutId = window.setTimeout(
      () => setNotificationClosing(true),
      NOTIFICATION_VISIBLE_MS,
    );

    return () => window.clearTimeout(timeoutId);
  }, [notification, notificationClosing]);

  // 閉じアニメが終わったらアンマウント（DOM から消す）
  useEffect(() => {
    if (!notificationClosing) return;

    const timeoutId = window.setTimeout(() => {
      setNotification(null);
      setNotificationClosing(false);
    }, NOTIFICATION_ANIM_MS);

    return () => window.clearTimeout(timeoutId);
  }, [notificationClosing]);

  function showNotification(next: Notification) {
    setNotificationClosing(false);
    setNotification(next);
  }

  function clearNotification() {
    setNotificationClosing(false);
    setNotification(null);
  }

  function notifySuccess(message: string) {
    showNotification({ kind: "success", message });
  }

  function notifyError(message: string) {
    showNotification({ kind: "error", message });
  }

  // 録音コンポーネントからの通知（メッセージありは失敗扱い、null はクリア）
  function handleRecorderMessage(message: string | null) {
    if (message) {
      showNotification({ kind: "error", message });
    } else {
      clearNotification();
    }
  }

  function handleSelectMemo(memo: VoiceMemo) {
    if (isRecording) return;

    openMemo(memo);
    clearNotification();
  }

  function handleFormChange(field: VoiceMemoFormField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleTranscriptChange(transcript: string) {
    setForm((current) => ({ ...current, transcript }));
  }

  function handleRecordingComplete(result: RecordingCompleteResult) {
    const transcript = result.transcript;

    // 文字起こしが空なら自動保存しない（誤録音でゴミメモを作らない）
    if (!transcript.trim()) {
      setDraftDurationSec(result.durationSec);
      setForm((current) => ({ ...current, transcript }));
      notifyError("録音を停止しました。メモを入力して保存してください。");
      return;
    }

    createNewMemo(
      transcript,
      result.durationSec,
      selectedMemo ? "" : form.title,
    );
    notifySuccess("保存しました");
  }

  function handleSave() {
    if (isRecording) return;

    createNewMemo(form.transcript, editorDurationSec, form.title);
    notifySuccess("保存しました");
  }

  function createNewMemo(
    transcript: string,
    durationSec: number | null,
    title: string,
  ) {
    const cleanTranscript = transcript.trim();

    // 音声メモは新規作成のみ（既存メモの文字起こしの更新はしない）
    // タイトルは入力があればそれを使い、空なら「新規N」にフォールバック
    const isoNow = new Date().toISOString();
    const nextMemo: VoiceMemo = {
      id: createId(),
      title: title.trim() || nextNewMemoTitle(memos),
      transcript: cleanTranscript,
      durationSec,
      createdAt: isoNow,
      updatedAt: isoNow,
    };

    const nextMemos = createVoiceMemo(nextMemo);
    setMemos(nextMemos);
    openMemo(nextMemo);
  }

  function handleDelete() {
    if (!selectedMemo || isRecording) return;

    const confirmed = window.confirm("Delete this memo?");
    if (!confirmed) return;

    const nextMemos = deleteVoiceMemo(selectedMemo.id);
    setMemos(nextMemos);
    openMemo(nextMemos[0] ?? null);
    notifySuccess("削除しました");
  }

  function handleRecordingChange(recording: boolean) {
    // 録音開始時は常に新規メモ扱い（既存メモの本文・タグ・文字起こしを引き継がない）
    if (recording && selectedMemo) {
      openMemo(null);
    }
    setIsRecording(recording);
  }

  function handleRenameMemo() {
    if (!selectedMemo || isRecording) return;

    const nextTitle = form.title.trim();
    if (nextTitle === selectedMemo.title) return;

    const updatedMemo: VoiceMemo = {
      ...selectedMemo,
      title: nextTitle,
      updatedAt: new Date().toISOString(),
    };
    setMemos(createVoiceMemo(updatedMemo));
  }

  function openMemo(memo: VoiceMemo | null) {
    setSelectedId(memo?.id ?? null);
    setForm(memo ? memoToForm(memo) : emptyForm);
    setDraftDurationSec(null);
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-teal-100/80 px-4 py-5 text-gray-950 sm:px-6 lg:px-8">
      {notification ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <Image
            src={publicUrl(
              notification.kind === "success" ? "/laugh.svg" : "/frown.svg",
            )}
            alt={notification.message}
            width={300}
            height={300}
            className={
              notificationClosing
                ? "animate-[notification-slide-out_0.35s_ease-in_forwards]"
                : "animate-[notification-slide-in_0.35s_ease-out]"
            }
          />
        </div>
      ) : null}

      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-5">
        {!loaded ? (
          <section className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            Loading memos...
          </section>
        ) : (
          <section className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 lg:grid-cols-[400px_1fr] lg:grid-rows-[minmax(0,1fr)]">
            <VoiceMemoList
              memos={memos}
              selectedId={selectedId}
              disabled={isRecording}
              onSelectMemo={handleSelectMemo}
            />

            {selectedMemo ? (
              <VoiceMemoDetail
                memo={selectedMemo}
                titleValue={form.title}
                disabled={isRecording}
                onTitleChange={(value) => handleFormChange("title", value)}
                onTitleCommit={handleRenameMemo}
                onDelete={handleDelete}
              />
            ) : (
              <section className="min-h-0 overflow-y-auto rounded-md border border-purple-300 bg-purple-300/60 shadow-sm">
                <VoiceMemoForm
                  value={form}
                  disabled={isRecording}
                  onChange={handleFormChange}
                  onSubmit={handleSave}
                />
              </section>
            )}
          </section>
        )}

        {loaded ? (
          <footer className="flex shrink-0 justify-center border-t border-gray-300 pt-4">
            <VoiceMemoRecorder
              currentTranscript={selectedMemo ? "" : form.transcript}
              durationSec={selectedMemo ? null : editorDurationSec}
              disabled={isRecording}
              onTranscriptChange={handleTranscriptChange}
              onComplete={handleRecordingComplete}
              onRecordingChange={handleRecordingChange}
              onStatusMessage={handleRecorderMessage}
              onErrorMessage={handleRecorderMessage}
            />
          </footer>
        ) : null}
      </div>
    </main>
  );
}

function nextNewMemoTitle(memos: VoiceMemo[]): string {
  let maxNumber = 0;
  for (const memo of memos) {
    const match = memo.title.match(/^新規(\d+)$/);
    if (!match) continue;

    const value = Number(match[1]);
    if (value > maxNumber) maxNumber = value;
  }

  return `新規${maxNumber + 1}`;
}

function memoToForm(memo: VoiceMemo): VoiceMemoFormValue {
  return {
    title: memo.title,
    transcript: memo.transcript,
  };
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${currentTimeMs()}-${Math.random().toString(36).slice(2)}`;
}

function currentTimeMs(): number {
  return Date.now();
}
