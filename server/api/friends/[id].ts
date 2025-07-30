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

    const friendId = getRouterParam(event, 'id')

    if (!friendId) {
        throw createError({ statusCode: 400, statusMessage: 'Friend ID is required' })
    }

    if (method === 'DELETE') {
        // Remove friend relationship (both directions)
        const { error: deleteError } = await supabase
            .from('friends')
            .delete()
            .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

        if (deleteError) {
            throw createError({ statusCode: 500, statusMessage: deleteError.message })
        }

        return { success: true }
    }

    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
}) 