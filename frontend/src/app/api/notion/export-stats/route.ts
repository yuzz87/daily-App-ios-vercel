import { NextRequest, NextResponse } from "next/server"
import {
  notionClient,
  buildSnapshotProperties,
  type StatsExportPayload,
} from "@/lib/notion"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const token = process.env.NOTION_TOKEN
  const dbId = process.env.NOTION_DATABASE_ID

  if (!token || !dbId) {
    return NextResponse.json({ error: "Notion is not configured." }, { status: 503 })
  }

  let payload: StatsExportPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  try {
    const notion = notionClient()
    await notion.pages.create(buildSnapshotProperties(dbId, payload))
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
