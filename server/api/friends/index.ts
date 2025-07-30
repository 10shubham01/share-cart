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
        // First, let's check if the friends table exists
        const { data: tableCheck, error: tableError } = await supabase
            .from('friends')
            .select('count', { count: 'exact', head: true })

        if (tableError) {
            console.error('Table check error:', tableError)
            throw createError({
                statusCode: 500,
                statusMessage: `Database table error: ${tableError.message}. Please run the migration script first.`
            })
        }

        try {
            // Get user's friends with their profile information
            const { data: friends, error } = await supabase
                .from('friends')
                .select(`
                    *,
                    friend:users!friend_id (
                        id,
                        email,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('user_id', user.id)
                .eq('status', 'accepted')
                .order('created_at', { ascending: false })

            if (error) {
                // If join fails, fall back to basic query
                const { data: basicFriends, error: basicError } = await supabase
                    .from('friends')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('status', 'accepted')
                    .order('created_at', { ascending: false })

                if (basicError) {
                    throw createError({ statusCode: 500, statusMessage: basicError.message })
                }

                // Try to get user data separately for basic friends
                const friendsWithProfiles = await Promise.all(
                    basicFriends.map(async (friend) => {
                        try {
                            const { data: userProfile } = await supabase
                                .from('users')
                                .select('id, email, full_name, avatar_url')
                                .eq('id', friend.friend_id)
                                .single()

                            return {
                                ...friend,
                                friend: userProfile || null
                            }
                        } catch (profileError) {
                            return {
                                ...friend,
                                friend: null
                            }
                        }
                    })
                )

                return friendsWithProfiles || []
            }

            return friends || []
        } catch (error: any) {
            throw createError({ statusCode: 500, statusMessage: error.message })
        }
    }

    if (method === 'POST') {
        const body = await readBody(event)
        const { friend_id, message } = body

        if (!friend_id) {
            throw createError({ statusCode: 400, statusMessage: 'Friend ID is required' })
        }

        if (friend_id === user.id) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Cannot add yourself as a friend. Try searching for a different email address.'
            })
        }

        // Check if friend request already exists
        const { data: existingRequest, error: checkError } = await supabase
            .from('friend_requests')
            .select('*')
            .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${friend_id}),and(from_user_id.eq.${friend_id},to_user_id.eq.${user.id})`)
            .single()

        if (checkError && checkError.code !== 'PGRST116') {
            throw createError({ statusCode: 500, statusMessage: checkError.message })
        }

        if (existingRequest) {
            throw createError({ statusCode: 400, statusMessage: 'Friend request already exists' })
        }

        // Create friend request
        const { data: friendRequest, error: requestError } = await supabase
            .from('friend_requests')
            .insert({
                from_user_id: user.id,
                to_user_id: friend_id,
                message: message || null
            })
            .select()
            .single()

        if (requestError) {
            throw createError({ statusCode: 500, statusMessage: requestError.message })
        }

        return friendRequest
    }

    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
}) 