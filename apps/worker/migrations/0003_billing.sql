-- Add billing columns to accounts
ALTER TABLE accounts ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE accounts ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE accounts ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE accounts ADD COLUMN plan_status TEXT NOT NULL DEFAULT 'active'; -- active, past_due, canceled
ALTER TABLE accounts ADD COLUMN plan_updated_at TEXT;
