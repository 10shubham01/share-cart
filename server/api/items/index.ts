import { createError, readBody } from 'h3'
import type { Database } from '~~/types/database.types'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)
  const method = event.node.req.method

  switch (method) {
    case 'GET': {
      const { data, error } = await client
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw createError({ statusMessage: error.message })
      return data
    }

    case 'POST': {
      const body = await readBody(event)
      if (!body.name || body.price == null || body.quantity == null) {
        throw createError({ statusCode: 400, statusMessage: `Missing fields ${JSON.stringify(body)}` })
      }

      const { data, error } = await client
        .from('items')
        .insert({
          name: body.name,
          price: body.price,
          quantity: body.quantity
        })
        .select()
        .single()

      if (error) throw createError({ statusMessage: error.message })
      return data
    }

    default:
      throw createError({
        statusCode: 405,
        statusMessage: `Method ${method} Not Allowed`
      })
  }
})
