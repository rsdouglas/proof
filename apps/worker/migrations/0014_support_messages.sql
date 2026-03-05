-- Migration 0014: support inbox table for inbound email via Resend webhooks
CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'open'
);
CREATE INDEX IF NOT EXISTS idx_support_messages_received_at ON support_messages(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON support_messages(status);
