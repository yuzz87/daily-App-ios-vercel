import { Client } from "@notionhq/client"

export type SessionExportPayload = {
  category: string
  duration_seconds: number
  recorded_at: string
  memo: string | null
}

export type StatsExportPayload = {
  weeklyAverageSeconds: number
  monthlyAverageSeconds: number
  totalSeconds: number
  predictedTodaySeconds: number
  weekRange: string
}

export function notionClient(): Client {
  const auth = process.env.NOTION_TOKEN
  if (!auth) throw new Error("NOTION_TOKEN is not set")
  return new Client({ auth, timeoutMs: 10000 })
}

export function formatDurationLabel(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) return `${hours}時間 ${minutes}分`
  if (minutes > 0) return `${minutes}分 ${remainingSeconds}秒`
  return `${remainingSeconds}秒`
}

export function buildSessionProperties(databaseId: string, payload: SessionExportPayload) {
  const label = formatDurationLabel(payload.duration_seconds)
  const title = `${payload.category} · ${label}`

  return {
    parent: { database_id: databaseId },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      Type: { select: { name: "session" } },
      Category: { select: { name: payload.category } },
      Duration: { number: payload.duration_seconds },
      "Duration (formatted)": { rich_text: [{ text: { content: label } }] },
      "Recorded At": { date: { start: payload.recorded_at } },
      ...(payload.memo ? { Memo: { rich_text: [{ text: { content: payload.memo } }] } } : {}),
      "Exported At": { date: { start: new Date().toISOString() } },
    },
  } as Parameters<Client["pages"]["create"]>[0]
}

export function buildSnapshotProperties(databaseId: string, payload: StatsExportPayload) {
  const title = `Stats Snapshot · ${payload.weekRange}`

  return {
    parent: { database_id: databaseId },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      Type: { select: { name: "snapshot" } },
      "Weekly Average": { number: payload.weeklyAverageSeconds },
      "Monthly Average": { number: payload.monthlyAverageSeconds },
      "Total Time": { number: payload.totalSeconds },
      "Today's Prediction": { number: payload.predictedTodaySeconds },
      "Exported At": { date: { start: new Date().toISOString() } },
    },
  } as Parameters<Client["pages"]["create"]>[0]
}
