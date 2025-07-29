<script setup lang="ts">
import type { Database } from '~/types/database.types'

const { user } = useAuth()
const toast = useToast()

// Redirect to login if not authenticated


const loading = ref(false)
const dateRange = ref({
  start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
})

const selectedGroup = ref<string | null>(null)
const groups = ref<Database['public']['Tables']['groups']['Row'][]>([])

const reportData = ref({
  totalExpenses: 0,
  averageExpense: 0,
  totalExpensesCount: 0,
  categoryBreakdown: [] as Array<{ category: string; amount: number; percentage: number }>,
  monthlyTrend: [] as Array<{ month: string; amount: number }>,
  topExpenses: [] as Database['public']['Tables']['expenses']['Row'][]
})

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

const fetchReportData = async () => {
  if (!user.value) return

  loading.value = true
  try {
    const params = new URLSearchParams({
      start_date: dateRange.value.start,
      end_date: dateRange.value.end,
      ...(selectedGroup.value && { group_id: selectedGroup.value })
    })

    const { data, error } = await useFetch(`/api/reports/expenses?${params}`)
    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'red' })
    } else if (data.value) {
      reportData.value = data.value
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
  try {
    const params = new URLSearchParams({
      start_date: dateRange.value.start,
      end_date: dateRange.value.end,
      format,
      ...(selectedGroup.value && { group_id: selectedGroup.value })
    })

    const { data, error } = await useFetch(`/api/reports/export?${params}`)
    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'red' })
    } else if (data.value) {
      // Handle file download
      const link = document.createElement('a')
      link.href = data.value.download_url
      link.download = `expense-report-${dateRange.value.start}-${dateRange.value.end}.${format}`
      link.click()
      toast.add({ title: 'Success', description: 'Report exported successfully!', color: 'green' })
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'red' })
  }
}

onMounted(() => {
  fetchGroups()
  fetchReportData()
})

watch([dateRange, selectedGroup], () => {
  fetchReportData()
})
</script>

<template>
  <div v-if="user" class="min-h-screen ">
    <UContainer class="py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p class="text-gray-600 mt-2">Analyze your spending patterns and generate reports</p>
        </div>
        <div class="flex space-x-2">
          <UButton @click="exportReport('pdf')" variant="outline">
            <UIcon name="i-lucide-file-text" class="w-4 h-4 mr-2" />
            Export PDF
          </UButton>
          <UButton @click="exportReport('excel')" variant="outline">
            <UIcon name="i-lucide-file-spreadsheet" class="w-4 h-4 mr-2" />
            Export Excel
          </UButton>
          <UButton @click="exportReport('csv')" variant="outline">
            <UIcon name="i-lucide-file-text" class="w-4 h-4 mr-2" />
            Export CSV
          </UButton>
        </div>
      </div>

      <!-- Filters -->
      <UCard class="mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UFormField label="Start Date">
            <UInput v-model="dateRange.start" type="date" />
          </UFormField>

          <UFormField label="End Date">
            <UInput v-model="dateRange.end" type="date" />
          </UFormField>

          <UFormField label="Group (Optional)">
            <USelect v-model="selectedGroup" :options="groups.map(g => ({ label: g.name, value: g.id }))"
              placeholder="All groups" clearable />
          </UFormField>
        </div>
      </UCard>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
      </div>

      <!-- Report Content -->
      <div v-else class="space-y-8">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <UCard>
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600">Total Expenses</p>
              <p class="text-2xl font-bold text-gray-900">₹{{ reportData.totalExpenses.toFixed(2) }}</p>
            </div>
          </UCard>

          <UCard>
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600">Average Expense</p>
              <p class="text-2xl font-bold text-gray-900">₹{{ reportData.averageExpense.toFixed(2) }}</p>
            </div>
          </UCard>

          <UCard>
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600">Total Transactions</p>
              <p class="text-2xl font-bold text-gray-900">{{ reportData.totalExpensesCount }}</p>
            </div>
          </UCard>

          <UCard>
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600">Date Range</p>
              <p class="text-lg font-semibold text-gray-900">
                {{ new Date(dateRange.start).toLocaleDateString() }} - {{ new Date(dateRange.end).toLocaleDateString()
                }}
              </p>
            </div>
          </UCard>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Category Breakdown -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Expense by Category</h3>
            </template>

            <div v-if="reportData.categoryBreakdown.length > 0" class="space-y-4">
              <div v-for="category in reportData.categoryBreakdown" :key="category.category"
                class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-4 h-4 rounded-full"
                    :style="{ backgroundColor: category.category === 'Others' ? '#9CA3AF' : '#3B82F6' }"></div>
                  <span class="font-medium">{{ category.category }}</span>
                </div>
                <div class="text-right">
                  <p class="font-semibold">₹{{ category.amount.toFixed(2) }}</p>
                  <p class="text-sm text-gray-500">{{ category.percentage.toFixed(1) }}%</p>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-gray-500">
              No category data available
            </div>
          </UCard>

          <!-- Monthly Trend -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Monthly Trend</h3>
            </template>

            <div v-if="reportData.monthlyTrend.length > 0" class="space-y-4">
              <div v-for="month in reportData.monthlyTrend" :key="month.month"
                class="flex items-center justify-between">
                <span class="font-medium">{{ month.month }}</span>
                <div class="flex items-center space-x-2">
                  <div class="w-32 bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full"
                      :style="{ width: `${(month.amount / Math.max(...reportData.monthlyTrend.map(m => m.amount))) * 100}%` }">
                    </div>
                  </div>
                  <span class="font-semibold text-sm">₹{{ month.amount.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-gray-500">
              No trend data available
            </div>
          </UCard>
        </div>

        <!-- Top Expenses -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Top Expenses</h3>
          </template>

          <div v-if="reportData.topExpenses.length > 0" class="space-y-4">
            <div v-for="(expense, index) in reportData.topExpenses" :key="expense.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center space-x-4">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-sm font-bold text-blue-600">#{{ index + 1 }}</span>
                </div>
                <div>
                  <p class="font-semibold">₹{{ expense.total_amount.toFixed(2) }}</p>
                  <p class="text-sm text-gray-600">
                    {{ new Date(expense.purchase_date).toLocaleDateString() }}
                    <span v-if="expense.store_name"> • {{ expense.store_name }}</span>
                  </p>
                </div>
              </div>

              <div class="text-right">
                <p v-if="expense.notes" class="text-sm text-gray-500">{{ expense.notes }}</p>
                <span v-if="expense.group_id" class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Group Expense
                </span>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-gray-500">
            No expenses found in the selected date range
          </div>
        </UCard>
      </div>
    </UContainer>
  </div>
</template>