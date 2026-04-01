import Link from 'next/link';
import sql from '@/lib/db'; 

// 1. Define the Book interface
interface Book {
  id: string;
  title: string;
  description: string | null;
  created_at: Date;
}
// previously we were using client side rendering as we were fetching data through an api call but now we are calling DB directly 
// through the server component by connecting the sql directly with db.ts, and it make the rendering faster.

async function getBooks(): Promise<Book[]> {
  try {
    
    const result = await sql`
      SELECT id, title, description 
      FROM books 
      ORDER BY created_at DESC
    `;
    
    return result as unknown as Book[];
  } catch (error) {
    console.error("Database fetch failed:", error);
    return [];
  }
}

export default async function HomePage() {
  const books = await getBooks();

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#0f0f0f',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Navigation Header */}
      <nav style={{
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
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>
          LearnHub
        </h1>
        
        {/*Using Tailwind for hover instead of JS event handlers */}
        <Link 
          href="/analytics" 
          className="text-[#888] hover:text-white transition-colors duration-200 no-underline text-[14px] font-medium"
        >
          Analytics Dashboard
        </Link>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '80px 40px 40px',
        maxWidth: '1100px',
        margin: '0 auto'
      }}>
        <header style={{ marginBottom: '50px' }}>
          <p style={{ 
            color: '#6c47ff', 
            fontSize: '12px', 
            fontWeight: '700', 
            letterSpacing: '1.5px', 
            textTransform: 'uppercase',
            marginBottom: '12px' 
          }}>
            Library
          </p>
          <h2 style={{ fontSize: '42px', fontWeight: '800', margin: '0 0 16px', letterSpacing: '-1px' }}>
            All Courses
          </h2>
          <p style={{ color: '#888', fontSize: '18px', maxWidth: '600px', lineHeight: '1.6' }}>
            Expand your knowledge with our curated technical curriculum. Pick a course to begin.
          </p>
        </header>

        {/* Books Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {books.length > 0 ? (
            books.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                {/* Interactivity Note: 'group' and 'hover:' classes are CSS-based, 
                   so they work perfectly in Server Components.
                */}
                <div className="group bg-[#161616] border border-[#262626] hover:border-[#6c47ff] hover:bg-[#1c1c1c] rounded-2xl p-8 cursor-pointer transition-all duration-300 transform hover:-translate-y-1">
                  <div style={{
                    width: '52px',
                    height: '52px',
                    backgroundColor: 'rgba(108, 71, 255, 0.1)',
                    border: '1px solid rgba(108, 71, 255, 0.2)',
                    color: '#6c47ff',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    📚
                  </div>
                  
                  <h3 style={{
                    color: '#fff',
                    fontSize: '20px',
                    fontWeight: '700',
                    margin: '0 0 12px'
                  }}>
                    {book.title}
                  </h3>
                  
                  <p style={{
                    color: '#999',
                    fontSize: '15px',
                    margin: '0 0 24px',
                    lineHeight: '1.6',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '72px'
                  }}>
                    {book.description || "Master the fundamentals of this subject with our structured learning path."}
                  </p>
                  
                  <div style={{
                    color: '#6c47ff',
                    fontSize: '14px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    Start Learning 
                    <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div style={{ 
              gridColumn: '1 / -1', 
              padding: '60px', 
              textAlign: 'center', 
              border: '1px dashed #333', 
              borderRadius: '20px' 
            }}>
              <p style={{ color: '#555', fontSize: '16px' }}>
                No courses found in the database.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}