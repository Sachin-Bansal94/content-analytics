import Link from 'next/link'

async function getChapters(bookId: string) {
  const res = await fetch(
    `http://localhost:3000/api/books/${bookId}/chapters`,
    { cache: 'no-store' }
  )

  if (!res.ok) {
    throw new Error('Failed to fetch chapters')
  }

  return res.json()
}

export default async function BookPage({ 
  params 
}: { 
  params: Promise<{ bookId: string }>   // ✅ FIXED TYPE
}) {

  const { bookId } = await params;      // ✅ UNWRAP PARAMS

  const chapters = await getChapters(bookId)

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
        alignItems: 'center'
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
        padding: '60px 40px',
        maxWidth: '700px',
        margin: '0 auto'
      }}>
        <Link href="/" style={{
          color: '#888',
          textDecoration: 'none',
          fontSize: '14px'
        }}>
          ← Back to Library
        </Link>

        <p style={{ color: '#888', fontSize: '14px', margin: '32px 0 8px' }}>
          CHAPTERS
        </p>
        <h2 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 40px' }}>
          Course Contents
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {chapters.map((chapter: any, index: number) => (
            <Link
              key={chapter.id}
              href={`/chapters/${chapter.id}`}
              style={{ textDecoration: 'none' }}
            >
              {/* ✅ FIXED CARD (no event handlers) */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#555] rounded-[10px] p-6 flex items-center gap-5 cursor-pointer transition-colors duration-200">
                
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#1e1e2e',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6c47ff',
                  fontWeight: '700',
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>

                <div>
                  <h3 style={{
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 4px'
                  }}>
                    {chapter.title}
                  </h3>
                  <p style={{
                    color: '#888',
                    fontSize: '13px',
                    margin: 0
                  }}>
                    Click to view lessons
                  </p>
                </div>

                <span style={{
                  marginLeft: 'auto',
                  color: '#555',
                  fontSize: '18px'
                }}>
                  →
                </span>

              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}