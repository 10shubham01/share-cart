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
  const { items, purchase_date, store_name, notes } = body

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Items array is required' })
  }

  const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price_per_unit), 0)

  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      total_amount: totalAmount,
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

  const expenseItems = items.map((item: any) => ({
    expense_id: expense.id,
    grocery_item_id: item.id,
    quantity: item.quantity,
    price_per_unit: item.price_per_unit,
    total_price: item.quantity * item.price_per_unit
  }))

  const { error: itemsError } = await supabase
    .from('expense_items')
    .insert(expenseItems)

  if (itemsError) {
    throw createError({ statusCode: 500, statusMessage: itemsError.message })
  }

  return expense
}) 