import { createError, readBody, getMethod, getRouterParam } from 'h3'
import type { Database } from '~~/types/database.types'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const client = await serverSupabaseClient<Database>(event)


  const user = await serverSupabaseUser(event)

  if (method === 'GET') {
    const { data, error } = await client
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw createError({ statusMessage: error.message })
    return data
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const { name, price, quantity } = body

    const { data, error } = await client
      .from('items')
      .insert({ name, price, quantity })
      .select()

    if (error) throw createError({ statusMessage: error.message })
    return data?.[0]
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    const { id, name, price, quantity } = body

    if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID' })

    const { data, error } = await client
      .from('items')
      .update({ name, price, quantity })
      .eq('id', id)
      .select()

    if (error) throw createError({ statusMessage: error.message })
    return data?.[0]
  }

  if (method === 'DELETE') {
    const body = await readBody(event)
    const { id } = body

    if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID' })

    const { error } = await client.from('items').delete().eq('id', id)
    if (error) throw createError({ statusMessage: error.message })
    return { message: 'Deleted successfully', id }
  }

  throw createError({ statusCode: 405, statusMessage: `Method ${method} not allowed` })
})
