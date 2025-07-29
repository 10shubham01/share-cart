import { createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { grocery_item_id, group_id, user_ids, message } = body

  if (!grocery_item_id) {
    throw createError({ statusCode: 400, statusMessage: 'Grocery item ID is required' })
  }

  if (!group_id && (!user_ids || user_ids.length === 0)) {
    throw createError({ statusCode: 400, statusMessage: 'Either group_id or user_ids is required' })
  }

  const shareData = {
    grocery_item_id,
    group_id,
    user_ids,
    message,
    shared_by: user.id
  }

  const { data, error } = await supabase
    .from('expense_shares')
    .insert(shareData)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
}) 