-- Fix categories table unique constraint
-- Run this if you get the ON CONFLICT error

-- First, drop the existing categories table if it exists
DROP TABLE IF EXISTS categories CASCADE;

-- Recreate the categories table with proper unique constraint
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, color, icon) VALUES
  ('Fruits & Vegetables', '#10B981', 'i-lucide-apple'),
  ('Dairy & Eggs', '#F59E0B', 'i-lucide-milk'),
  ('Meat & Fish', '#EF4444', 'i-lucide-fish'),
  ('Grains & Bread', '#8B5CF6', 'i-lucide-wheat'),
  ('Snacks & Beverages', '#06B6D4', 'i-lucide-coffee'),
  ('Household & Cleaning', '#6B7280', 'i-lucide-spray'),
  ('Personal Care', '#EC4899', 'i-lucide-heart'),
  ('Frozen Foods', '#3B82F6', 'i-lucide-snowflake'),
  ('Canned & Packaged', '#F97316', 'i-lucide-package'),
  ('Beverages', '#84CC16', 'i-lucide-glass-water');

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Categories are readable by all users" ON categories FOR SELECT USING (auth.role() = 'authenticated'); 