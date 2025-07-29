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
    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members!inner (
          user_id,
          status
        )
      `)
      .eq('group_members.user_id', user.id)
      .eq('group_members.status', 'accepted')
      .order('created_at', { ascending: false })

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return groups
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const { name, description } = body

    if (!name) {
      throw createError({ statusCode: 400, statusMessage: 'Group name is required' })
    }

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        created_by: user.id
      })
      .select()
      .single()

    if (groupError) {
      throw createError({ statusCode: 500, statusMessage: groupError.message })
    }

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        status: 'accepted',
        role: 'admin'
      })

    if (memberError) {
      throw createError({ statusCode: 500, statusMessage: memberError.message })
    }

    return group
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
}) 