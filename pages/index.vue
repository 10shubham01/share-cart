<script setup lang="ts">
import type { Database } from '~/types/database.types'

const { user } = useAuth()
const userLoading = ref(true)

// Wait for user to be hydrated
watch(user, (newUser) => {
  if (newUser !== null) {
    userLoading.value = false
  }
}, { immediate: true })

// Also check after a timeout in case user is already loaded
onMounted(() => {
  setTimeout(() => {
    userLoading.value = false
  }, 1000)
})

const stats = ref<{
  totalFriends: number
  totalItems: number
  pendingRequests: number
}>({
  totalFriends: 0,
  totalItems: 0,
  pendingRequests: 0
})

const recentFriends = ref<Database['public']['Tables']['friends']['Row'][]>([])
const loading = ref(false)

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const [statsData, friendsData] = await Promise.all([
      $fetch('/api/dashboard/stats'),
      $fetch('/api/friends')
    ])

    if (statsData) stats.value = statsData
    if (friendsData) recentFriends.value = friendsData.slice(0, 5) // Get first 5 friends
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <!-- Loading state while user is being hydrated -->
  <div v-if="userLoading" class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin mx-auto mb-4" />
      <p class="text-gray-600">Loading...</p>
    </div>
  </div>

  <!-- Show login page if no user after hydration -->
  <div v-else-if="!user" class="min-h-screen flex items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900">Welcome</h1>
          <p class="text-gray-600 mt-2">Please sign in to continue</p>
        </div>
      </template>
      <div class="text-center">
        <UButton to="/login" color="primary" size="lg">
          Sign In
        </UButton>
      </div>
    </UCard>
  </div>

  <!-- Show dashboard if user is authenticated -->
  <div v-else class="min-h-screen">
    <UContainer class="py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600 mt-2">Welcome back! Here's an overview of your friends and groceries</p>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
      </div>

      <div v-else class="space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UCard>
            <div class="flex items-center space-x-3">
              <UIcon name="i-lucide-users" class="w-8 h-8 text-green-600" />
              <div>
                <p class="text-sm text-gray-600">Total Friends</p>
                <p class="text-2xl font-bold text-gray-900">{{ stats.totalFriends }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center space-x-3">
              <UIcon name="i-lucide-package" class="w-8 h-8 text-purple-600" />
              <div>
                <p class="text-sm text-gray-600">Grocery Items</p>
                <p class="text-2xl font-bold text-gray-900">{{ stats.totalItems }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center space-x-3">
              <UIcon name="i-lucide-user-plus" class="w-8 h-8 text-orange-600" />
              <div>
                <p class="text-sm text-gray-600">Pending Requests</p>
                <p class="text-2xl font-bold text-gray-900">{{ stats.pendingRequests }}</p>
              </div>
            </div>
          </UCard>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">Recent Friends</h3>
                <UButton to="/friends" variant="ghost" size="sm" icon="i-lucide-arrow-right">
                  View All
                </UButton>
              </div>
            </template>
            <div v-if="recentFriends.length > 0" class="space-y-3">
              <div v-for="friend in recentFriends" :key="friend.id"
                class="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                <div
                  class="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <UIcon name="i-lucide-user" class="w-5 h-5 text-white" />
                </div>
                <div class="flex-1">
                  <p class="font-medium text-gray-900">Friend #{{ friend.friend_id.slice(0, 8) }}</p>
                  <p class="text-sm text-gray-600">Added {{ new Date(friend.created_at).toLocaleDateString() }}</p>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <UIcon name="i-lucide-users" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p class="text-gray-600">No friends yet</p>
              <UButton to="/friends" color="primary" size="sm" class="mt-3">
                Add Friends
              </UButton>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
            </template>
            <div class="space-y-4">
              <UButton to="/groceries" color="primary" variant="outline" class="w-full h-16 flex-col">
                <UIcon name="i-lucide-package" class="w-6 h-6 mb-2" />
                <span>Browse Groceries</span>
              </UButton>
              <UButton to="/friends" color="success" variant="outline" class="w-full h-16 flex-col">
                <UIcon name="i-lucide-users" class="w-6 h-6 mb-2" />
                <span>Manage Friends</span>
              </UButton>
            </div>
          </UCard>
        </div>
      </div>
    </UContainer>
  </div>
</template>
