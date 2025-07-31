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
        try {
            // First, check if the friend_requests table exists
            const { data: tableCheck, error: tableError } = await supabase
                .from('friend_requests')
                .select('count', { count: 'exact', head: true })

            if (tableError) {
                throw createError({
                    statusCode: 500,
                    statusMessage: `Database table error: ${tableError.message}. Please run the migration script first.`
                })
            }

            // Try to get friend requests with user profiles
            const { data: requests, error } = await supabase
                .from('friend_requests')
                .select(`
                    *,
                    from_user:users!from_user_id (
                        id,
                        email,
                        full_name,
                        avatar_url
                    ),
                    to_user:users!to_user_id (
                        id,
                        email,
                        full_name,
                        avatar_url
                    )
                `)
                .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
                .order('created_at', { ascending: false })

            if (error) {
                // If join fails, fall back to basic query
                const { data: basicRequests, error: basicError } = await supabase
                    .from('friend_requests')
                    .select('*')
                    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
                    .order('created_at', { ascending: false })

                if (basicError) {
                    throw createError({ statusCode: 500, statusMessage: basicError.message })
                }

                // Try to get user data separately for basic requests
                const requestsWithProfiles = await Promise.all(
                    basicRequests.map(async (request) => {
                        try {
                            const [fromUser, toUser] = await Promise.all([
                                supabase
                                    .from('users')
                                    .select('id, email, full_name, avatar_url')
                                    .eq('id', request.from_user_id)
                                    .single(),
                                supabase
                                    .from('users')
                                    .select('id, email, full_name, avatar_url')
                                    .eq('id', request.to_user_id)
                                    .single()
                            ])

                            return {
                                ...request,
                                from_user: fromUser.data || null,
                                to_user: toUser.data || null
                            }
                        } catch (profileError) {
                            return {
                                ...request,
                                from_user: null,
                                to_user: null
                            }
                        }
                    })
                )

                return requestsWithProfiles || []
            }

            return requests || []
        } catch (error: any) {
            throw createError({ statusCode: 500, statusMessage: error.message })
        }
    }

    if (method === 'POST') {
        const body = await readBody(event)
        const { request_id, action } = body

        if (!request_id || !action) {
            throw createError({ statusCode: 400, statusMessage: 'Request ID and action are required' })
        }

        if (!['accept', 'reject', 'cancel'].includes(action)) {
            throw createError({ statusCode: 400, statusMessage: 'Invalid action. Must be accept, reject, or cancel' })
        }

        // Get the friend request
        const { data: requests, error: getError } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('id', request_id)

        if (getError) {
            throw createError({ statusCode: 500, statusMessage: `Database error: ${getError.message}` })
        }

        if (!requests || requests.length === 0) {
            throw createError({ statusCode: 404, statusMessage: 'Friend request not found' })
        }

        const request = requests[0]

        // Check permissions
        if (action === 'cancel' && request.from_user_id !== user.id) {
            throw createError({ statusCode: 403, statusMessage: 'Only the sender can cancel a friend request' })
        }

        if (['accept', 'reject'].includes(action) && request.to_user_id !== user.id) {
            throw createError({ statusCode: 403, statusMessage: 'Only the recipient can accept or reject a friend request' })
        }

        // Update the request status
        let newStatus: string
        switch (action) {
            case 'accept':
                newStatus = 'accepted'
                break
            case 'reject':
                newStatus = 'rejected'
                break
            case 'cancel':
                newStatus = 'cancelled'
                break
            default:
                newStatus = 'pending'
        }

        const { data: updatedRequests, error: updateError } = await supabase
            .from('friend_requests')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', request_id)
            .select()

        if (updateError) {
            throw createError({ statusCode: 500, statusMessage: updateError.message })
        }

        if (!updatedRequests || updatedRequests.length === 0) {
            throw createError({ statusCode: 404, statusMessage: 'Friend request not found or could not be updated' })
        }

        const updatedRequest = updatedRequests[0]

        // If accepted, create friend relationships
        if (action === 'accept') {
            // Create friend relationships one at a time to avoid RLS issues
            const friendRelationships = [
                {
                    user_id: request.from_user_id,
                    friend_id: request.to_user_id,
                    status: 'accepted'
                },
                {
                    user_id: request.to_user_id,
                    friend_id: request.from_user_id,
                    status: 'accepted'
                }
            ]

            // Insert relationships one by one to handle RLS properly
            for (const relationship of friendRelationships) {
                const { data: createdFriend, error: friendError } = await supabase
                    .from('friends')
                    .insert(relationship)
                    .select()
                    .single()

                if (friendError) {
                    // Don't throw error, just continue
                    // The relationship might already exist
                }
            }
        }

        return updatedRequest
    }

    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})

