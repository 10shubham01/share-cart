# Database Setup Guide

## Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor

## Step 2: Run Database Setup
1. Copy the contents of `database-setup.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute all the statements

## Step 3: Verify Setup
1. Go to the "Table Editor" in your Supabase dashboard
2. You should see these tables:
   - `groups`
   - `group_members`
   - `categories`
   - `grocery_items`
   - `shopping_lists`
   - `shopping_list_items`
   - `expenses`
   - `expense_items`
   - `expense_shares`
   - `notifications`

## Step 4: Test Authentication
1. Visit `http://localhost:3001/test-auth` (note the port is 3001)
2. Try the "Test Sign Up" and "Test Sign In" buttons
3. Check the browser console for any errors

## Step 5: Test Google OAuth
1. Go to `http://localhost:3001/login`
2. Click "Continue with Google"
3. Complete the Google sign-in process

## Important Notes:
- **No custom users table**: The application uses Supabase's default `auth.users` table
- **Google OAuth**: Users created via Google OAuth are automatically stored in `auth.users`
- **User profiles**: User data is retrieved from Supabase auth metadata
- **RLS Policies**: Basic RLS policies are included in the setup script

## Troubleshooting:
- If you get "relation does not exist" errors, make sure you ran the SQL script
- If Google OAuth doesn't work, check your Supabase OAuth settings
- If you get permission errors, check that RLS policies are correctly applied 