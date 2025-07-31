-- Database Migration Script: Groups to Friends System (Ultra Minimal Version)
-- Run this script in your Supabase SQL editor

-- Step 1: Drop ALL unnecessary tables (this will delete all data in these tables)
-- Note: This will delete all data, so make sure you want to proceed

-- Drop tables in correct order (due to foreign key constraints)
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.friend_requests CASCADE;
DROP TABLE IF EXISTS public.shopping_lists CASCADE;
DROP TABLE IF EXISTS public.shopping_list_shares CASCADE;
DROP TABLE IF EXISTS public.shopping_list_items CASCADE;

-- Step 2: Create public users table for profiles
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_unique UNIQUE (email)
);

-- Step 3: Create new friends table
CREATE TABLE IF NOT EXISTS public.friends (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT friends_pkey PRIMARY KEY (id),
  UNIQUE(user_id, friend_id)
);

-- Step 4: Create new friend_requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT friend_requests_pkey PRIMARY KEY (id),
  UNIQUE(from_user_id, to_user_id)
);

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user_id ON public.friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user_id ON public.friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);

-- Step 6: Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop existing policies (if they exist) and create new RLS policies
-- Users policies
DROP POLICY IF EXISTS "Users can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users can view all user profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Friends policies
DROP POLICY IF EXISTS "Users can view their own friends" ON public.friends;
DROP POLICY IF EXISTS "Users can create friend relationships" ON public.friends;
DROP POLICY IF EXISTS "Users can update their own friend relationships" ON public.friends;
DROP POLICY IF EXISTS "Users can delete their own friend relationships" ON public.friends;

CREATE POLICY "Users can view their own friends" ON public.friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friend relationships" ON public.friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own friend relationships" ON public.friends FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete their own friend relationships" ON public.friends FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend requests policies
DROP POLICY IF EXISTS "Users can view friend requests they sent or received" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can create friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can update friend requests they received" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can delete friend requests they sent" ON public.friend_requests;

CREATE POLICY "Users can view friend requests they sent or received" ON public.friend_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can create friend requests" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can update friend requests they received" ON public.friend_requests FOR UPDATE USING (auth.uid() = to_user_id);
CREATE POLICY "Users can delete friend requests they sent" ON public.friend_requests FOR DELETE USING (auth.uid() = from_user_id);

-- Step 8: Create function to handle user creation/updates
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'user_name',
      SPLIT_PART(NEW.email, '@', 1) -- Fallback to email prefix
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create trigger to automatically sync users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 10: Clean up existing duplicates and sync existing users
-- First, remove duplicates keeping only the latest entry for each email
DELETE FROM public.users 
WHERE id NOT IN (
  SELECT DISTINCT ON (email) id 
  FROM public.users 
  ORDER BY email, updated_at DESC
);

-- Then sync existing users
INSERT INTO public.users (id, email, full_name, avatar_url)
SELECT 
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    raw_user_meta_data->>'username',
    raw_user_meta_data->>'user_name',
    SPLIT_PART(email, '@', 1) -- Fallback to email prefix
  ),
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, users.full_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
  updated_at = now();

-- Migration Complete!
-- Your database now only contains:
-- 1. grocery_items (preserved)
-- 2. users (new - for user profiles, auto-synced with auth.users)
-- 3. friends (new)
-- 4. friend_requests (new) 