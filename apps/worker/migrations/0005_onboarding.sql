-- Onboarding drip email tracking
-- Tracks which drip emails have been sent per account to prevent duplicates

ALTER TABLE accounts ADD COLUMN drip_welcome_sent_at TEXT;   -- ISO timestamp, NULL = not sent
ALTER TABLE accounts ADD COLUMN drip_nudge_sent_at TEXT;     -- ISO timestamp, NULL = not sent
ALTER TABLE accounts ADD COLUMN drip_checkin_sent_at TEXT;   -- ISO timestamp, NULL = not sent
