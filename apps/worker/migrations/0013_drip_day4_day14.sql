-- Drip emails: Day 4 (no-testimonials nudge) + Day 14 (win-back)
-- Issue #243: conditional — only fire when testimonial_count === 0
ALTER TABLE accounts ADD COLUMN drip_day4_sent_at TEXT;   -- ISO timestamp, NULL = not sent
ALTER TABLE accounts ADD COLUMN drip_day14_sent_at TEXT;  -- ISO timestamp, NULL = not sent
