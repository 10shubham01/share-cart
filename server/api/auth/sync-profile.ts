import { createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
    const method = getMethod(event)
    const supabase = await serverSupabaseClient<Database>(event)
    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Auth session missing! Please try logging in again.'
        })
    }

    if (method === 'POST') {
        try {
            // Ensure user profile exists in public.users table
            const { data: profile, error } = await supabase
                .from('users')
                .upsert({
                    id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                    avatar_url: user.user_metadata?.avatar_url || null
                })
                .select()
                .single()

            if (error) {
                throw createError({ statusCode: 500, statusMessage: error.message })
            }

            return {
                success: true,
                profile,
                message: 'Profile synced successfully'
            }
        } catch (error: any) {
            throw createError({ statusCode: 500, statusMessage: error.message })
        }
    }

    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
}) 