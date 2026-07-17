-- Replace in-memory progress_store with a shared Postgres table
-- so replay progress works correctly behind multiple API workers.
CREATE TABLE IF NOT EXISTS replay_progress (
  session_key TEXT PRIMARY KEY,  -- "{year}_{event}_{session}"
  message TEXT,
  percent REAL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_replay_progress_updated ON replay_progress (updated_at);
