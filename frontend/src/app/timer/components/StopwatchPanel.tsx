"use client"

import { ChangeEvent, useMemo, useState } from "react"
import { useStopwatch } from "../../components/StopwatchProvider"
import { apiFetch } from "@/lib/auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default function StopwatchPanel() {
  const {
    category,
    elapsedTime,
    currentLapTime,
    isRunning,
    laps,
    hasUnsavedStop,
    startTimer,
    stopTimer,
    resetTimer,
    recordLap,
    markSaved,
    setCategory,
  } = useStopwatch()

  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [notionMessage, setNotionMessage] = useState<string | null>(null)
  const [notionError, setNotionError] = useState<string | null>(null)

  const canSave = elapsedTime > 0 && !isRunning && !isSaving
  const canExport = elapsedTime > 0 && !isRunning && !isExporting

  const durationSeconds = useMemo(
    () => Math.max(1, Math.round(elapsedTime / 1000)),
    [elapsedTime],
  )

  function formatTime(time: number) {
    const hours = Math.floor(time / 3600000)
    const minutes = Math.floor((time % 3600000) / 60000)
    const seconds = Math.floor((time % 60000) / 1000)
    const tenths = Math.floor((time % 1000) / 100)

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`
  }

  function handleStartStop() {
    if (isRunning) {
      stopTimer()
      return
    }

    setSaveMessage(null)
    setErrorMessage(null)
    startTimer()
  }

  function handleReset() {
    if (hasUnsavedStop) {
      const confirmed = window.confirm(
        "This stopwatch session has not been saved. Reset anyway?",
      )
      if (!confirmed) return
    }

    resetTimer()
    setSaveMessage(null)
    setErrorMessage(null)
  }

  function handleCategoryChange(event: ChangeEvent<HTMLInputElement>) {
    setCategory(event.target.value)
  }

  async function handleExportToNotion() {
    if (!API_BASE_URL) {
      setNotionError("NEXT_PUBLIC_API_BASE_URL is not configured.")
      return
    }

    if (!category.trim()) {
      setNotionError("Category is required.")
      return
    }

    setIsExporting(true)
    setNotionMessage(null)
    setNotionError(null)

    try {
      const res = await apiFetch(`${API_BASE_URL}/notion/export_session`, {
        method: "POST",
        body: JSON.stringify({
          category: category.trim(),
          duration_seconds: durationSeconds,
          recorded_at: new Date().toISOString(),
          memo: null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setNotionError(
          (data as { error?: string }).error ?? "Notion への送信に失敗しました。",
        )
        return
      }

      setNotionMessage("Exported to Notion.")
    } catch {
      setNotionError("Notion に接続できませんでした。")
    } finally {
      setIsExporting(false)
    }
  }

  async function handleSave() {
    if (!API_BASE_URL) {
      setErrorMessage("NEXT_PUBLIC_API_BASE_URL is not configured.")
      return
    }

    const trimmedCategory = category.trim()

    if (!trimmedCategory) {
      setErrorMessage("Category is required.")
      return
    }

    if (elapsedTime <= 0) {
      setErrorMessage("Start the stopwatch before saving.")
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const res = await apiFetch(`${API_BASE_URL}/study_sessions`, {
        method: "POST",
        body: JSON.stringify({
          study_session: {
            category: trimmedCategory,
            duration_seconds: durationSeconds,
            recorded_at: new Date().toISOString(),
            memo: null,
          },
        }),
      })

      if (!res.ok) {
        setErrorMessage(await getErrorMessage(res))
        return
      }

      markSaved()
      resetTimer()
      setSaveMessage("Saved. Open Prediction to review your records.")
    } catch {
      setErrorMessage("Could not connect to the Rails API.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="relative z-10 min-h-full px-4 pt-10 pb-32 text-gray-950">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
        <section className="rounded-md border border-gray-950 bg-white/85 px-8 py-5 shadow-[5px_6px_2px_rgba(0,0,0,0.8)]">
          <p className="tabular-nums text-4xl font-bold">
            {formatTime(elapsedTime)}
          </p>
        </section>

        <section className="flex w-full justify-center gap-14 sm:gap-20">
          {isRunning ? (
            <button
              type="button"
              onClick={recordLap}
              className="h-14 w-14 rounded-full border border-gray-950 bg-yellow-200 text-sm font-bold shadow-md transition hover:bg-yellow-300"
            >
              Lap
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="h-14 w-14 rounded-full border border-gray-950 bg-yellow-200 text-sm font-bold shadow-md transition hover:bg-yellow-300"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={handleStartStop}
            className={`h-14 w-14 rounded-full border border-gray-950 text-sm font-bold shadow-md transition ${
              isRunning
                ? "bg-red-300 hover:bg-red-400"
                : "bg-green-300 hover:bg-green-400"
            }`}
          >
            {isRunning ? "Stop" : "Start"}
          </button>
        </section>

        <section className="w-full max-w-xs rounded-md bg-white/85 px-4 shadow-md">
          {elapsedTime === 0 && laps.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-600" />
          ) : (
            <ul>
              {elapsedTime > 0 ? (
                <li className="flex justify-between border-b py-3 text-sm">
                  <span>Lap {laps.length + 1}</span>
                  <span className="tabular-nums">
                    {formatTime(currentLapTime)}
                  </span>
                </li>
              ) : null}

              {laps.map((lap, index) => (
                <li
                  key={`${lap}-${index}`}
                  className="flex justify-between border-b py-3 text-sm last:border-b-0"
                >
                  <span>Lap {laps.length - index}</span>
                  <span className="tabular-nums">{formatTime(lap)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="absolute right-1/2 bottom-6 z-20 translate-x-1/2 px-4">
          <div className="relative flex items-center justify-center gap-10">
            {saveMessage ? (
              <p className="absolute bottom-16 left-1/2 w-56 -translate-x-1/2 rounded-md bg-white/90 px-3 py-2 text-center text-xs text-green-700 shadow">
                {saveMessage}
              </p>
            ) : null}

            {errorMessage ? (
              <p
                role="alert"
                className="absolute bottom-16 left-1/2 w-56 -translate-x-1/2 rounded-md bg-white/90 px-3 py-2 text-center text-xs text-red-700 shadow"
              >
                {errorMessage}
              </p>
            ) : null}

            {notionMessage ? (
              <p className="absolute bottom-16 left-1/2 w-56 -translate-x-1/2 rounded-md bg-white/90 px-3 py-2 text-center text-xs text-green-700 shadow">
                {notionMessage}
              </p>
            ) : null}

            {notionError ? (
              <p
                role="alert"
                className="absolute bottom-16 left-1/2 w-56 -translate-x-1/2 rounded-md bg-white/90 px-3 py-2 text-center text-xs text-red-700 shadow"
              >
                {notionError}
              </p>
            ) : null}

            <label className="grid h-10 w-30 place-items-center bg-white/85 p-2 shadow-[5px_3px_3px_rgba(0,0,0,0.8)] hover:bg-yellow-300">
              <span className="sr-only">Category</span>
              <input
                value={category}
                onChange={handleCategoryChange}
                list="study-session-categories"
                disabled={isSaving}
                aria-label="Category"
                className="h-full w-full bg-transparent text-center text-xs font-bold leading-tight outline-none disabled:cursor-not-allowed"
              />
              <datalist id="study-session-categories">
                <option value="Programming" />
                <option value="Sleep" />
                <option value="English" />
                <option value="Math" />
                <option value="Reading" />
              </datalist>
            </label>

            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="h-10 w-18 bg-white text-sm font-bold  shadow-[5px_3px_3px_rgba(0,0,0,0.8)] transition hover:bg-yellow-300 disabled:cursor-not-allowed "
            >
              {isSaving ? "Saving" : "Save"}
            </button>

            <button
              type="button"
              onClick={handleExportToNotion}
              disabled={!canExport}
              className="h-10 w-18  bg-white text-xs font-bold shadow-[5px_3px_3px_rgba(0,0,0,0.8)] transition hover:bg-yellow-300 disabled:cursor-not-allowed"
            >
              {isExporting ? "Sending" : "Notion"}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

async function getErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json()

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.join("\n")
    }
  } catch {
    return "Failed to save the study session."
  }

  return "Failed to save the study session."
}
