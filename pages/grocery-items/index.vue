<script setup lang="ts">
import type { Database } from '~/types/database.types'

const { user } = useAuth()
const toast = useToast()

// Redirect to login if not authenticated


const groceryItems = ref<Database['public']['Tables']['grocery_items']['Row'][]>([])
const categories = ref<Database['public']['Tables']['categories']['Row'][]>([])
const loading = ref(false)
const showCreateModal = ref(false)

const newItem = ref({
  name: '',
  category_id: null as string | null,
  default_price: 0,
  unit: 'piece'
})

const units = [
  'piece', 'kg', 'gm', 'liter', 'ml', 'pack', 'bottle', 'box', 'dozen'
]

const fetchGroceryItems = async () => {
  if (!user.value) return

  loading.value = true
  try {
    const { data, error } = await useFetch('/api/grocery-items')
    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'error' })
    } else if (data.value) {
      groceryItems.value = data.value
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const { data } = await useFetch('/api/categories')
    if (data.value) {
      categories.value = data.value
    }
  } catch (error: any) {
    console.error('Error fetching categories:', error)
  }
}

const createGroceryItem = async () => {
  if (!newItem.value.name.trim()) {
    toast.add({ title: 'Error', description: 'Item name is required', color: 'error' })
    return
  }

  try {
    const { data, error } = await useFetch('/api/grocery-items', {
      method: 'POST',
      body: newItem.value
    })

    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'error' })
    } else if (data.value) {
      groceryItems.value.unshift(data.value)
      showCreateModal.value = false
      newItem.value = { name: '', category_id: null, default_price: 0, unit: 'piece' }
      toast.add({ title: 'Success', description: 'Grocery item added successfully!', color: 'success' })
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
}

const deleteGroceryItem = async (itemId: string) => {
  if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
    return
  }

  try {
    const { error } = await useFetch(`/api/grocery-items/${itemId}`, {
      method: 'DELETE'
    })

    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'error' })
    } else {
      groceryItems.value = groceryItems.value.filter(i => i.id !== itemId)
      toast.add({ title: 'Success', description: 'Item deleted successfully!', color: 'success' })
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
}

onMounted(() => {
  fetchGroceryItems()
  fetchCategories()
})
</script>

<template>
  <div v-if="user" class="min-h-screen ">
    <UContainer class="py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Grocery Items</h1>
          <p class="text-gray-600 mt-2">Manage your grocery items and categories</p>
        </div>
        <UButton @click="showCreateModal = true" color="primary">
          <UIcon name="i-lucide-plus" class="w-4 h-4 mr-2" />
          Add Item
        </UButton>
      </div>

      <!-- Grocery Items Grid -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
      </div>

      <div v-else-if="groceryItems.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" v-auto-animate>
        <UCard v-for="item in groceryItems" :key="item.id" class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 truncate">{{ item.name }}</h3>
              <UDropdown :items="[
                [
                  {
                    label: 'Edit Item',
                    icon: 'i-lucide-edit',
                    to: `/grocery-items/${item.id}/edit`
                  }
                ],
                [
                  {
                    label: 'Delete Item',
                    icon: 'i-lucide-trash',
                    click: () => deleteGroceryItem(item.id)
                  }
                ]
              ]">
                <UButton icon="i-lucide-more-horizontal" variant="ghost" size="sm" />
              </UDropdown>
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Price:</span>
              <span class="font-semibold">₹{{ item.default_price || 0 }}</span>
            </div>

            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Unit:</span>
              <span class="font-medium">{{ item.unit }}</span>
            </div>

            <div v-if="item.category_id" class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Category:</span>
              <span class="font-medium">
                {{categories.find(c => c.id === item.category_id)?.name || 'Unknown'}}
              </span>
            </div>

            <div class="flex space-x-2">
              <UButton :to="`/grocery-items/${item.id}/edit`" variant="outline" size="sm" block>
                Edit
              </UButton>
              <UButton @click="deleteGroceryItem(item.id)" variant="outline" size="sm" block color="error">
                Delete
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-package" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">No grocery items yet</h3>
        <p class="text-gray-600 mb-6">Add your first grocery item to start building your shopping lists</p>
        <UButton @click="showCreateModal = true" color="primary">
          <UIcon name="i-lucide-plus" class="w-4 h-4 mr-2" />
          Add Item
        </UButton>
      </div>
    </UContainer>

    <!-- Create Grocery Item Modal -->
    <UModal v-model:open="showCreateModal">
      <template #header="{ close }">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Add New Grocery Item</h3>
          <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="close" />
        </div>
      </template>

      <template #content="{ close }">
        <form @submit.prevent="createGroceryItem" class="space-y-4">
          <UFormField label="Item Name" required>
            <UInput v-model="newItem.name" placeholder="Enter item name" required />
          </UFormField>

          <UFormField label="Category">
            <USelect v-model="newItem.category_id" :options="categories.map(c => ({ label: c.name, value: c.id }))"
              placeholder="Select a category (optional)" clearable />
          </UFormField>

          <UFormField label="Default Price">
            <UInputNumber v-model.number="newItem.default_price" placeholder="0.00" :min="0" :step="0.01" />
          </UFormField>

          <UFormField label="Unit">
            <USelect v-model="newItem.unit" :options="units.map(u => ({ label: u, value: u }))"
              placeholder="Select unit" />
          </UFormField>
        </form>
      </template>

      <template #footer="{ close }">
        <div class="flex justify-end space-x-2">
          <UButton variant="outline" @click="close">
            Cancel
          </UButton>
          <UButton color="primary" @click="createGroceryItem" :disabled="!newItem.name.trim()">
            Add Item
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>