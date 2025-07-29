<script setup lang="ts">
import type { Database } from '~/types/database.types'

const { user } = useAuth()
const toast = useToast()

// Redirect to login if not authenticated


const shoppingLists = ref<Database['public']['Tables']['shopping_lists']['Row'][]>([])
const loading = ref(false)
const showCreateModal = ref(false)

const newList = ref({
  name: '',
  group_id: null as string | null
})

const groups = ref<Database['public']['Tables']['groups']['Row'][]>([])

const fetchShoppingLists = async () => {
  if (!user.value) return

  loading.value = true
  try {
    const { data, error } = await useFetch('/api/shopping-lists')
    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'error' })
    } else if (data.value) {
      shoppingLists.value = data.value
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const fetchGroups = async () => {
  try {
    const { data } = await useFetch('/api/groups')
    if (data.value) {
      groups.value = data.value
    }
  } catch (error: any) {
    console.error('Error fetching groups:', error)
  }
}

const createShoppingList = async () => {
  if (!newList.value.name.trim()) {
    toast.add({ title: 'Error', description: 'List name is required', color: 'error' })
    return
  }

  try {
    const { data, error } = await useFetch('/api/shopping-lists', {
      method: 'POST',
      body: newList.value
    })

    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'error' })
    } else if (data.value) {
      shoppingLists.value.unshift(data.value)
      showCreateModal.value = false
      newList.value = { name: '', group_id: null }
      toast.add({ title: 'Success', description: 'Shopping list created successfully!', color: 'success' })
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
}

const deleteShoppingList = async (listId: string) => {
  if (!confirm('Are you sure you want to delete this shopping list? This action cannot be undone.')) {
    return
  }

  try {
    const { error } = await useFetch(`/api/shopping-lists/${listId}`, {
      method: 'DELETE'
    })

    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'success' })
    } else {
      shoppingLists.value = shoppingLists.value.filter(l => l.id !== listId)
      toast.add({ title: 'Success', description: 'Shopping list deleted successfully!', color: 'success' })
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
}

onMounted(() => {
  fetchShoppingLists()
  fetchGroups()
})
</script>

<template>
  <div v-if="user" class="min-h-screen ">
    <UContainer class="py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Shopping Lists</h1>
          <p class="text-gray-600 mt-2">Create and manage your shopping lists</p>
        </div>
        <UButton @click="showCreateModal = true" color="primary">
          <UIcon name="i-lucide-plus" class="w-4 h-4 mr-2" />
          Create List
        </UButton>
      </div>

      <!-- Shopping Lists Grid -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
      </div>

      <div v-else-if="shoppingLists.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        v-auto-animate>
        <UCard v-for="list in shoppingLists" :key="list.id" class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">{{ list.name }}</h3>
              <UDropdown :items="[
                [
                  {
                    label: 'View Items',
                    icon: 'i-lucide-eye',
                    to: `/shopping-lists/${list.id}`
                  },
                  {
                    label: 'Edit List',
                    icon: 'i-lucide-edit',
                    to: `/shopping-lists/${list.id}/edit`
                  }
                ],
                [
                  {
                    label: 'Delete List',
                    icon: 'i-lucide-trash',
                    click: () => deleteShoppingList(list.id)
                  }
                ]
              ]">
                <UButton icon="i-lucide-more-horizontal" variant="ghost" size="sm" />
              </UDropdown>
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex items-center justify-between text-sm text-gray-500">
              <span>{{ new Date(list.created_at).toLocaleDateString() }}</span>
              <span v-if="list.group_id" class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                Group List
              </span>
            </div>

            <div class="flex space-x-2">
              <UButton :to="`/shopping-lists/${list.id}`" variant="outline" size="sm" block>
                View Items
              </UButton>
              <UButton :to="`/shopping-lists/${list.id}/edit`" variant="outline" size="sm" block>
                Edit
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-list" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">No shopping lists yet</h3>
        <p class="text-gray-600 mb-6">Create your first shopping list to start organizing your groceries</p>
        <UButton @click="showCreateModal = true" color="primary">
          <UIcon name="i-lucide-plus" class="w-4 h-4 mr-2" />
          Create List
        </UButton>
      </div>
    </UContainer>

    <!-- Create Shopping List Modal -->
    <UModal v-model:open="showCreateModal">
      <template #header="{ close }">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Create New Shopping List</h3>
          <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="close" />
        </div>
      </template>

      <template #content="{ close }">
        <form @submit.prevent="createShoppingList" class="space-y-4">
          <UFormField label="List Name" required>
            <UInput v-model="newList.name" placeholder="Enter list name" required />
          </UFormField>

          <UFormField label="Group (Optional)">
            <USelect v-model="newList.group_id" :options="groups.map(g => ({ label: g.name, value: g.id }))"
              placeholder="Select a group (optional)" clearable />
          </UFormField>
        </form>
      </template>

      <template #footer="{ close }">
        <div class="flex justify-end space-x-2">
          <UButton variant="outline" @click="close">
            Cancel
          </UButton>
          <UButton color="primary" @click="createShoppingList" :disabled="!newList.name.trim()">
            Create List
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>