import { createError, readBody } from 'h3'
import type { Database } from '~~/types/database.types'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)
  const method = event.node.req.method
  const id = event.context.params?.id

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing item ID' })
  }

  switch (method) {
    case 'GET': {
      const { data, error } = await client
        .from('items')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw createError({ statusMessage: error.message })
      return data
    }

    case 'PUT': {
      const body = await readBody(event)
      const { data, error } = await client
        .from('items')
        .update({
          name: body.name,
          price: body.price,
          quantity: body.quantity
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw createError({ statusMessage: error.message })
      return data
    }

    case 'DELETE': {
      const { error } = await client.from('items').delete().eq('id', id)
      if (error) throw createError({ statusMessage: error.message })
      return { message: 'Deleted successfully', id }
    }

    default:
      throw createError({
        statusCode: 405,
        statusMessage: `Method ${method} Not Allowed`
      })
  }
})
