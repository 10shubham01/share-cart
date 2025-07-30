-- Backup Existing Data Script (Ultra Minimal Version)
-- Run this BEFORE running the migration script if you want to preserve any data

-- Create backup tables for existing data (only tables that will be dropped)
CREATE TABLE IF NOT EXISTS backup_groups AS SELECT * FROM public.groups;
CREATE TABLE IF NOT EXISTS backup_group_members AS SELECT * FROM public.group_members;
CREATE TABLE IF NOT EXISTS backup_expenses AS SELECT * FROM public.expenses;
CREATE TABLE IF NOT EXISTS backup_notifications AS SELECT * FROM public.notifications;
CREATE TABLE IF NOT EXISTS backup_user_profiles AS SELECT * FROM public.user_profiles;
CREATE TABLE IF NOT EXISTS backup_categories AS SELECT * FROM public.categories;
CREATE TABLE IF NOT EXISTS backup_friend_requests AS SELECT * FROM public.friend_requests;
CREATE TABLE IF NOT EXISTS backup_shopping_lists AS SELECT * FROM public.shopping_lists;
CREATE TABLE IF NOT EXISTS backup_shopping_list_shares AS SELECT * FROM public.shopping_list_shares;
CREATE TABLE IF NOT EXISTS backup_shopping_list_items AS SELECT * FROM public.shopping_list_items;

-- Add backup timestamp
ALTER TABLE backup_groups ADD COLUMN backup_created_at timestamp with time zone DEFAULT now();
ALTER TABLE backup_group_members ADD COLUMN backup_created_at timestamp with time zone DEFAULT now();
ALTER TABLE backup_expenses ADD COLUMN backup_created_at timestamp with time zone DEFAULT now();
ALTER TABLE backup_notifications ADD COLUMN backup_created_at timestamp with time zone DEFAULT now();
ALTER TABLE backup_user_profiles ADD COLUMN backup_created_at timestamp with time zone DEFAULT now();
ALTER TABLE backup_categories ADD COLUMN backup_created_at timestamp with time zone DEFAULT now();
ALTER TABLE backup_friend_requests ADD COLUMN backup_created_at timestamp with time zone DEFAULT now();
ALTER TABLE backup_shopping_lists ADD COLUMN backup_created_at timestamp with time zone DEFAULT now();
ALTER TABLE backup_shopping_list_shares ADD COLUMN backup_created_at timestamp with time zone DEFAULT now();
ALTER TABLE backup_shopping_list_items ADD COLUMN backup_created_at timestamp with time zone DEFAULT now();

-- Create indexes on backup tables
CREATE INDEX IF NOT EXISTS idx_backup_groups_admin_id ON backup_groups(admin_id);
CREATE INDEX IF NOT EXISTS idx_backup_group_members_group_id ON backup_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_backup_group_members_user_id ON backup_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_expenses_user_id ON backup_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_notifications_user_id ON backup_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_user_profiles_id ON backup_user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_backup_categories_name ON backup_categories(name);
CREATE INDEX IF NOT EXISTS idx_backup_friend_requests_sender_id ON backup_friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_backup_friend_requests_receiver_id ON backup_friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_backup_shopping_lists_created_by ON backup_shopping_lists(created_by);
CREATE INDEX IF NOT EXISTS idx_backup_shopping_list_shares_shopping_list_id ON backup_shopping_list_shares(shopping_list_id);
CREATE INDEX IF NOT EXISTS idx_backup_shopping_list_items_shopping_list_id ON backup_shopping_list_items(shopping_list_id);

-- Backup complete! Your data is now safely stored in backup_* tables
-- Note: grocery_items table is preserved and not backed up 