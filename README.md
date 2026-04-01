# Content Analytics Platform

A full-stack web application that serves structured learning content (Books → Chapters → Content) and tracks how users interact with it in real time.

Live URL:(https://content-analytics-git-main-sachin-bansal94s-projects.vercel.app)

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [System Architecture](#system-architecture)
5. [Analytics Implementation](#analytics-implementation)
6. [Performance Decisions](#performance-decisions)
7. [Third Analytic — Scroll Depth](#third-analytic--scroll-depth)
8. [Local Setup Instructions](#local-setup-instructions)

---

## Project Overview

LearnHub is a content analytics platform where users can browse books, read chapters, watch lesson videos, and interact with content. Every interaction — button clicks, video watch time, and scroll depth — is tracked in real time and visualized on a dedicated analytics dashboard.

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js 15 (App Router) | Server components, file-based routing, full-stack in one codebase |
| Backend | Next.js API Routes | No separate server needed, deployed alongside frontend |
| Database | PostgreSQL (Neon) | Relational model fits hierarchical content, strong aggregation support |
| ORM / Client | @neondatabase/serverless | HTTP-based connection works on Vercel serverless functions |
| Charts | Recharts | Lightweight, composable React chart library |
| Hosting | Vercel | Zero-config Next.js deployment, auto-deploy on git push |

---

## Database Schema

### Content Tables

These tables store the learning content hierarchy.

```sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  video_url TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Why UUID as primary key?
UUIDs are globally unique across tables and environments. Unlike auto-increment integers, UUIDs can be generated on the client side without a database round-trip, and they do not expose record counts to end users.

Why `ON DELETE CASCADE`?
If a book is deleted, all its chapters and contents are automatically deleted too. This prevents orphaned rows and keeps the database consistent without extra application logic.

---

### Analytics Tables

These tables store raw user interaction events. They are append-only — we never update or delete rows, only insert new ones. This is a deliberate architectural choice explained in the Performance Decisions section.

```sql
CREATE TABLE button_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  button_label TEXT NOT NULL,
  content_id UUID REFERENCES contents(id),
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE watch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  content_id UUID REFERENCES contents(id),
  watched_seconds INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE scroll_depth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content_id UUID REFERENCES contents(id),
  max_depth_percent INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

Why separate tables per event type?
Each event type has a different schema. Mixing them into one generic `events` table with a `type` column would make queries slower and schemas harder to enforce. Separate tables allow targeted indexing and cleaner SQL.

Why `TIMESTAMPTZ` instead of `TIMESTAMP`?
`TIMESTAMPTZ` stores time in UTC and converts to local timezone on read. This ensures consistent analytics regardless of where the server or user is located.

---

### Performance Indexes

```sql
CREATE INDEX idx_button_clicks_content
  ON button_clicks (content_id, clicked_at DESC);

CREATE INDEX idx_watch_events_video
  ON watch_events (video_id);

CREATE INDEX idx_watch_events_content
  ON watch_events (content_id);

CREATE INDEX idx_scroll_content
  ON scroll_depth (content_id);
```

---

## System Architecture

```
Browser (React / Next.js Client Components)
        |
        | HTTP requests (fetch API)
        |
Next.js Server (Vercel Serverless Functions)
   |              |
   |              |
Page Routes    API Routes
(SSR)          (REST endpoints)
        |
        | SQL via @neondatabase/serverless (HTTPS)
        |
PostgreSQL Database (Neon)
```

### Key architectural decisions

Server Components for content pages

The books listing page, chapters page, and lessons page are all Next.js Server Components. This means the database query runs on the server and the HTML is sent to the browser fully rendered. Benefits:

- Faster page loads — no client-side loading spinner for content
- Better SEO — content is in the HTML, not fetched after page load
- Simpler code — no `useEffect` or loading state needed for content

Client Components only where needed

The content viewer page (`/content/[contentId]`) is a Client Component because it needs browser APIs — `addEventListener` for scroll tracking, `Date.now()` for timing video watch events, and `localStorage` for user ID persistence. All other pages are server-rendered.

Direct database queries in server components

Rather than server components fetching from their own API routes (which would be an unnecessary extra network hop), server components query the database directly using the Neon client. API routes exist only for client-side event tracking (POST requests from the browser).

Session-based user identification

User IDs are generated using `Math.random()` and stored in `localStorage`. This is intentional — and later on we will also integrate authentications, and session-based IDs are sufficient to track per-user behavior within a session. The ID persists across page navigations within the same browser.

---

## Analytics Implementation

### A. Button Click Tracking

When a user clicks any interactive button (Mark as Complete, Take Quiz, Download Notes), a POST request is sent to `/api/events/click` with the user ID, button label, and content ID. The event is inserted into the `button_clicks` table immediately.

The analytics dashboard groups these by `button_label` and `content_id` to show which buttons are most clicked on which lessons.

```sql
SELECT
  bc.button_label,
  bc.content_id,
  c.title as content_title,
  COUNT(*) as total_clicks
FROM button_clicks bc
LEFT JOIN contents c ON bc.content_id = c.id
GROUP BY bc.button_label, bc.content_id, c.title
ORDER BY total_clicks DESC
```

### B. Video Watch Time Tracking

Watch time is tracked using the HTML5 `<video>` element's `onPlay` and `onPause` events. When the video plays, we record `Date.now()`. When it pauses or ends, we calculate the difference in seconds and POST to `/api/events/watch`.

This approach captures **meaningful watch time** — not just "video started" signals. A user who plays and pauses multiple times will generate multiple events, and the dashboard shows both average and total seconds watched per video.

### C. Scroll Depth Tracking

Explained in detail in the next section.

---

## Third Analytic — Scroll Depth

**What it tracks:** How far down a content page a user scrolls, expressed as a percentage (0–100%).

**Why this metric?**

Scroll depth answers a critical product question: **Are users actually reading the content, or are they abandoning it after the video?**

A page with high video watch time but low scroll depth tells you users watch the video but skip the written notes. A page with high scroll depth tells you the written content is engaging. This insight helps content creators know whether to invest more in video or written explanations.

How it works:

A scroll event listener is attached to the window. To avoid sending hundreds of events per scroll, a 1-second debounce is applied — the event is only recorded 1 second after the user stops scrolling. The `max_depth_percent` is calculated as:

```
depth = Math.round((scrollY + windowHeight) / documentHeight * 100)
```

Dashboard visualization: A bar chart showing average scroll depth per content page. Pages with depth below 50% are candidates for content improvement.

---

## Performance Decisions

### 1. Indexes on foreign keys and timestamp columns

Analytics queries filter and group by `content_id`, `video_id`, and timestamps. Without indexes, PostgreSQL would scan every row in the table for every query. With indexes, it jumps directly to the relevant rows.

For example, the index `(content_id, clicked_at DESC)` on `button_clicks` makes the query "show all clicks for this content page, most recent first" extremely fast even with millions of rows.

### 2. Append-only event tables

Analytics events are never updated or deleted — only inserted. This is a standard pattern in analytics systems because:

- Inserts are the fastest database operation
- No locking conflicts between reads and writes
- Event history is preserved for future analysis
- Easier to scale with partitioning or replication later

### 3. Aggregation at query time with GROUP BY

Rather than maintaining pre-computed summary tables, we aggregate raw events at query time using SQL `GROUP BY`, `COUNT`, `AVG`, and `SUM`. For the current data volume this is fast enough, and it always reflects the latest data without any sync delay.

At larger scale (millions of events), this could be replaced with materialized views that refresh periodically — a trade-off between query speed and data freshness.

### 4. Connection pooling via Neon serverless

The `@neondatabase/serverless` client uses HTTP requests instead of persistent TCP connections. This is essential on Vercel where each API route runs as a short-lived serverless function. Traditional PostgreSQL connection pooling (like `pg.Pool`) does not work well in serverless environments because the process exits after each request. The Neon HTTP client is stateless by design and handles this correctly.

### 5. Debounced scroll tracking

Scroll events fire hundreds of times per second. Sending a database INSERT on every scroll event would overwhelm the database and add latency to the user experience. The 1-second debounce means at most one database write per second per user while scrolling — a 99%+ reduction in write volume with no meaningful loss of data quality.

---

## Local Setup Instructions

### Prerequisites

- Node.js 18 or higher
- A Neon account (free tier) at neon.tech
- Git

### Steps

1. Clone the repository

```bash
git clone https://github.com/Sachin-Bansal94/content-analytics.git
cd content-analytics
```

2. Install dependencies

```bash
npm install
```

3. Set up the database

Create a free PostgreSQL database at neon.tech. In the Neon SQL Editor, run the contents of `lib/schema.sql` to create all tables and indexes.

Then seed sample data:

```sql
INSERT INTO books (id, title, description) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Introduction to Web Development', 'Learn HTML, CSS, and JavaScript from scratch'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Database Design Fundamentals', 'Master SQL and database architecture');
```

4. Configure environment variables

Create a `.env.local` file in the project root:

```
DATABASE_URL=your-neon-connection-string-here
```

**5. Run the development server**

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Project Structure

```
content-analytics/
├── app/
│   ├── page.tsx                          # Books listing page
│   ├── books/[bookId]/page.tsx           # Chapters page
│   ├── chapters/[chapterId]/page.tsx     # Lessons listing page
│   ├── content/[contentId]/page.tsx      # Content viewer (video + buttons)
│   ├── analytics/
│   │   ├── page.tsx                      # Analytics dashboard
│   │   └── Charts.tsx                    # Recharts visualizations
│   └── api/
│       ├── books/route.ts
│       ├── books/[bookId]/chapters/route.ts
│       ├── chapters/[chapterId]/contents/route.ts
│       ├── contents/[contentId]/route.ts
│       ├── events/click/route.ts
│       ├── events/watch/route.ts
│       ├── events/scroll/route.ts
│       └── analytics/route.ts
├── lib/
│   ├── db.ts                             # Neon database client
│   ├── schema.sql                        # Database schema
│   └── userId.ts                         # Session-based user ID
└── .env.local                            # Environment variables (not committed)
```
