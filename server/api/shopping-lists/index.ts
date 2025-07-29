import { createError, readBody } from 'h3'
import type { Database } from '~~/types/database.types'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

async function getUserGroupIds(client: any, userId: string): Promise<string> {
  const { data: memberships } = await client
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
    .eq('status', 'accepted')

  if (!memberships || memberships.length === 0) {
    return '' // Return empty string if no group memberships
  }

  const groupIds = memberships.map((m: any) => `'${m.group_id}'`).join(',')
  return groupIds
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)
  const user = await serverSupabaseUser(event)
  const method = event.node.req.method

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  switch (method) {
    case 'GET': {
      try {
            // Get shopping lists created by the user or where user is a group member
    const groupIds = await getUserGroupIds(client, user.id)
    
    let query = client
      .from('shopping_lists')
      .select('*')
      .eq('created_by', user.id)
    
    if (groupIds !== '') {
      query = query.or(`group_id.in.(${groupIds})`)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })

        if (error) {
          throw createError({ statusMessage: error.message })
        }

        return data
      } catch (error: any) {
        throw createError({ statusMessage: error.message })
      }
    }

    case 'POST': {
      try {
        const body = await readBody(event)
        
        if (!body.name || !body.name.trim()) {
          throw createError({ statusCode: 400, statusMessage: 'List name is required' })
        }

        // If group_id is provided, verify user is a member of that group
        if (body.group_id) {
          const { data: membership } = await client
            .from('group_members')
            .select('*')
            .eq('group_id', body.group_id)
            .eq('user_id', user.id)
            .eq('status', 'accepted')
            .single()

          if (!membership) {
            throw createError({ statusCode: 403, statusMessage: 'You are not a member of this group' })
          }
        }

        const { data, error } = await client
          .from('shopping_lists')
          .insert({
            name: body.name.trim(),
            group_id: body.group_id || null,
            created_by: user.id
          })
          .select()
          .single()

        if (error) {
          throw createError({ statusMessage: error.message })
        }

        return data
      } catch (error: any) {
        throw createError({ statusMessage: error.message })
      }
    }

    default:
      throw createError({
        statusCode: 405,
        statusMessage: `Method ${method} Not Allowed`
      })
  }
}) 