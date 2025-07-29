<script setup lang="ts">
import type { Database } from '~/types/database.types'

const { user } = useAuth()
const toast = useToast()

// Redirect to login if not authenticated


const expenses = ref<Database['public']['Tables']['expenses']['Row'][]>([])
const loading = ref(false)
const showCreateModal = ref(false)

const newExpense = ref({
  total_amount: 0,
  purchase_date: new Date().toISOString().split('T')[0],
  store_name: '',
  notes: '',
  group_id: null as string | null
})

const groups = ref<Database['public']['Tables']['groups']['Row'][]>([])

const fetchExpenses = async () => {
  if (!user.value) return

  loading.value = true
  try {
    const { data, error } = await useFetch('/api/expenses')
    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'error' })
    } else if (data.value) {
      expenses.value = data.value
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

const createExpense = async () => {
  if (!newExpense.value.total_amount || newExpense.value.total_amount <= 0) {
    toast.add({ title: 'Error', description: 'Total amount must be greater than 0', color: 'red' })
    return
  }

  try {
    const { data, error } = await useFetch('/api/expenses', {
      method: 'POST',
      body: newExpense.value
    })

    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'red' })
    } else if (data.value) {
      expenses.value.unshift(data.value)
      showCreateModal.value = false
      newExpense.value = {
        total_amount: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        store_name: '',
        notes: '',
        group_id: null
      }
      toast.add({ title: 'Success', description: 'Expense added successfully!', color: 'green' })
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'red' })
  }
}

const deleteExpense = async (expenseId: string) => {
  if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
    return
  }

  try {
    const { error } = await useFetch(`/api/expenses/${expenseId}`, {
      method: 'DELETE'
    })

    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'red' })
    } else {
      expenses.value = expenses.value.filter(e => e.id !== expenseId)
      toast.add({ title: 'Success', description: 'Expense deleted successfully!', color: 'green' })
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'red' })
  }
}

onMounted(() => {
  fetchExpenses()
  fetchGroups()
})
</script>

<template>
  <div v-if="user" class="min-h-screen ">
    <UContainer class="py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Expenses</h1>
          <p class="text-gray-600 mt-2">Track and manage your expenses</p>
        </div>
        <UButton @click="showCreateModal = true" color="primary">
          <UIcon name="i-lucide-plus" class="w-4 h-4 mr-2" />
          Add Expense
        </UButton>
      </div>

      <!-- Expenses List -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
      </div>

      <div v-else-if="expenses.length > 0" class="space-y-4" v-auto-animate>
        <UCard v-for="expense in expenses" :key="expense.id" class="hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="p-3 bg-green-100 rounded-lg">
                <UIcon name="i-lucide-wallet" class="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  ₹{{ expense.total_amount }}
                </h3>
                <p class="text-sm text-gray-600">
                  {{ new Date(expense.purchase_date).toLocaleDateString() }}
                  <span v-if="expense.store_name"> • {{ expense.store_name }}</span>
                </p>
                <p v-if="expense.notes" class="text-sm text-gray-500 mt-1">
                  {{ expense.notes }}
                </p>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <span v-if="expense.group_id" class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                Group Expense
              </span>
              <UDropdown :items="[
                [
                  {
                    label: 'View Details',
                    icon: 'i-lucide-eye',
                    to: `/expenses/${expense.id}`
                  },
                  {
                    label: 'Edit Expense',
                    icon: 'i-lucide-edit',
                    to: `/expenses/${expense.id}/edit`
                  }
                ],
                [
                  {
                    label: 'Delete Expense',
                    icon: 'i-lucide-trash',
                    click: () => deleteExpense(expense.id)
                  }
                ]
              ]">
                <UButton icon="i-lucide-more-horizontal" variant="ghost" size="sm" />
              </UDropdown>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-wallet" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
        <p class="text-gray-600 mb-6">Start tracking your expenses to see your spending patterns</p>
        <UButton @click="showCreateModal = true" color="primary">
          <UIcon name="i-lucide-plus" class="w-4 h-4 mr-2" />
          Add Expense
        </UButton>
      </div>
    </UContainer>

    <!-- Create Expense Modal -->
    <UModal v-model:open="showCreateModal">
      <template #header="{ close }">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Add New Expense</h3>
          <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="close" />
        </div>
      </template>

      <template #content="{ close }">
        <form @submit.prevent="createExpense" class="space-y-4">
          <UFormField label="Total Amount" required>
            <UInputNumber v-model.number="newExpense.total_amount" placeholder="0.00" :min="0" :step="0.01" required />
          </UFormField>

          <UFormField label="Purchase Date" required>
            <UInput v-model="newExpense.purchase_date" type="date" required />
          </UFormField>

          <UFormField label="Store Name">
            <UInput v-model="newExpense.store_name" placeholder="Enter store name (optional)" />
          </UFormField>

          <UFormField label="Group (Optional)">
            <USelect v-model="newExpense.group_id" :options="groups.map(g => ({ label: g.name, value: g.id }))"
              placeholder="Select a group (optional)" clearable />
          </UFormField>

          <UFormField label="Notes">
            <UTextarea v-model="newExpense.notes" placeholder="Add any additional notes (optional)" rows="3" />
          </UFormField>
        </form>
      </template>

      <template #footer="{ close }">
        <div class="flex justify-end space-x-2">
          <UButton variant="outline" @click="close">
            Cancel
          </UButton>
          <UButton color="primary" @click="createExpense"
            :disabled="!newExpense.total_amount || newExpense.total_amount <= 0">
            Add Expense
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>