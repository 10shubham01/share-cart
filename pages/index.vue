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
  totalExpenses: number
  totalGroups: number
  totalItems: number
  monthlySpending: number
}>({
  totalExpenses: 0,
  totalGroups: 0,
  totalItems: 0,
  monthlySpending: 0
})

const recentGroups = ref<Database['public']['Tables']['groups']['Row'][]>([])
const recentExpenses = ref<Database['public']['Tables']['expenses']['Row'][]>([])
const recentShoppingLists = ref<Database['public']['Tables']['shopping_lists']['Row'][]>([])
const loading = ref(false)

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const [statsData, groupsData, expensesData, listsData] = await Promise.all([
      $fetch('/api/dashboard/stats'),
      $fetch('/api/dashboard/recent-groups'),
      $fetch('/api/dashboard/recent-expenses'),
      $fetch('/api/dashboard/recent-shopping-lists')
    ])

    if (statsData) stats.value = statsData
    if (groupsData) recentGroups.value = groupsData
    if (expensesData) recentExpenses.value = expensesData
    if (listsData) recentShoppingLists.value = listsData
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
        <p class="text-gray-600 mt-2">Welcome back! Here's an overview of your grocery tracking</p>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
      </div>

      <div v-else class="space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <UCard>
            <div class="flex items-center space-x-3">
              <UIcon name="i-lucide-wallet" class="w-8 h-8 text-blue-600" />
              <div>
                <p class="text-sm text-gray-600">Total Expenses</p>
                <p class="text-2xl font-bold text-gray-900">₹{{ stats.totalExpenses }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center space-x-3">
              <UIcon name="i-lucide-users" class="w-8 h-8 text-green-600" />
              <div>
                <p class="text-sm text-gray-600">Your Groups</p>
                <p class="text-2xl font-bold text-gray-900">{{ stats.totalGroups }}</p>
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
              <UIcon name="i-lucide-trending-up" class="w-8 h-8 text-orange-600" />
              <div>
                <p class="text-sm text-gray-600">This Month</p>
                <p class="text-2xl font-bold text-gray-900">₹{{ stats.monthlySpending }}</p>
              </div>
            </div>
          </UCard>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">Recent Groups</h3>
                <UButton to="/groups" variant="ghost" size="sm" icon="i-lucide-arrow-right">
                  View All
                </UButton>
              </div>
            </template>
            <div v-if="recentGroups.length > 0" class="space-y-3">
              <div v-for="group in recentGroups.slice(0, 5)" :key="group.id"
                class="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                <div
                  class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <UIcon name="i-lucide-users" class="w-5 h-5 text-white" />
                </div>
                <div class="flex-1">
                  <p class="font-medium text-gray-900">{{ group.name }}</p>
                  <p class="text-sm text-gray-600">{{ group.description || 'No description' }}</p>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <UIcon name="i-lucide-users" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p class="text-gray-600">No groups yet</p>
              <UButton to="/groups" color="primary" size="sm" class="mt-3">
                Create Group
              </UButton>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">Recent Expenses</h3>
                <UButton to="/expenses" variant="ghost" size="sm" icon="i-lucide-arrow-right">
                  View All
                </UButton>
              </div>
            </template>
            <div v-if="recentExpenses.length > 0" class="space-y-3">
              <div v-for="expense in recentExpenses.slice(0, 5)" :key="expense.id"
                class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-3">
                  <UIcon name="i-lucide-wallet" class="w-5 h-5 text-green-600" />
                  <div>
                    <p class="font-medium text-gray-900">{{ expense.store_name || 'Unknown Store' }}</p>
                    <p class="text-sm text-gray-600">{{ new Date(expense.purchase_date).toLocaleDateString() }}</p>
                  </div>
                </div>
                <span class="font-semibold text-green-600">₹{{ expense.total_amount }}</span>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <UIcon name="i-lucide-wallet" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p class="text-gray-600">No expenses yet</p>
              <UButton to="/groceries" color="primary" size="sm" class="mt-3">
                Add Expenses
              </UButton>
            </div>
          </UCard>
        </div>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <UButton to="/groceries" color="primary" variant="outline" class="h-20 flex-col">
              <UIcon name="i-lucide-package" class="w-6 h-6 mb-2" />
              <span>Browse Groceries</span>
            </UButton>
            <UButton to="/groups" color="success" variant="outline" class="h-20 flex-col">
              <UIcon name="i-lucide-users" class="w-6 h-6 mb-2" />
              <span>Manage Groups</span>
            </UButton>
            <UButton to="/expenses" color="warning" variant="outline" class="h-20 flex-col">
              <UIcon name="i-lucide-wallet" class="w-6 h-6 mb-2" />
              <span>View Expenses</span>
            </UButton>
            <UButton to="/reports" color="info" variant="outline" class="h-20 flex-col">
              <UIcon name="i-lucide-bar-chart" class="w-6 h-6 mb-2" />
              <span>Reports</span>
            </UButton>
          </div>
        </UCard>
      </div>
    </UContainer>
  </div>
</template>
