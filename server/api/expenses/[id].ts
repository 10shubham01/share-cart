import { createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
    const method = getMethod(event)
    const supabase = await serverSupabaseClient<Database>(event)
    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const expenseId = getRouterParam(event, 'id')

    if (!expenseId) {
        throw createError({ statusCode: 400, statusMessage: 'Expense ID is required' })
    }

    if (method === 'DELETE') {
        // First check if the expense belongs to the user
        const { data: expense, error: fetchError } = await supabase
            .from('expenses')
            .select('id, created_by')
            .eq('id', expenseId)
            .single()

        if (fetchError) {
            throw createError({ statusCode: 404, statusMessage: 'Expense not found' })
        }

        if (expense.created_by !== user.id) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
        }

        // Delete the expense (cascade will handle related records)
        const { error: deleteError } = await supabase
            .from('expenses')
            .delete()
            .eq('id', expenseId)

        if (deleteError) {
            throw createError({ statusCode: 500, statusMessage: deleteError.message })
        }

        return { success: true }
    }

    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
}) 