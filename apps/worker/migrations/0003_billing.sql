-- Add billing status columns to accounts
-- Note: plan, stripe_customer_id, stripe_subscription_id already exist in 0001_initial.sql
-- This migration adds the plan lifecycle columns that were missing from the initial schema.
ALTER TABLE accounts ADD COLUMN plan_status TEXT NOT NULL DEFAULT 'active'; -- active, past_due, canceled
ALTER TABLE accounts ADD COLUMN plan_updated_at TEXT;
