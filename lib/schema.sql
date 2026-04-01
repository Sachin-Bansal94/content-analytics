-- CONTENT TABLES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  video_url TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANALYTICS TABLES
CREATE TABLE IF NOT EXISTS button_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  button_label TEXT NOT NULL,
  content_id UUID REFERENCES contents(id),
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  content_id UUID REFERENCES contents(id),
  watched_seconds INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scroll_depth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content_id UUID REFERENCES contents(id),
  max_depth_percent INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- PERFORMANCE INDEXES (mention these in your README!)
CREATE INDEX IF NOT EXISTS idx_button_clicks_content 
  ON button_clicks (content_id, clicked_at DESC);

CREATE INDEX IF NOT EXISTS idx_watch_events_video 
  ON watch_events (video_id);

CREATE INDEX IF NOT EXISTS idx_watch_events_content 
  ON watch_events (content_id);

CREATE INDEX IF NOT EXISTS idx_scroll_content 
  ON scroll_depth (content_id);