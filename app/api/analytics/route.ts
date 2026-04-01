import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL as string)

    const [clicks, watchTime, scrollData] = await Promise.all([

      
      sql`
        SELECT 
          bc.button_label,
          bc.content_id,
          c.title as content_title,
          COUNT(*) as total_clicks
        FROM button_clicks bc
        LEFT JOIN contents c ON bc.content_id = c.id
        GROUP BY bc.button_label, bc.content_id, c.title
        ORDER BY total_clicks DESC
      `,

    
      sql`
        SELECT 
          we.video_id,
          we.content_id,
          c.title as content_title,
          ROUND(AVG(we.watched_seconds)) as avg_seconds,
          SUM(we.watched_seconds) as total_seconds,
          COUNT(*) as view_count
        FROM watch_events we
        LEFT JOIN contents c ON we.content_id = c.id
        GROUP BY we.video_id, we.content_id, c.title
        ORDER BY total_seconds DESC
      `,

      sql`
        SELECT 
          sd.content_id,
          c.title as content_title,
          ROUND(AVG(sd.max_depth_percent)) as avg_depth,
          COUNT(*) as session_count
        FROM scroll_depth sd
        LEFT JOIN contents c ON sd.content_id = c.id
        GROUP BY sd.content_id, c.title
        ORDER BY avg_depth DESC
      `
    ])

    return NextResponse.json({
      clicks,
      watchTime,
      scrollData
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}