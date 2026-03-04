-- Track when a widget has been verified as embedded on a customer's domain
ALTER TABLE widgets ADD COLUMN embed_verified_at TEXT;
ALTER TABLE widgets ADD COLUMN embed_domain TEXT;
