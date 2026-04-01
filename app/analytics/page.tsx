import Link from 'next/link'
import Charts from './Charts'

async function getAnalytics() {
  const res = await fetch('http://localhost:3000/api/analytics', {
    cache: 'no-store'
  })

  if (!res.ok) throw new Error('Failed to fetch analytics')

  return res.json()
}

export default async function AnalyticsPage() {
  const data = await getAnalytics()

  // 🔥 Optional: derive top content (bonus insight)
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

      {/* 🔥 INSIGHTS CARD (VERY IMPRESSIVE) */}
      {topContent && (
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '40px'
        }}>
          <h3 style={{ marginBottom: '10px' }}>
            🔥 Top Performing Content
          </h3>
          <p style={{ margin: 0 }}>
            <strong>{topContent.content_title}</strong> has the highest total watch time (
            {topContent.total_seconds} sec)
          </p>
        </div>
      )}

      {/* 🔥 CHARTS */}
      <Charts data={data} />

    </main>
  )
}