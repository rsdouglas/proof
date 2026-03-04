-- ============================================================
-- API Keys — programmatic access for Zapier / Make / custom integrations
-- ============================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,                      -- 'key_' + nanoid
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                       -- human label, e.g. "Zapier integration"
  key_hash TEXT NOT NULL UNIQUE,            -- SHA-256 hash of the actual key (never stored raw)
  key_prefix TEXT NOT NULL,                 -- first 8 chars of raw key, for display
  last_used_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_keys_account ON api_keys(account_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
