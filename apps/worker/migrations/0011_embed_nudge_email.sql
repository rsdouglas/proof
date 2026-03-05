-- Add embed_nudge_email_sent_at to accounts to prevent duplicate emails
ALTER TABLE accounts ADD COLUMN embed_nudge_email_sent_at TEXT;
