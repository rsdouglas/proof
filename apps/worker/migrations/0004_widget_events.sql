-- Widget analytics events
-- Tracks impressions, views, and clicks per widget
-- No PII stored — just counts + country code

CREATE TABLE IF NOT EXISTS widget_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  widget_id  TEXT    NOT NULL,
  event_type TEXT    NOT NULL, -- 'impression' | 'view' | 'click'
  country    TEXT,             -- CF-IPCountry header value, nullable
  created_at INTEGER NOT NULL  -- Unix timestamp (seconds)
);

CREATE INDEX IF NOT EXISTS idx_widget_events_widget_id ON widget_events(widget_id);
CREATE INDEX IF NOT EXISTS idx_widget_events_created_at ON widget_events(created_at);
CREATE INDEX IF NOT EXISTS idx_widget_events_widget_type ON widget_events(widget_id, event_type, created_at);
