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

    if (method === 'POST') {
        const body = await readBody(event)
        const { email } = body

        if (!email) {
            throw createError({ statusCode: 400, statusMessage: 'Email is required' })
        }

        // Search in the public users table
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .neq('id', user.id)
            .limit(1)

        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message })
        }

        return users || []
    }

    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
}) 