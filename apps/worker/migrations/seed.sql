-- ============================================================
-- Proof — Seed data for local development
-- Run with: wrangler d1 execute proof-db --local --file=migrations/seed.sql
-- ============================================================

-- Dev account (password: "password123" — SHA-256 hashed with account id as salt)
-- Real hash generated at account creation time; this is a placeholder for docs
INSERT OR IGNORE INTO accounts (id, email, password_hash, name, plan, created_at, updated_at) VALUES
  ('acc_dev001', 'dev@example.com', 'dev-password-placeholder', 'Dev User', 'pro', datetime('now'), datetime('now'));

-- Sample widget
INSERT OR IGNORE INTO widgets (id, account_id, name, type, config, active, created_at, updated_at) VALUES
  ('wgt_demo01', 'acc_dev001', 'Homepage Widget', 'grid', '{"theme":"light","layout":"grid"}', 1, datetime('now'), datetime('now'));

-- Sample testimonials
INSERT OR IGNORE INTO testimonials (id, account_id, widget_id, display_name, display_text, rating, company, title, status, featured, created_at, updated_at) VALUES
  ('tst_001', 'acc_dev001', 'wgt_demo01', 'Sarah Chen', 'Proof made it so easy to collect and display testimonials. We saw a 23% increase in demo requests after adding the widget to our homepage!', 5, 'GrowthLoop', 'Marketing Director', 'approved', 1, datetime('now'), datetime('now')),
  ('tst_002', 'acc_dev001', 'wgt_demo01', 'Marcus Rivera', 'Setup took 10 minutes. Testimonials went live the same day. Our conversion rate jumped immediately.', 5, 'Stackline', 'Founder', 'approved', 0, datetime('now'), datetime('now')),
  ('tst_003', 'acc_dev001', 'wgt_demo01', 'Priya Patel', 'I was skeptical, but the results speak for themselves. Customers trust us more now that they can see real feedback from other businesses like theirs.', 4, 'Meadow Bakery', 'Owner', 'approved', 0, datetime('now'), datetime('now')),
  ('tst_004', 'acc_dev001', 'wgt_demo01', 'Jordan Blake', 'Great product, but would love more customization options.', 4, null, null, 'pending', 0, datetime('now'), datetime('now')),
  ('tst_005', 'acc_dev001', 'wgt_demo01', 'Alex Kim', 'This is spammy garbage', 1, null, null, 'rejected', 0, datetime('now'), datetime('now'));

-- Sample collection form
INSERT OR IGNORE INTO collection_forms (id, account_id, widget_id, name, prompt, require_rating, active, created_at, updated_at) VALUES
  ('frm_demo01', 'acc_dev001', 'wgt_demo01', 'Homepage feedback', 'How has Proof helped your business grow?', 1, 1, datetime('now'), datetime('now'));
