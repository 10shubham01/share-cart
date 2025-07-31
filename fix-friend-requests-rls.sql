-- Fix Friend Requests RLS Policy
-- Run this in your Supabase SQL Editor

-- Drop both existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can update friend requests they received" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can update friend requests they sent or received" ON public.friend_requests;

-- Create the new policy that allows both sender and recipient to update
CREATE POLICY "Users can update friend requests they sent or received" ON public.friend_requests FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id); 