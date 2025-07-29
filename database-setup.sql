-- Database Setup for ShareCart Application
-- Run these statements in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Users are managed by Supabase Auth (auth.users table)
-- No custom users table needed

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grocery items table
CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  default_price DECIMAL(10,2),
  unit TEXT NOT NULL DEFAULT 'piece',
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping list items table
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  grocery_item_id UUID NOT NULL REFERENCES grocery_items(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  price_per_unit DECIMAL(10,2),
  notes TEXT,
  is_purchased BOOLEAN NOT NULL DEFAULT FALSE,
  purchased_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE SET NULL,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  purchase_date DATE NOT NULL,
  store_name TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense items table
CREATE TABLE IF NOT EXISTS expense_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  grocery_item_id UUID NOT NULL REFERENCES grocery_items(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense shares table
CREATE TABLE IF NOT EXISTS expense_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(expense_id, user_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
-- Note: auth.users table indexes are managed by Supabase
CREATE INDEX IF NOT EXISTS idx_groups_admin_id ON groups(admin_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_category_id ON grocery_items(category_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_group_id ON shopping_lists(group_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_created_by ON shopping_lists(created_by);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_shopping_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expense_items_expense_id ON expense_items(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_shares_expense_id ON expense_shares(expense_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Insert default categories (using a more robust approach)
INSERT INTO categories (name, color, icon) 
SELECT * FROM (VALUES
  ('Fruits & Vegetables', '#10B981', 'i-lucide-apple'),
  ('Dairy & Eggs', '#F59E0B', 'i-lucide-milk'),
  ('Meat & Fish', '#EF4444', 'i-lucide-fish'),
  ('Grains & Bread', '#8B5CF6', 'i-lucide-wheat'),
  ('Snacks & Beverages', '#06B6D4', 'i-lucide-coffee'),
  ('Household & Cleaning', '#6B7280', 'i-lucide-spray'),
  ('Personal Care', '#EC4899', 'i-lucide-heart'),
  ('Frozen Foods', '#3B82F6', 'i-lucide-snowflake'),
  ('Canned & Packaged', '#F97316', 'i-lucide-package'),
  ('Beverages', '#84CC16', 'i-lucide-glass-water')
) AS v(name, color, icon)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE categories.name = v.name);

-- Enable Row Level Security (RLS)
-- Note: auth.users table RLS is managed by Supabase
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you may want to customize these)
-- Note: auth.users table policies are managed by Supabase

-- Categories are readable by all authenticated users
CREATE POLICY "Categories are readable by all users" ON categories FOR SELECT USING (auth.role() = 'authenticated');

-- Grocery items are readable by all authenticated users
CREATE POLICY "Grocery items are readable by all users" ON grocery_items FOR SELECT USING (auth.role() = 'authenticated');

-- Users can create grocery items
CREATE POLICY "Users can create grocery items" ON grocery_items FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update grocery items they created
CREATE POLICY "Users can update own grocery items" ON grocery_items FOR UPDATE USING (auth.uid() = created_by);

-- Basic policies for other tables (you may want to add more specific policies)
CREATE POLICY "Users can view own groups" ON groups FOR SELECT USING (auth.uid() = admin_id OR auth.uid() IN (SELECT user_id FROM group_members WHERE group_id = groups.id AND status = 'accepted'));

CREATE POLICY "Users can view own shopping lists" ON shopping_lists FOR SELECT USING (auth.uid() = created_by OR group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND status = 'accepted'));

CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = created_by OR group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND status = 'accepted'));

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id); 