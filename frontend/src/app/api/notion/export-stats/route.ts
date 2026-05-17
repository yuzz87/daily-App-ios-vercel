import { NextRequest, NextResponse } from "next/server"
import { notionClient, buildSnapshotPage, type StatsExportPayload } from "@/lib/notion"
import { verifyRailsJwt } from "@/lib/verifyToken"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  if (!verifyRailsJwt(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await notion.pages.create(buildSnapshotPage(dbId, payload) as any)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[notion/export-stats]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
