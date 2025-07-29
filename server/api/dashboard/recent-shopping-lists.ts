import { createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data: lists, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return lists
}) 