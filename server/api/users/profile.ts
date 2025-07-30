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
    // Get current user's profile
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return profile
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const { full_name, avatar_url } = body

    // Create or update user profile
    const { data: profile, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email || '',
        full_name: full_name || user.user_metadata?.full_name || null,
        avatar_url: avatar_url || null
      })
      .select()
      .single()

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return profile
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
}) 