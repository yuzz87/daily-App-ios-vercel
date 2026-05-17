import { NextRequest, NextResponse } from "next/server"
import { notionClient, buildSessionPage, type SessionExportPayload } from "@/lib/notion"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const token = process.env.NOTION_TOKEN
  const dbId = process.env.NOTION_DATABASE_ID

  if (!token || !dbId) {
    return NextResponse.json({ error: "Notion is not configured." }, { status: 503 })
  }

  let payload: SessionExportPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (!payload.category || !payload.duration_seconds || !payload.recorded_at) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
  }

  try {
    const notion = notionClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await notion.pages.create(buildSessionPage(dbId, payload) as any)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[notion/export-session]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
