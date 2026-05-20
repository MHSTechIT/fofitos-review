-- FOFiTOS Menu Schema
-- Run this in the Supabase SQL Editor before running seed.sql

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  img TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  cat TEXT REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  img TEXT,
  tagline TEXT,
  price TEXT,
  rating DECIMAL(3,1) DEFAULT 4.0,
  reviews INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]',
  cal INTEGER DEFAULT 0,
  pro INTEGER DEFAULT 0,
  carb INTEGER DEFAULT 0,
  fat INTEGER DEFAULT 0,
  fibre INTEGER DEFAULT 0,
  nutrition JSONB DEFAULT '[]',
  ingr JSONB DEFAULT '[]',
  revs JSONB DEFAULT '[]'
);

-- Open RLS policies (suitable for internal admin use; add auth later if needed)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_products" ON products FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Anonymous',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);

-- Slide colour columns (run as migration if schema already applied)
ALTER TABLE products ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#F2E4D8';
ALTER TABLE products ADD COLUMN IF NOT EXISTS arch_color TEXT DEFAULT '#6B3520';
