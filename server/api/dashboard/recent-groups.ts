import { createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data: groups, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members!inner (
        user_id,
        status
      )
    `)
    .eq('group_members.user_id', user.id)
    .eq('group_members.status', 'accepted')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return groups
}) 