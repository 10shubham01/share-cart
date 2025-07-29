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
    const [totalGroups, totalItems, totalExpenses, monthlyExpenses] = await Promise.all([
      supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'accepted'),
      supabase
        .from('grocery_items')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('expenses')
        .select('total_amount')
        .eq('created_by', user.id),
      supabase
        .from('expenses')
        .select('total_amount')
        .eq('created_by', user.id)
        .gte('purchase_date', new Date().toISOString().slice(0, 7) + '-01')
    ])

    const totalExpensesAmount = totalExpenses.data?.reduce((sum, expense) => sum + expense.total_amount, 0) || 0
    const monthlySpending = monthlyExpenses.data?.reduce((sum, expense) => sum + expense.total_amount, 0) || 0

    return {
      totalExpenses: totalExpensesAmount,
      totalGroups: totalGroups.count || 0,
      totalItems: totalItems.count || 0,
      monthlySpending
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}) 