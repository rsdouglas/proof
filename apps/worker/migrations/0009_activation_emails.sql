-- Activation email tracking (issue #198)
-- T+1h nudge and first-testimonial celebration email

ALTER TABLE accounts ADD COLUMN drip_1h_nudge_sent_at TEXT;       -- ISO timestamp, NULL = not sent
ALTER TABLE accounts ADD COLUMN drip_celebration_sent_at TEXT;    -- ISO timestamp, NULL = not sent
