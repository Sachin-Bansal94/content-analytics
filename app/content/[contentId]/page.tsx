'use client'
/* It is a client side Page*/
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getUserId } from '@/lib/userId'

export default function ContentPage() {
  const params = useParams()
  const contentId = params?.contentId as string

  const [content, setContent] = useState<any>(null)
  const [completed, setCompleted] = useState(false)
  const watchStart = useRef<number>(0)

  // ✅ Fetch content safely
  useEffect(() => {
    if (!contentId) return

    fetch(`/api/contents/${contentId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch content')
        return res.json()
      })
      .then(setContent)
      .catch(err => console.error(err))
  }, [contentId])

  // ✅ Scroll tracking (clean throttle)
  useEffect(() => {
    if (!contentId) return

    let timeout: any

    const handleScroll = () => {
      clearTimeout(timeout)

      timeout = setTimeout(() => {
        const scrolled = window.scrollY + window.innerHeight
        const total = document.documentElement.scrollHeight
        const depth = Math.round((scrolled / total) * 100)

        fetch('/api/events/scroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: getUserId(),
            content_id: contentId,
            max_depth_percent: depth
          })
        })
      }, 1000)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [contentId])

  function trackClick(buttonLabel: string) {
    fetch('/api/events/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: getUserId(),
        button_label: buttonLabel,
        content_id: contentId
      })
    })
  }

  function handleVideoPlay() {
    watchStart.current = Date.now()
  }

  function handleVideoPause() {
    if (!watchStart.current) return

    const seconds = Math.round((Date.now() - watchStart.current) / 1000)
    watchStart.current = 0

    if (seconds < 1) return

    fetch('/api/events/watch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: getUserId(),
        video_id: content?.video_url || 'default_video',
        content_id: contentId,
        watched_seconds: seconds
      })
    })
  }

  if (!content) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0f0f0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        Loading...
      </div>
    )
  }

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#0f0f0f',
      color: '#ffffff',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #222',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        backgroundColor: '#0f0f0f',
        zIndex: 10
      }}>
        <Link href="/" style={{
          color: '#fff',
          textDecoration: 'none',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          LearnHub
        </Link>

        <Link href="/analytics" style={{
          color: '#888',
          textDecoration: 'none',
          fontSize: '14px'
        }}>
          Analytics Dashboard
        </Link>
      </div>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          margin: '0 0 32px'
        }}>
          {content.title}
        </h1>

        {/* Video */}
        <div style={{
          backgroundColor: '#000',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '32px',
          aspectRatio: '16/9'
        }}>
          <iframe
            width="100%"
            height="100%"
            src={content.video_url}
            title={content.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            allowFullScreen
            style={{ border: 'none' }}
          />
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '40px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => {
              setCompleted(true)
              trackClick('Mark as Complete')
            }}
            style={{
              backgroundColor: completed ? '#16a34a' : '#6c47ff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {completed ? '✓ Completed' : 'Mark as Complete'}
          </button>

          <button
            onClick={() => trackClick('Take Quiz')}
            style={{
              backgroundColor: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Take Quiz
          </button>

          <button
            onClick={() => trackClick('Download Notes')}
            style={{
              backgroundColor: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Download Notes
          </button>
        </div>

        {/* Notes */}
        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: '12px',
          padding: '32px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: '0 0 16px'
          }}>
            Lesson Notes
          </h2>

          <p style={{
            color: '#ccc',
            lineHeight: '1.8',
            fontSize: '16px',
            margin: 0
          }}>
            {content.body}
          </p>
        </div>
      </div>
    </main>
  )
}