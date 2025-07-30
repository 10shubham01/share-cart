import { createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    const [totalFriends, totalItems, pendingRequests] = await Promise.all([
      supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'accepted'),
      supabase
        .from('grocery_items')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('friend_requests')
        .select('*', { count: 'exact', head: true })
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
    ])

    return {
      totalFriends: totalFriends.count || 0,
      totalItems: totalItems.count || 0,
      pendingRequests: pendingRequests.count || 0
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}) 