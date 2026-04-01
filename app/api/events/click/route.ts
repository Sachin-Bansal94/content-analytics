import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL as string)
    const { user_id, button_label, content_id } = await request.json()
    await sql`
      INSERT INTO button_clicks (user_id, button_label, content_id)
      VALUES (${user_id}, ${button_label}, ${content_id})`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}