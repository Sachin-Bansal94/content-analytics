import Link from 'next/link'
import { neon } from '@neondatabase/serverless'
import Charts from './Charts'

async function getAnalytics() {
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
      ORDER BY total_clicks DESC`,
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
      ORDER BY total_seconds DESC`,
    sql`
      SELECT 
        sd.content_id,
        c.title as content_title,
        ROUND(AVG(sd.max_depth_percent)) as avg_depth,
        COUNT(*) as session_count
      FROM scroll_depth sd
      LEFT JOIN contents c ON sd.content_id = c.id
      GROUP BY sd.content_id, c.title
      ORDER BY avg_depth DESC`
  ])

  return { clicks, watchTime, scrollData }
}

export default async function AnalyticsPage() {
  const data = await getAnalytics()
  const topContent = data.watchTime?.[0]

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#0f0f0f',
      color: '#fff',
      padding: '40px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>
          ← Back
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: '600' }}>
          Analytics Dashboard
        </h1>
      </div>

      {/* Top content insight card */}
      {topContent && (
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '40px'
        }}>
          <h3 style={{ marginBottom: '10px' }}>
            Top Performing Content
          </h3>
          <p style={{ margin: 0 }}>
            <strong>{topContent.content_title}</strong> has the highest total watch time ({topContent.total_seconds} sec)
          </p>
        </div>
      )}

      {/* Charts */}
      <Charts data={data} />
    </main>
  )
}
