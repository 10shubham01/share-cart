import { createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
    const method = getMethod(event)
    const supabase = await serverSupabaseClient<Database>(event)
    const user = await serverSupabaseUser(event)
    const id = getRouterParam(event, 'id')

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Item ID is required' })
    }

    if (method === 'GET') {
        const { data: item, error } = await supabase
            .from('grocery_items')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            throw createError({ statusCode: 404, statusMessage: 'Item not found' })
        }

        return item
    }

    if (method === 'PUT') {
        const body = await readBody(event)
        const { name, unit, default_price, image_url } = body

        if (!name || !unit) {
            throw createError({ statusCode: 400, statusMessage: 'Name and unit are required' })
        }

        // Check if user owns the item or if it's a system item
        const { data: existingItem, error: fetchError } = await supabase
            .from('grocery_items')
            .select('created_by')
            .eq('id', id)
            .single()

        if (fetchError) {
            throw createError({ statusCode: 404, statusMessage: 'Item not found' })
        }

        // Only allow updates if user created the item or if it's a system item (created_by is null)
        if (existingItem.created_by && existingItem.created_by !== user.id) {
            throw createError({ statusCode: 403, statusMessage: 'You can only edit your own items' })
        }

        const { data, error } = await supabase
            .from('grocery_items')
            .update({
                name,
                unit,
                default_price: default_price || null,
                image_url: image_url || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message })
        }

        return data
    }

    if (method === 'DELETE') {
        // Check if user owns the item or if it's a system item
        const { data: existingItem, error: fetchError } = await supabase
            .from('grocery_items')
            .select('created_by')
            .eq('id', id)
            .single()

        if (fetchError) {
            throw createError({ statusCode: 404, statusMessage: 'Item not found' })
        }

        // Only allow deletion if user created the item or if it's a system item (created_by is null)
        if (existingItem.created_by && existingItem.created_by !== user.id) {
            throw createError({ statusCode: 403, statusMessage: 'You can only delete your own items' })
        }

        const { error } = await supabase
            .from('grocery_items')
            .delete()
            .eq('id', id)

        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message })
        }

        return { message: 'Item deleted successfully' }
    }

    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
}) 