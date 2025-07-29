import { createError } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return {
    id: user.id,
    email: user.email,
    username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
    full_name: user.user_metadata?.full_name || user.user_metadata?.name,
    avatar_url: user.user_metadata?.avatar_url,
    google_id: user.user_metadata?.sub,
    created_at: user.created_at,
    updated_at: user.updated_at
  }
}) 