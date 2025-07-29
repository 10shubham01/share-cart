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
    const { data: items, error } = await supabase
      .from('grocery_items')
      .select('*')
      .or(`created_by.eq.${user.id},created_by.is.null`)
      .order('name', { ascending: true })
    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return items
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const { name, unit, default_price, image_url } = body

    if (!name || !unit) {
      throw createError({ statusCode: 400, statusMessage: 'Name and unit are required' })
    }

    const { data, error } = await supabase
      .from('grocery_items')
      .insert({
        name,
        unit,
        default_price: default_price || null,
        image_url: image_url || null,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return data
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
}) 