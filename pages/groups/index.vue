<script setup lang="ts">
import type { Database } from '~/types/database.types'

const { user } = useAuth()
const toast = useToast()

// Redirect to login if not authenticated


const groups = ref<Array<Database['public']['Tables']['groups']['Row'] & { member_count: number }>>([])
const loading = ref(false)
const showCreateModal = ref(false)

const newGroup = ref({
  name: '',
  description: ''
})

const fetchGroups = async () => {
  if (!user.value) return

  loading.value = true
  try {
    const { data, error } = await useFetch('/api/groups')
    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'error' })
    } else if (data.value) {
      groups.value = data.value
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const createGroup = async () => {
  if (!newGroup.value.name.trim()) {
    toast.add({ title: 'Error', description: 'Group name is required', color: 'error' })
    return
  }

  try {
    const { data, error } = await useFetch('/api/groups', {
      method: 'POST',
      body: newGroup.value
    })

    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'error' })
    } else if (data.value) {
      groups.value.unshift(data.value)
      showCreateModal.value = false
      newGroup.value = { name: '', description: '' }
      toast.add({ title: 'Success', description: 'Group created successfully!', color: 'success' })
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
}

const deleteGroup = async (groupId: string) => {
  if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
    return
  }

  try {
    const { error } = await useFetch(`/api/groups/${groupId}`, {
      method: 'DELETE'
    })

    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'error' })
    } else {
      groups.value = groups.value.filter(g => g.id !== groupId)
      toast.add({ title: 'Success', description: 'Group deleted successfully!', color: 'success' })
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
}

onMounted(() => {
  fetchGroups()
})
</script>

<template>
  <div v-if="user" class="min-h-screen ">
    <UContainer class="py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Groups</h1>
          <p class="text-gray-600 mt-2">Manage your groups and collaborate with others</p>
        </div>
        <UButton @click="showCreateModal = true" color="primary">
          <UIcon name="i-lucide-plus" class="w-4 h-4 mr-2" />
          Create Group
        </UButton>
      </div>

      <!-- Groups Grid -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
      </div>

      <div v-else-if="groups.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" v-auto-animate>
        <UCard v-for="group in groups" :key="group.id" class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">{{ group.name }}</h3>
              <div class="relative">
                <UButton icon="i-lucide-more-horizontal" variant="ghost" size="sm" />
                <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div class="py-1">
                    <NuxtLink :to="`/groups/${group.id}`"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <UIcon name="i-lucide-eye" class="w-4 h-4 inline mr-2" />
                      View Details
                    </NuxtLink>
                    <NuxtLink :to="`/groups/${group.id}/members`"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <UIcon name="i-lucide-users" class="w-4 h-4 inline mr-2" />
                      Manage Members
                    </NuxtLink>
                    <div class="border-t border-gray-200"></div>
                    <button @click="deleteGroup(group.id)"
                      class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <UIcon name="i-lucide-trash" class="w-4 h-4 inline mr-2" />
                      Delete Group
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <p v-if="group.description" class="text-gray-600 text-sm">
              {{ group.description }}
            </p>

            <div class="flex items-center justify-between text-sm text-gray-500">
              <span>{{ group.member_count }} members</span>
              <span>{{ new Date(group.created_at).toLocaleDateString() }}</span>
            </div>

            <div class="flex space-x-2">
              <UButton :to="`/groups/${group.id}`" variant="outline" size="sm" block>
                View Details
              </UButton>
              <UButton :to="`/groups/${group.id}/members`" variant="outline" size="sm" block>
                Members
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-users" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
        <p class="text-gray-600 mb-6">Create your first group to start collaborating with others</p>
        <UButton @click="showCreateModal = true" color="primary">
          <UIcon name="i-lucide-plus" class="w-4 h-4 mr-2" />
          Create Group
        </UButton>
      </div>
    </UContainer>

    <!-- Create Group Modal -->
    <UDrawer v-model:open="showCreateModal">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Create New Group</h3>
          <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="showCreateModal = false" />
        </div>
      </template>

      <template #bo>
        <form @submit.prevent="createGroup" class="space-y-4">
          <UFormField label="Group Name" required>
            <UInput v-model="newGroup.name" placeholder="Enter group name" required />
          </UFormField>

          <UFormField label="Description">
            <UTextarea v-model="newGroup.description" placeholder="Enter group description (optional)" :rows="3" />
          </UFormField>
        </form>
      </template>

      <template #footer>
        <div class="flex justify-end space-x-2">
          <UButton variant="outline" @click="showCreateModal = false">
            Cancel
          </UButton>
          <UButton color="primary" @click="createGroup" :disabled="!newGroup.name.trim()">
            Create Group
          </UButton>
        </div>
      </template>
    </UDrawer>
  </div>
</template>