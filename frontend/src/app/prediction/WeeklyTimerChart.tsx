"use client"

import { useState } from "react"

export type WeekBar = {
  key: string
  label: string
  durationSeconds: number
  formattedDuration: string
  heightPercent: number
}

type WeeklyTimerChartProps = {
  bars: WeekBar[]
  maxDayLabel: string
  todayLabel: string
  totalLabel: string
}

const labels = {
  hideGraph: "グラフを隠す",
  showGraph: "グラフを表示",
  todayStudyTime: "今日の学習時間",
  maxWeekTime: "今週の最多時間",
}

export default function WeeklyTimerChart({
  bars,
  maxDayLabel,
  todayLabel,
}: WeeklyTimerChartProps) {
  const [isVisible, setIsVisible] = useState(true)

  return (
    <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">タイマー予測</h1>
        </div>
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-pressed={isVisible}
          className="min-h-10 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          {isVisible ? labels.hideGraph : labels.showGraph}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-500">
            {labels.todayStudyTime}
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{todayLabel}</p>
        </div>
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-500">
            {labels.maxWeekTime}
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{maxDayLabel}</p>
        </div>
      </div>

      {isVisible ? (
        <div className="mt-6 grid h-48 grid-cols-7 items-end gap-3 border-b border-gray-200 px-1 pb-2">
          {bars.map((bar) => (
            <div key={bar.key} className="flex h-full flex-col justify-end gap-2">
              <div className="flex flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-indigo-500"
                  style={{ height: `${bar.heightPercent}%` }}
                  title={`${bar.key} ${bar.formattedDuration}`}
                />
              </div>
              <div className="text-center text-xs font-medium text-gray-500">
                {bar.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
