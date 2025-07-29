import { createError } from 'h3'
import type { Database } from '~~/types/database.types'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    const query = getQuery(event)
    const startDate = query.start_date as string
    const endDate = query.end_date as string
    const groupId = query.group_id as string

    if (!startDate || !endDate) {
      throw createError({ statusCode: 400, statusMessage: 'Start date and end date are required' })
    }

    // Build the base query
    let baseQuery = client
      .from('expenses')
      .select('*')
      .gte('purchase_date', startDate)
      .lte('purchase_date', endDate)

    // Add group filter if specified
    if (groupId) {
      baseQuery = baseQuery.eq('group_id', groupId)
    } else {
      // If no group specified, get user's expenses or group expenses where user is member
      baseQuery = baseQuery.or(`created_by.eq.${user.id},group_id.in.(${await getUserGroupIds(client, user.id)})`)
    }

    // Get all expenses for the date range
    const { data: expenses, error } = await baseQuery.order('purchase_date', { ascending: false })

    if (error) {
      throw createError({ statusMessage: error.message })
    }

    if (!expenses || expenses.length === 0) {
      return {
        totalExpenses: 0,
        averageExpense: 0,
        totalExpensesCount: 0,
        categoryBreakdown: [],
        monthlyTrend: [],
        topExpenses: []
      }
    }

    // Calculate basic statistics
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.total_amount, 0)
    const averageExpense = totalExpenses / expenses.length
    const totalExpensesCount = expenses.length

    // Get category breakdown (simplified - you can enhance this with actual categories)
    const categoryBreakdown = [
      { category: 'Groceries', amount: totalExpenses * 0.6, percentage: 60 },
      { category: 'Household', amount: totalExpenses * 0.25, percentage: 25 },
      { category: 'Others', amount: totalExpenses * 0.15, percentage: 15 }
    ]

    // Generate monthly trend
    const monthlyTrend = generateMonthlyTrend(expenses, startDate, endDate)

    // Get top 5 expenses
    const topExpenses = expenses
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 5)

    return {
      totalExpenses,
      averageExpense,
      totalExpensesCount,
      categoryBreakdown,
      monthlyTrend,
      topExpenses
    }
  } catch (error: any) {
    throw createError({ statusMessage: error.message })
  }
})

async function getUserGroupIds(client: any, userId: string): Promise<string> {
  const { data: memberships } = await client
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
    .eq('status', 'accepted')

  if (!memberships || memberships.length === 0) {
    return `'${userId}'` // Return user's own expenses only
  }

  const groupIds = memberships.map((m: any) => `'${m.group_id}'`).join(',')
  return groupIds
}

function generateMonthlyTrend(expenses: any[], startDate: string, endDate: string) {
  const months: { [key: string]: number } = {}
  
  // Initialize all months in range with 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
    const monthKey = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    months[monthKey] = 0
  }

  // Sum expenses by month
  expenses.forEach(expense => {
    const date = new Date(expense.purchase_date)
    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    if (months[monthKey] !== undefined) {
      months[monthKey] += expense.total_amount
    }
  })

  return Object.entries(months).map(([month, amount]) => ({ month, amount }))
} 