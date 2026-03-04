-- Agent registration support
-- Adds email_verified flag for agent-registered accounts
-- Agent accounts don't have a password until the user sets one via magic link

ALTER TABLE accounts ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;

-- Index for agent status endpoint
CREATE INDEX IF NOT EXISTS idx_accounts_email_verified ON accounts(email, email_verified);
