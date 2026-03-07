-- ============================================================
-- Proof — Initial D1 schema
-- Run with: wrangler d1 execute vouch-db --file=migrations/0001_initial.sql
-- ============================================================

-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,                    -- nanoid, e.g. "acc_abc123"
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL DEFAULT '',
  name TEXT,
  plan TEXT NOT NULL DEFAULT 'free',      -- 'free' | 'pro'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);

-- Widgets
CREATE TABLE IF NOT EXISTS widgets (
  id TEXT PRIMARY KEY,                    -- 'wgt_' + nanoid
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'grid',      -- 'grid' | 'carousel' | 'badge'
  config TEXT NOT NULL DEFAULT '{}',      -- JSON: { theme: 'light'|'dark', layout: string }
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_widgets_account ON widgets(account_id);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,                    -- 'tst_' + nanoid
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  widget_id TEXT REFERENCES widgets(id) ON DELETE SET NULL,
  form_id TEXT,
  display_name TEXT NOT NULL,
  author_email TEXT,                      -- kept private, not shown publicly
  display_text TEXT NOT NULL,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  company TEXT,
  title TEXT,
  avatar_url TEXT,
  source TEXT NOT NULL DEFAULT 'form',    -- 'form' | 'manual' | 'import'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_testimonials_account ON testimonials(account_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(account_id, status);
CREATE INDEX IF NOT EXISTS idx_testimonials_widget ON testimonials(widget_id);

-- Collection forms (links that collect testimonials from customers)
CREATE TABLE IF NOT EXISTS collection_forms (
  id TEXT PRIMARY KEY,                    -- 'frm_' + nanoid
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  widget_id TEXT REFERENCES widgets(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  prompt TEXT,                            -- custom ask prompt
  require_rating INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_forms_account ON collection_forms(account_id);

-- Events (analytics — widget views, testimonial impressions)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
  widget_id TEXT REFERENCES widgets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                     -- 'view' | 'impression' | 'click'
  meta TEXT,                              -- JSON
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_account ON events(account_id);
CREATE INDEX IF NOT EXISTS idx_events_widget ON events(widget_id);
