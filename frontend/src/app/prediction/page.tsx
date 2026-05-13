import WeeklyTimerChart, { type WeekBar } from "./WeeklyTimerChart"

export const dynamic = "force-dynamic"

type StudySession = {
  id: number
  category: string
  duration_seconds: number
  recorded_at: string
  memo: string | null
  created_at: string | null
  updated_at: string | null
}

type StudySessionResult =
  | {
      studySessions: StudySession[]
      error: null
    }
  | {
      studySessions: []
      error: string
    }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
const dayLabels = ["日", "月", "火", "水", "木", "金", "土"]

async function fetchStudySessions(): Promise<StudySessionResult> {
  if (!API_BASE_URL) {
    return {
      studySessions: [],
      error: "NEXT_PUBLIC_API_BASE_URL \u304c\u8a2d\u5b9a\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002",
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/study_sessions`, {
      cache: "no-store",
    })

    if (!res.ok) {
      return {
        studySessions: [],
        error: "\u30bf\u30a4\u30de\u30fc\u8a18\u9332\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002",
      }
    }

    const data = await res.json()

    return {
      studySessions: Array.isArray(data) ? data : [],
      error: null,
    }
  } catch {
    return {
      studySessions: [],
      error: "Rails API \u306b\u63a5\u7d9a\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002",
    }
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}\u6642\u9593 ${minutes}\u5206`
  }

  if (minutes > 0) {
    return `${minutes}\u5206 ${remainingSeconds}\u79d2`
  }

  return `${remainingSeconds}\u79d2`
}

function dateKeyFromDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function dateKey(value: string): string {
  return dateKeyFromDate(new Date(value))
}

function monthKey(value: string): string {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${year}-${month}`
}

function startOfWeekSunday(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - start.getDay())

  return start
}

function weekKey(value: string): string {
  return dateKeyFromDate(startOfWeekSunday(new Date(value)))
}

function sumBy(
  studySessions: StudySession[],
  getKey: (recordedAt: string) => string,
) {
  const totals = new Map<string, number>()

  for (const session of studySessions) {
    const key = getKey(session.recorded_at)
    totals.set(key, (totals.get(key) ?? 0) + session.duration_seconds)
  }

  return Array.from(totals.entries())
}

function averageTotal(totals: Array<[string, number]>): number {
  if (totals.length === 0) return 0

  const totalSeconds = totals.reduce((sum, [, seconds]) => sum + seconds, 0)
  return Math.round(totalSeconds / totals.length)
}

function buildCurrentWeekBars(studySessions: StudySession[]): WeekBar[] {
  const weekStart = startOfWeekSunday(new Date())
  const totals = new Map<string, number>()

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + dayIndex)
    totals.set(dateKeyFromDate(date), 0)
  }

  for (const session of studySessions) {
    const key = dateKey(session.recorded_at)

    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + session.duration_seconds)
    }
  }

  const bars = Array.from(totals.entries()).map(([key, durationSeconds], index) => ({
    key,
    label: dayLabels[index],
    durationSeconds,
  }))
  const maxSeconds = Math.max(...bars.map((bar) => bar.durationSeconds), 1)

  return bars.map((bar) => ({
    ...bar,
    formattedDuration: formatDuration(bar.durationSeconds),
    heightPercent: Math.max(6, Math.round((bar.durationSeconds / maxSeconds) * 100)),
  }))
}

function predictTodaySeconds(studySessions: StudySession[]): number {
  if (studySessions.length === 0) return 0

  const today = new Date()
  const todayKey = dateKeyFromDate(today)
  const todayDay = today.getDay()
  const sameWeekdaySessions = studySessions.filter((session) => {
    const recordedAt = new Date(session.recorded_at)
    return recordedAt.getDay() === todayDay && dateKey(session.recorded_at) !== todayKey
  })

  if (sameWeekdaySessions.length > 0) {
    return Math.round(
      sameWeekdaySessions.reduce(
        (sum, session) => sum + session.duration_seconds,
        0,
      ) / sameWeekdaySessions.length,
    )
  }

  return averageTotal(sumBy(studySessions, dateKey))
}

export default async function PredictionPage() {
  const { studySessions, error } = await fetchStudySessions()
  const weekBars = buildCurrentWeekBars(studySessions)
  const todayKey = dateKeyFromDate(new Date())
  const todayBar = weekBars.find((bar) => bar.key === todayKey)
  const maxWeekBar = weekBars.reduce(
    (maxBar, bar) =>
      bar.durationSeconds > maxBar.durationSeconds ? bar : maxBar,
    weekBars[0],
  )
  const currentWeekTotal = weekBars.reduce(
    (sum, bar) => sum + bar.durationSeconds,
    0,
  )
  const totalSeconds = studySessions.reduce(
    (sum, session) => sum + session.duration_seconds,
    0,
  )
  const weeklyAverageSeconds = averageTotal(sumBy(studySessions, weekKey))
  const monthlyAverageSeconds = averageTotal(sumBy(studySessions, monthKey))
  const predictedTodaySeconds = predictTodaySeconds(studySessions)

  return (
    <main className="h-full overflow-y-auto bg-gray-50 px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-3xl gap-4 pb-6">
        {error ? (
          <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </section>
        ) : null}

        <WeeklyTimerChart
          bars={weekBars}
          maxDayLabel={`${maxWeekBar.label} ${formatDuration(maxWeekBar.durationSeconds)}`}
          todayLabel={formatDuration(todayBar?.durationSeconds ?? 0)}
          totalLabel={formatDuration(currentWeekTotal)}
        />

        <section className="grid grid-cols-2 gap-4">
          <MetricCard label="週別平均" value={formatDuration(weeklyAverageSeconds)} />
          <MetricCard label="月別平均" value={formatDuration(monthlyAverageSeconds)} />
          <MetricCard label="累計時間" value={formatDuration(totalSeconds)} />
          <MetricCard
            label="今日の予測学習時間"
            value={formatDuration(predictedTodaySeconds)}
          />
        </section>
      </div>
    </main>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-500">{label}</h2>
      <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}
