'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts'

export default function Charts({ data }: any) {

  // 🔥 GROUP BUTTON CLICKS BY CONTENT
  const groupedClicks: any = {}

  data.clicks.forEach((item: any) => {
    const key = item.content_title || 'Unknown'

    if (!groupedClicks[key]) {
      groupedClicks[key] = {
        content_title: key,
        "Mark as Complete": 0,
        "Take Quiz": 0,
        "Download Notes": 0
      }
    }

    groupedClicks[key][item.button_label] = Number(item.total_clicks)
  })

  const clickData = Object.values(groupedClicks)

  // 🔥 WATCH DATA
  const watchData = data.watchTime.map((item: any) => ({
    name: item.content_title,
    avg: Number(item.avg_seconds)
  }))

  // 🔥 SCROLL DATA
  const scrollData = data.scrollData.map((item: any) => ({
    name: item.content_title,
    depth: Number(item.avg_depth)
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>

      {/* 🔥 BUTTON CLICKS (GROUPED CHART) */}
      <div>
  <h2>Button Clicks by Content</h2>

  <div style={{
    width: '100%',
    height: 350,
    minWidth: 300,
    minHeight: 300
  }}>
    <ResponsiveContainer>
      <BarChart data={clickData}>
        <CartesianGrid stroke="#333" />
        <XAxis 
          dataKey="content_title"
          stroke="#aaa"
          angle={-20}
          textAnchor="end"
          interval={0}
        />
        <YAxis stroke="#aaa" />
        <Tooltip />
        <Legend />

        <Bar dataKey="Mark as Complete" fill="#6c47ff" />
        <Bar dataKey="Take Quiz" fill="#22c55e" />
        <Bar dataKey="Download Notes" fill="#f59e0b" />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>

      {/* 🔥 WATCH TIME */}
      <div>
        <h2>Average Watch Time</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={watchData}>
              <CartesianGrid stroke="#333" />
              <XAxis 
                dataKey="name"
                stroke="#aaa"
                angle={-20}
                textAnchor="end"
                interval={0}
              />
              <YAxis stroke="#aaa" />
              <Tooltip />
              <Bar dataKey="avg" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🔥 SCROLL DEPTH */}
      <div>
        <h2>Scroll Depth</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={scrollData}>
              <CartesianGrid stroke="#333" />
              <XAxis 
                dataKey="name"
                stroke="#aaa"
                angle={-20}
                textAnchor="end"
                interval={0}
              />
              <YAxis stroke="#aaa" />
              <Tooltip />
              <Bar dataKey="depth" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}

