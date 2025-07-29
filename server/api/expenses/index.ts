import { createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

const getUserGroupIds = async (supabase: any, userId: string) => {
  const { data: groupMembers } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
  
  return groupMembers?.map((gm: any) => gm.group_id) || []
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const supabase = await serverSupabaseClient<Database>(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  if (method === 'GET') {
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        *,
        expense_items (
          *,
          grocery_item:grocery_items (
            id,
            name,
            unit,
            category_id
          )
        )
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return expenses
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const { grocery_item_id, quantity, price_per_unit, total_amount, purchase_date, store_name, notes } = body

    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        total_amount,
        purchase_date,
        store_name,
        notes,
        created_by: user.id
      })
      .select()
      .single()

    if (expenseError) {
      throw createError({ statusCode: 500, statusMessage: expenseError.message })
    }

    const { error: itemError } = await supabase
      .from('expense_items')
      .insert({
        expense_id: expense.id,
        grocery_item_id,
        quantity,
        price_per_unit,
        total_price: total_amount
      })

    if (itemError) {
      throw createError({ statusCode: 500, statusMessage: itemError.message })
    }

    return expense
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
}) 