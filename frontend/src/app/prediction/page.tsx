"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth";
import WeeklyTimerChart, { type WeekBar } from "./WeeklyTimerChart";

type StudySession = {
  id: number;
  category: string;
  duration_seconds: number;
  recorded_at: string;
  memo: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}時間 ${minutes}分`;
  }

  if (minutes > 0) {
    return `${minutes}分 ${remainingSeconds}秒`;
  }

  return `${remainingSeconds}秒`;
}

function dateKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateKey(value: string): string {
  return dateKeyFromDate(new Date(value));
}

function monthKey(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function startOfWeekSunday(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  return start;
}

function weekKey(value: string): string {
  return dateKeyFromDate(startOfWeekSunday(new Date(value)));
}

function sumBy(
  studySessions: StudySession[],
  getKey: (recordedAt: string) => string,
) {
  const totals = new Map<string, number>();

  for (const session of studySessions) {
    const key = getKey(session.recorded_at);
    totals.set(key, (totals.get(key) ?? 0) + session.duration_seconds);
  }

  return Array.from(totals.entries());
}

function averageTotal(totals: Array<[string, number]>): number {
  if (totals.length === 0) return 0;

  const totalSeconds = totals.reduce((sum, [, seconds]) => sum + seconds, 0);
  return Math.round(totalSeconds / totals.length);
}

function buildCurrentWeekBars(studySessions: StudySession[]): WeekBar[] {
  const weekStart = startOfWeekSunday(new Date());
  const totals = new Map<string, number>();

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayIndex);
    totals.set(dateKeyFromDate(date), 0);
  }

  for (const session of studySessions) {
    const key = dateKey(session.recorded_at);

    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + session.duration_seconds);
    }
  }

  const bars = Array.from(totals.entries()).map(([key, durationSeconds], index) => ({
    key,
    label: dayLabels[index],
    durationSeconds,
  }));
  const maxSeconds = Math.max(...bars.map((bar) => bar.durationSeconds), 1);

  return bars.map((bar) => ({
    ...bar,
    formattedDuration: formatDuration(bar.durationSeconds),
    heightPercent: Math.max(6, Math.round((bar.durationSeconds / maxSeconds) * 100)),
  }));
}

function predictTodaySeconds(studySessions: StudySession[]): number {
  if (studySessions.length === 0) return 0;

  const today = new Date();
  const todayKey = dateKeyFromDate(today);
  const todayDay = today.getDay();
  const sameWeekdaySessions = studySessions.filter((session) => {
    const recordedAt = new Date(session.recorded_at);
    return recordedAt.getDay() === todayDay && dateKey(session.recorded_at) !== todayKey;
  });

  if (sameWeekdaySessions.length > 0) {
    return Math.round(
      sameWeekdaySessions.reduce(
        (sum, session) => sum + session.duration_seconds,
        0,
      ) / sameWeekdaySessions.length,
    );
  }

  return averageTotal(sumBy(studySessions, dateKey));
}

export default function PredictionPage() {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!API_BASE_URL) {
      setError("NEXT_PUBLIC_API_BASE_URL が設定されていません。");
      setLoading(false);
      return;
    }

    apiFetch(`${API_BASE_URL}/study_sessions`)
      .then((res) => {
        if (!res.ok) {
          setError("タイマー記録の取得に失敗しました。");
          return null;
        }
        return res.json() as Promise<StudySession[]>;
      })
      .then((data) => {
        if (data) setStudySessions(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Rails API に接続できませんでした。"))
      .finally(() => setLoading(false));
  }, []);

  const weekBars = buildCurrentWeekBars(studySessions);
  const todayKey = dateKeyFromDate(new Date());
  const todayBar = weekBars.find((bar) => bar.key === todayKey);
  const maxWeekBar = weekBars.reduce(
    (maxBar, bar) =>
      bar.durationSeconds > maxBar.durationSeconds ? bar : maxBar,
    weekBars[0],
  );
  const currentWeekTotal = weekBars.reduce(
    (sum, bar) => sum + bar.durationSeconds,
    0,
  );
  const totalSeconds = studySessions.reduce(
    (sum, session) => sum + session.duration_seconds,
    0,
  );
  const weeklyAverageSeconds = averageTotal(sumBy(studySessions, weekKey));
  const monthlyAverageSeconds = averageTotal(sumBy(studySessions, monthKey));
  const predictedTodaySeconds = predictTodaySeconds(studySessions);

  return (
    <main className="h-full overflow-y-auto bg-gray-50 px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-3xl gap-4 pb-6">
        {loading ? (
          <section className="rounded-md border border-stone-200 bg-white p-6 text-sm text-gray-600">
            読み込み中...
          </section>
        ) : null}

        {!loading && error ? (
          <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </section>
        ) : null}

        {!loading ? (
          <>
            <WeeklyTimerChart
              bars={weekBars}
              maxDayLabel={maxWeekBar ? `${maxWeekBar.label} ${formatDuration(maxWeekBar.durationSeconds)}` : "-"}
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
          </>
        ) : null}
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-500">{label}</h2>
      <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
