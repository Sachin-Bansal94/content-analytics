import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL as string)
    const { user_id, video_id, content_id, watched_seconds } = await request.json()
    await sql`
      INSERT INTO watch_events (user_id, video_id, content_id, watched_seconds)
      VALUES (${user_id}, ${video_id}, ${content_id}, ${watched_seconds})`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}