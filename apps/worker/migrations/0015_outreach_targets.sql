-- Migration 0015: outreach_targets table for cold email pipeline
CREATE TABLE IF NOT EXISTS outreach_targets (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  business_name TEXT,
  vertical TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  variant TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_targets(status);
CREATE INDEX IF NOT EXISTS idx_outreach_vertical ON outreach_targets(vertical);
