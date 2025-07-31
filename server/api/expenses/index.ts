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

    if (method === 'GET') {
        // Get all expenses for the user
        const { data: expenses, error } = await supabase
            .from('expenses')
            .select(`
                *,
                expense_shares (
                    *,
                    friend:users!expense_shares_friend_id_fkey (
                        id,
                        full_name,
                        email,
                        avatar_url
                    )
                ),
                expense_items (*)
            `)
            .eq('created_by', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message })
        }

        return expenses || []
    }

    if (method === 'POST') {
        const body = await readBody(event)
        const { title, description, amount, currency, category, selectedFriends, items } = body

        if (!title || !amount || !selectedFriends || !Array.isArray(selectedFriends)) {
            throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
        }

        // Start a transaction
        const { data: expense, error: expenseError } = await supabase
            .from('expenses')
            .insert({
                title,
                description,
                amount: parseFloat(amount),
                currency: currency || 'USD',
                category,
                created_by: user.id
            })
            .select()
            .single()

        if (expenseError) {
            throw createError({ statusCode: 500, statusMessage: expenseError.message })
        }

        // Create expense shares for selected friends
        const shareAmount = parseFloat(amount) / (selectedFriends.length + 1) // +1 for the creator
        const sharePercentage = 100 / (selectedFriends.length + 1)

        const expenseShares = selectedFriends.map((friendId: string) => ({
            expense_id: expense.id,
            user_id: user.id,
            friend_id: friendId,
            share_amount: shareAmount,
            share_percentage: sharePercentage,
            status: 'pending'
        }))

        const { error: sharesError } = await supabase
            .from('expense_shares')
            .insert(expenseShares)

        if (sharesError) {
            throw createError({ statusCode: 500, statusMessage: sharesError.message })
        }

        // Create expense items if provided
        if (items && Array.isArray(items) && items.length > 0) {
            const expenseItems = items.map((item: any) => ({
                expense_id: expense.id,
                grocery_item_id: item.grocery_item_id || null,
                name: item.name,
                quantity: item.quantity || 1,
                unit_price: parseFloat(item.unit_price),
                total_price: parseFloat(item.total_price),
                notes: item.notes
            }))

            const { error: itemsError } = await supabase
                .from('expense_items')
                .insert(expenseItems)

            if (itemsError) {
                throw createError({ statusCode: 500, statusMessage: itemsError.message })
            }
        }

        // Return the created expense with all related data
        const { data: fullExpense, error: fetchError } = await supabase
            .from('expenses')
            .select(`
                *,
                expense_shares (
                    *,
                    friend:users!expense_shares_friend_id_fkey (
                        id,
                        full_name,
                        email,
                        avatar_url
                    )
                ),
                expense_items (*)
            `)
            .eq('id', expense.id)
            .single()

        if (fetchError) {
            throw createError({ statusCode: 500, statusMessage: fetchError.message })
        }

        return fullExpense
    }

    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
}) 