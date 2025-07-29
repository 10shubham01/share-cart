import { createError } from 'h3'
import type { Database } from '~~/types/database.types'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

const defaultGroceries = [
  // Fruits & Vegetables
  { name: 'Bananas', category: 'Fruits & Vegetables', default_price: 40, unit: 'dozen' },
  { name: 'Apples', category: 'Fruits & Vegetables', default_price: 120, unit: 'kg' },
  { name: 'Tomatoes', category: 'Fruits & Vegetables', default_price: 40, unit: 'kg' },
  { name: 'Onions', category: 'Fruits & Vegetables', default_price: 30, unit: 'kg' },
  { name: 'Potatoes', category: 'Fruits & Vegetables', default_price: 25, unit: 'kg' },
  { name: 'Carrots', category: 'Fruits & Vegetables', default_price: 60, unit: 'kg' },
  { name: 'Spinach', category: 'Fruits & Vegetables', default_price: 20, unit: 'bunch' },
  { name: 'Cucumber', category: 'Fruits & Vegetables', default_price: 30, unit: 'kg' },
  { name: 'Lemon', category: 'Fruits & Vegetables', default_price: 40, unit: 'dozen' },
  { name: 'Ginger', category: 'Fruits & Vegetables', default_price: 120, unit: 'kg' },

  // Dairy & Eggs
  { name: 'Milk', category: 'Dairy & Eggs', default_price: 60, unit: 'liter' },
  { name: 'Eggs', category: 'Dairy & Eggs', default_price: 120, unit: 'dozen' },
  { name: 'Butter', category: 'Dairy & Eggs', default_price: 120, unit: 'pack' },
  { name: 'Cheese', category: 'Dairy & Eggs', default_price: 200, unit: 'pack' },
  { name: 'Curd', category: 'Dairy & Eggs', default_price: 40, unit: 'pack' },
  { name: 'Paneer', category: 'Dairy & Eggs', default_price: 300, unit: 'kg' },

  // Meat & Fish
  { name: 'Chicken', category: 'Meat & Fish', default_price: 200, unit: 'kg' },
  { name: 'Fish', category: 'Meat & Fish', default_price: 400, unit: 'kg' },
  { name: 'Mutton', category: 'Meat & Fish', default_price: 600, unit: 'kg' },
  { name: 'Eggs', category: 'Meat & Fish', default_price: 120, unit: 'dozen' },

  // Grains & Cereals
  { name: 'Rice', category: 'Grains & Cereals', default_price: 60, unit: 'kg' },
  { name: 'Wheat Flour', category: 'Grains & Cereals', default_price: 40, unit: 'kg' },
  { name: 'Dal (Lentils)', category: 'Grains & Cereals', default_price: 120, unit: 'kg' },
  { name: 'Sugar', category: 'Grains & Cereals', default_price: 45, unit: 'kg' },
  { name: 'Salt', category: 'Grains & Cereals', default_price: 20, unit: 'kg' },
  { name: 'Oil', category: 'Grains & Cereals', default_price: 120, unit: 'liter' },

  // Snacks & Beverages
  { name: 'Tea', category: 'Snacks & Beverages', default_price: 200, unit: 'pack' },
  { name: 'Coffee', category: 'Snacks & Beverages', default_price: 300, unit: 'pack' },
  { name: 'Biscuits', category: 'Snacks & Beverages', default_price: 30, unit: 'pack' },
  { name: 'Chips', category: 'Snacks & Beverages', default_price: 20, unit: 'pack' },
  { name: 'Soft Drinks', category: 'Snacks & Beverages', default_price: 35, unit: 'bottle' },

  // Household
  { name: 'Soap', category: 'Household', default_price: 40, unit: 'piece' },
  { name: 'Detergent', category: 'Household', default_price: 150, unit: 'pack' },
  { name: 'Toilet Paper', category: 'Household', default_price: 80, unit: 'roll' },
  { name: 'Tissue Paper', category: 'Household', default_price: 60, unit: 'pack' },
  { name: 'Dish Soap', category: 'Household', default_price: 80, unit: 'bottle' },

  // Personal Care
  { name: 'Shampoo', category: 'Personal Care', default_price: 200, unit: 'bottle' },
  { name: 'Toothpaste', category: 'Personal Care', default_price: 80, unit: 'tube' },
  { name: 'Toothbrush', category: 'Personal Care', default_price: 30, unit: 'piece' },
  { name: 'Deodorant', category: 'Personal Care', default_price: 150, unit: 'piece' },

  // Frozen Foods
  { name: 'Ice Cream', category: 'Frozen Foods', default_price: 200, unit: 'pack' },
  { name: 'Frozen Peas', category: 'Frozen Foods', default_price: 80, unit: 'pack' },
  { name: 'Frozen Corn', category: 'Frozen Foods', default_price: 60, unit: 'pack' },

  // Bakery
  { name: 'Bread', category: 'Bakery', default_price: 40, unit: 'pack' },
  { name: 'Cake', category: 'Bakery', default_price: 300, unit: 'piece' },
  { name: 'Cookies', category: 'Bakery', default_price: 100, unit: 'pack' }
]

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    // Get categories first
    const { data: categories, error: categoryError } = await client
      .from('categories')
      .select('*')

    if (categoryError) {
      throw createError({ statusMessage: categoryError.message })
    }

    // Check if groceries already exist
    const { data: existingGroceries, error: checkError } = await client
      .from('grocery_items')
      .select('id')
      .limit(1)

    if (checkError) {
      throw createError({ statusMessage: checkError.message })
    }

    // If groceries already exist, don't seed again
    if (existingGroceries && existingGroceries.length > 0) {
      return { message: 'Groceries already seeded', count: existingGroceries.length }
    }

    // Insert default groceries
    const groceriesToInsert = defaultGroceries.map(grocery => {
      const category = categories?.find(c => c.name === grocery.category)
      return {
        name: grocery.name,
        category_id: category?.id || null,
        default_price: grocery.default_price,
        unit: grocery.unit,
        created_by: user.id
      }
    })

    const { data, error } = await client
      .from('grocery_items')
      .insert(groceriesToInsert)
      .select()

    if (error) {
      throw createError({ statusMessage: error.message })
    }

    return { 
      message: 'Default groceries seeded successfully', 
      count: data?.length || 0 
    }
  } catch (error: any) {
    throw createError({ statusMessage: error.message })
  }
}) 