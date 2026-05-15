"use client"

import { useEffect, useRef } from "react"
import { publicUrl } from "@/lib/publicPath"
import { useCountdownTimer, type CountdownPreset } from "../hooks/useCountdownTimer"

const PRESETS: CountdownPreset[] = [1, 5, 10, 25, 30, 60]

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function CountdownPanel() {
  const {
    remainingSeconds,
    isRunning,
    hasFinished,
    selectPreset,
    adjustMinutes,
    start,
    stop,
    reset,
    dismissAlarm,
  } = useCountdownTimer()

  const alarmRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    alarmRef.current = new Audio(publicUrl("/alarm.mp3"))
    alarmRef.current.loop = false
    return () => {
      alarmRef.current?.pause()
    }
  }, [])

  useEffect(() => {
    if (hasFinished) {
      alarmRef.current?.play().catch(() => {})
    } else {
      if (alarmRef.current) {
        alarmRef.current.pause()
        alarmRef.current.currentTime = 0
      }
    }
  }, [hasFinished])

  return (
    <main className="relative z-10 min-h-full px-4 pt-10 pb-32 text-gray-950">
      {hasFinished && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-950 bg-white px-10 py-8 shadow-xl">
            <p className="text-3xl font-bold">Time&apos;s up!</p>
            <button
              type="button"
              onClick={dismissAlarm}
              className="rounded-md border border-gray-950 bg-gray-950 px-6 py-2 text-sm font-bold text-white transition hover:bg-gray-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-fit flex-col items-center gap-6">
        {/* Time display */}
        <section className="rounded-md border border-gray-950 bg-white/85 px-8 py-5 shadow-[5px_6px_2px_rgba(0,0,0,0.8)]">
          <p className="tabular-nums text-5xl font-bold sm:text-6xl">
            {formatCountdown(remainingSeconds)}
          </p>
        </section>

        {/* Preset buttons */}
        <section className="flex flex-wrap justify-center gap-2">
          {PRESETS.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => selectPreset(min)}
              disabled={isRunning}
              className="h-10 w-14 rounded-md border border-gray-950 bg-white/85 text-sm font-bold shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {min}m
            </button>
          ))}
        </section>

        {/* Fine-tune */}
        <section className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => adjustMinutes(-1)}
            disabled={isRunning}
            className="h-12 w-20 rounded-md border border-gray-950 bg-white/85 text-sm font-bold shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            -1 min
          </button>
          <button
            type="button"
            onClick={() => adjustMinutes(1)}
            disabled={isRunning}
            className="h-12 w-20 rounded-md border border-gray-950 bg-white/85 text-sm font-bold shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            +1 min
          </button>
        </section>

        {/* Controls */}
        <section className="flex gap-14 sm:gap-20">
          <button
            type="button"
            onClick={reset}
            className="h-20 w-20 rounded-full border border-gray-950 bg-yellow-200 text-sm font-bold shadow-md transition hover:bg-yellow-300"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={isRunning ? stop : start}
            disabled={remainingSeconds === 0 && !isRunning}
            className={`h-20 w-20 rounded-full border border-gray-950 text-sm font-bold shadow-md transition disabled:cursor-not-allowed disabled:opacity-40 ${
              isRunning
                ? "bg-red-300 hover:bg-red-400"
                : "bg-green-300 hover:bg-green-400"
            }`}
          >
            {isRunning ? "Stop" : "Start"}
          </button>
        </section>
      </div>
    </main>
  )
}
