-- Revised onboarding drip: Day 2 + Day 5 sequence (issue #231)
-- Suppression: ≥1 approved testimonial stops the drip
ALTER TABLE accounts ADD COLUMN drip_day2_sent_at TEXT;   -- ISO timestamp, NULL = not sent
ALTER TABLE accounts ADD COLUMN drip_day5_sent_at TEXT;   -- ISO timestamp, NULL = not sent
