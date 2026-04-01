import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL as string)
    const { user_id, content_id, max_depth_percent } = await request.json()
    await sql`
      INSERT INTO scroll_depth (user_id, content_id, max_depth_percent)
      VALUES (${user_id}, ${content_id}, ${max_depth_percent})`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}