import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const VALID_TOOLS = new Set(['circuit-symbol', 'circuit-object', 'circuit-secjc', 'water-tank', 'isometric-cube'])
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
  if (contentType !== 'application/json') {
    return NextResponse.json({}, { status: 415 })
  }

  const body = await req.json().catch(() => null)
  const { uuid, tool } = body ?? {}

  if (
    typeof uuid !== 'string' ||
    !UUID_V4.test(uuid) ||
    typeof tool !== 'string' ||
    !VALID_TOOLS.has(tool)
  ) {
    return NextResponse.json({}, { status: 400 })
  }

  const sql = getDb()

  // Rate limit: 1 recorded event per uuid+tool per 5 minutes
  const recent = await sql`
    SELECT 1 FROM events
    WHERE user_uuid = ${uuid} AND tool = ${tool}
    AND created_at > NOW() - INTERVAL '5 minutes'
    LIMIT 1
  `
  if (recent.length > 0) return NextResponse.json({ ok: true })

  // Upsert user row
  await sql`
    INSERT INTO users (uuid) VALUES (${uuid})
    ON CONFLICT (uuid) DO UPDATE SET last_seen = NOW()
  `

  // Record export event
  await sql`INSERT INTO events (user_uuid, tool) VALUES (${uuid}, ${tool})`

  return NextResponse.json({ ok: true })
}
