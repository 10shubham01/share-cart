-- Database Setup for ShareCart Application
-- Run these statements in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Users are managed by Supabase Auth (auth.users table)
-- No custom users table needed

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Friend requests table (for tracking invitations)
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
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

-- Shopping lists table (now friend-based instead of group-based)
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  shared_with_friends BOOLEAN NOT NULL DEFAULT FALSE,
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

-- Shopping list shares table (for sharing with friends)
CREATE TABLE IF NOT EXISTS shopping_list_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shopping_list_id, user_id)
);

-- Expenses table (now friend-based instead of group-based)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  purchase_date DATE NOT NULL,
  store_name TEXT,
  receipt_url TEXT,
  notes TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
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

-- Expense shares table (for sharing with friends)
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
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user_id ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user_id ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_grocery_items_category_id ON grocery_items(category_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_created_by ON shopping_lists(created_by);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_shopping_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_shares_shopping_list_id ON shopping_list_shares(shopping_list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_shares_user_id ON shopping_list_shares(user_id);
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
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_shares ENABLE ROW LEVEL SECURITY;
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

-- Friends policies
CREATE POLICY "Users can view their own friends" ON friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friend relationships" ON friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own friend relationships" ON friends FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete their own friend relationships" ON friends FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend requests policies
CREATE POLICY "Users can view friend requests they sent or received" ON friend_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can create friend requests" ON friend_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can update friend requests they received" ON friend_requests FOR UPDATE USING (auth.uid() = to_user_id);
CREATE POLICY "Users can delete friend requests they sent" ON friend_requests FOR DELETE USING (auth.uid() = from_user_id);

-- Shopping lists policies
CREATE POLICY "Users can view their own shopping lists" ON shopping_lists FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can view shared shopping lists" ON shopping_lists FOR SELECT USING (id IN (SELECT shopping_list_id FROM shopping_list_shares WHERE user_id = auth.uid()));
CREATE POLICY "Users can create shopping lists" ON shopping_lists FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own shopping lists" ON shopping_lists FOR UPDATE USING (auth.uid() = created_by);

-- Shopping list shares policies
CREATE POLICY "Users can view shopping list shares" ON shopping_list_shares FOR SELECT USING (auth.uid() = user_id OR shopping_list_id IN (SELECT id FROM shopping_lists WHERE created_by = auth.uid()));
CREATE POLICY "Users can create shopping list shares" ON shopping_list_shares FOR INSERT WITH CHECK (shopping_list_id IN (SELECT id FROM shopping_lists WHERE created_by = auth.uid()));
CREATE POLICY "Users can update shopping list shares" ON shopping_list_shares FOR UPDATE USING (auth.uid() = user_id OR shopping_list_id IN (SELECT id FROM shopping_lists WHERE created_by = auth.uid()));

-- Expenses policies
CREATE POLICY "Users can view their own expenses" ON expenses FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own expenses" ON expenses FOR UPDATE USING (auth.uid() = created_by);

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id); 