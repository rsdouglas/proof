-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  password_hash TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  form_id TEXT,
  display_name TEXT NOT NULL,
  submitter_email TEXT,
  display_text TEXT NOT NULL,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  company TEXT,
  title TEXT,
  avatar_url TEXT,
  source TEXT NOT NULL DEFAULT 'form',  -- 'form' | 'manual' | 'import'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_testimonials_account ON testimonials(account_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(account_id, status);

-- Widgets
CREATE TABLE IF NOT EXISTS widgets (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'grid', -- 'grid' | 'carousel' | 'badge' | 'popup'
  config TEXT NOT NULL DEFAULT '{}',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_widgets_account ON widgets(account_id);

-- Collection forms
CREATE TABLE IF NOT EXISTS collection_forms (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fields TEXT NOT NULL DEFAULT '["name","email","text","rating"]',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_forms_account ON collection_forms(account_id);

-- Analytics events (impressions, clicks)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL,
  widget_id TEXT,
  event_type TEXT NOT NULL, -- 'impression' | 'click' | 'conversion'
  metadata TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_widget ON events(widget_id, created_at);
