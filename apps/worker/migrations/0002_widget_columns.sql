-- Add theme, layout, slug columns to widgets
ALTER TABLE widgets ADD COLUMN slug TEXT;
ALTER TABLE widgets ADD COLUMN theme TEXT NOT NULL DEFAULT 'light';
ALTER TABLE widgets ADD COLUMN layout TEXT NOT NULL DEFAULT 'grid';
