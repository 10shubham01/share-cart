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

    if (method === 'GET') {
        // Return current user profile
        try {
            const { data: profile, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw createError({ statusCode: 500, statusMessage: error.message })
            }

            return {
                success: true,
                profile: profile || null
            }
        } catch (error: any) {
            throw createError({ statusCode: 500, statusMessage: error.message })
        }
    }

    if (method === 'POST') {
        try {
            // Get the body to see if we're passing custom data
            const body = await readBody(event)

            // Determine the best name to use
            let fullName = null

            // Priority order for name:
            // 1. Custom name from body (if provided)
            // 2. user_metadata.full_name
            // 3. user_metadata.name  
            // 4. user_metadata.username
            // 5. user_metadata.user_name
            // 6. Extract from email (as fallback)

            if (body?.full_name) {
                fullName = body.full_name
            } else if (user.user_metadata?.full_name) {
                fullName = user.user_metadata.full_name
            } else if (user.user_metadata?.name) {
                fullName = user.user_metadata.name
            } else if (user.user_metadata?.username) {
                fullName = user.user_metadata.username
            } else if (user.user_metadata?.user_name) {
                fullName = user.user_metadata.user_name
            } else if (user.email) {
                // Fallback: use email prefix as name
                fullName = user.email.split('@')[0]
            }

            // Ensure user profile exists in public.users table
            const { data: profile, error } = await supabase
                .from('users')
                .upsert({
                    id: user.id,
                    email: user.email || '',
                    full_name: fullName,
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