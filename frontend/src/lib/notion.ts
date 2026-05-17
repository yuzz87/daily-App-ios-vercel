import { Client } from "@notionhq/client"
import type { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints"

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

function paragraph(content: string): BlockObjectRequest {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [{ type: "text", text: { content } }],
    },
  }
}

export function buildSessionPage(databaseId: string, payload: SessionExportPayload) {
  const label = formatDurationLabel(payload.duration_seconds)
  const title = `${payload.category} · ${label}`
  const recordedAt = new Date(payload.recorded_at).toLocaleString("ja-JP")

  return {
    parent: { database_id: databaseId },
    properties: {
      title: {
        title: [{ text: { content: title } }],
      },
    },
    children: [
      paragraph(`カテゴリ: ${payload.category}`),
      paragraph(`時間: ${label} (${payload.duration_seconds}秒)`),
      paragraph(`記録日時: ${recordedAt}`),
      paragraph(`エクスポート: ${new Date().toLocaleString("ja-JP")}`),
      ...(payload.memo ? [paragraph(`メモ: ${payload.memo}`)] : []),
    ],
  }
}

export function buildSnapshotPage(databaseId: string, payload: StatsExportPayload) {
  const title = `Stats Snapshot · ${payload.weekRange}`

  return {
    parent: { database_id: databaseId },
    properties: {
      title: {
        title: [{ text: { content: title } }],
      },
    },
    children: [
      paragraph(`週別平均: ${formatDurationLabel(payload.weeklyAverageSeconds)}`),
      paragraph(`月別平均: ${formatDurationLabel(payload.monthlyAverageSeconds)}`),
      paragraph(`累計時間: ${formatDurationLabel(payload.totalSeconds)}`),
      paragraph(`今日の予測: ${formatDurationLabel(payload.predictedTodaySeconds)}`),
      paragraph(`期間: ${payload.weekRange}`),
      paragraph(`エクスポート: ${new Date().toLocaleString("ja-JP")}`),
    ],
  }
}
