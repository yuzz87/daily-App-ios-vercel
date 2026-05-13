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
      error: "NEXT_PUBLIC_API_BASE_URL is not configured.",
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/study_sessions`, {
      cache: "no-store",
    })

    if (!res.ok) {
      return {
        studySessions: [],
        error: "Failed to load study sessions.",
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
      error: "Could not connect to the Rails API.",
    }
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }

  return `${remainingSeconds}s`
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
    .map(([key, durationSeconds]) => ({ key, durationSeconds }))
    .sort((a, b) => b.key.localeCompare(a.key))
}

function buildCurrentWeekBars(studySessions: StudySession[]) {
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
    heightPercent: Math.max(6, Math.round((bar.durationSeconds / maxSeconds) * 100)),
  }))
}

export default async function PredictionPage() {
  const { studySessions, error } = await fetchStudySessions()
  const dailyTotals = sumBy(studySessions, dateKey)
  const weeklyTotals = sumBy(studySessions, weekKey)
  const weekBars = buildCurrentWeekBars(studySessions)
  const currentWeekTotal = weekBars.reduce(
    (sum, bar) => sum + bar.durationSeconds,
    0,
  )

  return (
    <main className="h-full overflow-y-auto bg-gray-50 px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-3xl gap-4 pb-6">
        {error ? (
          <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </section>
        ) : null}

        <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">This Week</p>
              <h1 className="text-3xl font-semibold">
                {formatDuration(currentWeekTotal)}
              </h1>
            </div>
            <p className="text-sm text-gray-500">Timer data</p>
          </div>

          <div className="mt-6 grid h-48 grid-cols-7 items-end gap-3 border-b border-gray-200 px-1 pb-2">
            {weekBars.map((bar) => (
              <div key={bar.key} className="flex h-full flex-col justify-end gap-2">
                <div className="flex flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-indigo-500"
                    style={{ height: `${bar.heightPercent}%` }}
                    title={`${bar.key} ${formatDuration(bar.durationSeconds)}`}
                  />
                </div>
                <div className="text-center text-xs font-medium text-gray-500">
                  {bar.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">Daily totals</h2>
            <div className="mt-3 grid gap-2 text-sm">
              {dailyTotals.length > 0 ? (
                dailyTotals.slice(0, 7).map((total) => (
                  <div key={total.key} className="grid gap-1">
                    <span>{total.key}</span>
                    <span className="font-semibold">
                      {formatDuration(total.durationSeconds)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No records</p>
              )}
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">Weekly totals</h2>
            <div className="mt-3 grid gap-2 text-sm">
              {weeklyTotals.length > 0 ? (
                weeklyTotals.slice(0, 7).map((total) => (
                  <div key={total.key} className="grid gap-1">
                    <span>Week of {total.key}</span>
                    <span className="font-semibold">
                      {formatDuration(total.durationSeconds)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No records</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
