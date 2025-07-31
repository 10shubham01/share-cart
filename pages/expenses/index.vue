<template>
    <div>
        <!-- Header -->
        <div
            class="bg-gradient-to-r from-white via-white to-primary-50/30 backdrop-blur-md border-b border-gray-200/50 py-6 w-full shadow-sm">
            <div class="flex justify-between flex-col sm:flex-row px-4 max-w-7xl mx-auto">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="p-2 bg-primary-100 rounded-xl">
                            <UIcon name="i-heroicons-currency-dollar" class="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                            <h1
                                class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-primary-700 bg-clip-text text-transparent">
                                Expenses
                            </h1>
                            <p class="text-gray-600 text-sm font-medium">Track and manage your shared expenses</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="px-4 py-6 max-w-7xl mx-auto">
            <!-- Filters Section -->
            <div class="bg-white rounded-lg border shadow-sm p-4 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900">Filters</h3>
                    <UButton size="sm" variant="ghost" @click="clearFilters">
                        Clear All
                    </UButton>
                </div>

                <div class="space-y-6">
                    <!-- Friends Filter (including Me) -->
                    <div v-if="allFriendOptions.length > 0">
                        <label class="text-sm font-medium text-gray-700 mb-3 block">Filter by Friends (including
                            Me)</label>
                        <div class="flex flex-wrap gap-3">
                            <div v-for="friend in allFriendOptions" :key="friend.value"
                                class="cursor-pointer transition-all duration-200"
                                @click="toggleFriendFilter(friend.value)">
                                <div class="relative">
                                    <UAvatar :src="friend.avatar_url" :alt="friend.label" size="md"
                                        class="border-2 transition-all duration-200"
                                        :class="filters.selectedFriends.includes(friend.value) ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'" />
                                    <div v-if="filters.selectedFriends.includes(friend.value)"
                                        class="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                                        <UIcon name="i-heroicons-check" class="h-3 w-3 text-white" />
                                    </div>
                                </div>
                                <div class="text-xs text-center mt-1 text-gray-600">{{ friend.label }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Date Range Filter -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <UFormField label="Date From">
                            <UInput v-model="filters.dateFrom" type="date" @update:model-value="applyFilters" />
                        </UFormField>

                        <UFormField label="Date To">
                            <UInput v-model="filters.dateTo" type="date" @update:model-value="applyFilters" />
                        </UFormField>
                    </div>
                </div>
            </div>
            <!-- Loading State -->
            <div v-if="loading" class="space-y-4">
                <div v-for="i in 3" :key="i" class="bg-white rounded-lg border p-6 animate-pulse">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="w-48 h-6 bg-gray-300 rounded mb-3"></div>
                            <div class="w-32 h-4 bg-gray-300 rounded"></div>
                        </div>
                        <div class="w-24 h-8 bg-gray-300 rounded"></div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredExpenses.length === 0" class="text-center py-12">
                <UIcon name="i-heroicons-currency-dollar" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 class="text-xl font-semibold text-gray-900 mb-2">
                    {{ expenses.length === 0 ? 'No expenses yet' : 'No expenses match your filters' }}
                </h3>
                <p class="text-gray-600 mb-4">
                    {{ emptyStateMessage }}
                </p>
                <UButton v-if="expenses.length === 0" color="primary" @click="navigateTo('/groceries')">
                    <UIcon name="i-heroicons-plus" class="h-4 w-4 mr-2" />
                    Create Expense
                </UButton>
                <UButton v-else variant="ghost" @click="clearFilters">
                    Clear Filters
                </UButton>
            </div>

            <!-- Expenses List -->
            <div v-else class="space-y-6">
                <div v-for="expense in filteredExpenses" :key="expense.id"
                    class="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                    <!-- Expense Header -->
                    <div class="p-6 border-b">
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <div class="flex items-center gap-3 mb-2">
                                    <h3 class="text-lg font-semibold text-gray-900">{{ expense.title }}</h3>
                                </div>
                                <p v-if="expense.description" class="text-gray-600 text-sm mb-2">
                                    {{ expense.description }}
                                </p>
                                <div class="flex items-center gap-4 text-sm text-gray-500">
                                    <span class="flex items-center gap-1">
                                        <UIcon name="i-heroicons-calendar" class="h-4 w-4" />
                                        {{ formatDate(expense.created_at) }}
                                    </span>
                                    <span class="flex items-center gap-1">
                                        <UIcon name="i-heroicons-users" class="h-4 w-4" />
                                        {{ expense.expense_shares?.length || 0 }} friends
                                    </span>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-2xl font-bold text-gray-900">
                                    ${{ expense.amount.toFixed(2) }}
                                </div>
                                <div class="text-sm text-gray-500">
                                    {{ expense.currency }}
                                </div>
                                <UButton size="sm" variant="ghost" color="red" @click="deleteExpense(expense.id)"
                                    icon="i-heroicons-trash" class="mt-2" />
                            </div>
                        </div>
                    </div>

                    <!-- Items Section -->
                    <div v-if="expense.expense_items && expense.expense_items.length > 0" class="p-6 border-b">
                        <h4 class="text-sm font-medium text-gray-900 mb-3">Items</h4>
                        <div class="space-y-2">
                            <div v-for="item in expense.expense_items" :key="item.id"
                                class="flex items-center justify-between py-2">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                        <UIcon name="i-heroicons-shopping-bag" class="h-4 w-4 text-gray-500" />
                                    </div>
                                    <div>
                                        <div class="text-sm font-medium text-gray-900">{{ item.name }}</div>
                                        <div class="text-xs text-gray-500">
                                            Qty: {{ item.quantity }} × ${{ item.unit_price.toFixed(2) }}
                                        </div>
                                    </div>
                                </div>
                                <div class="text-sm font-medium text-gray-900">
                                    ${{ item.total_price.toFixed(2) }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Friends Section -->
                    <div v-if="expense.expense_shares && expense.expense_shares.length > 0" class="p-6">
                        <h4 class="text-sm font-medium text-gray-900 mb-3">Friends Involved</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div v-for="share in expense.expense_shares" :key="share.id"
                                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div class="flex items-center gap-3">
                                    <UAvatar :src="share.friend?.avatar_url" :alt="getFriendName(share.friend)"
                                        size="sm" />
                                    <div>
                                        <div class="text-sm font-medium text-gray-900">
                                            {{ getFriendName(share.friend) }}
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            Involved
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Expense = Database['public']['Tables']['expenses']['Row'] & {
    expense_shares?: Array<Database['public']['Tables']['expense_shares']['Row'] & {
        friend?: {
            id: string
            full_name: string | null
            email: string
            avatar_url: string | null
        }
    }>
    expense_items?: Database['public']['Tables']['expense_items']['Row'][]
}

// Reactive data
const expenses = ref<Expense[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Filters
const filters = ref({
    dateFrom: '',
    dateTo: '',
    selectedFriends: [] as string[] // For multiple friend selection
})

// All friends for filtering
const allFriends = ref<Array<{
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
}>>([])

// Composables
const { user } = useAuth()
const toast = useToast()

// Computed properties
const friendOptions = computed(() => {
    return allFriends.value.map(friend => ({
        label: friend.full_name?.split(' ')[0] || friend.email.split('@')[0],
        value: friend.id,
        avatar_url: friend.avatar_url
    }))
})

const allFriendOptions = computed(() => {
    const me = {
        label: user.value?.user_metadata?.full_name?.split(' ')[0] || user.value?.email?.split('@')[0] || 'Me',
        value: user.value?.id || '',
        avatar_url: user.value?.user_metadata?.avatar_url || null
    }

    const friends = allFriends.value.map(friend => ({
        label: friend.full_name?.split(' ')[0] || friend.email.split('@')[0],
        value: friend.id,
        avatar_url: friend.avatar_url
    }))

    return [me, ...friends]
})

const filteredExpenses = computed(() => {
    let filtered = expenses.value

    // Filter by selected friends (including Me)
    if (filters.value.selectedFriends.length > 0) {
        filtered = filtered.filter(expense => {
            // Check if expense creator is in selected friends
            const creatorSelected = filters.value.selectedFriends.includes(expense.created_by)

            // Check if any involved friends are in selected friends
            const involvedFriendsSelected = expense.expense_shares?.some(share =>
                filters.value.selectedFriends.includes(share.friend_id)
            )

            // Check if current user is involved as a friend (not just as creator)
            const currentUserInvolved = expense.expense_shares?.some(share =>
                share.user_id === user.value?.id && filters.value.selectedFriends.includes(user.value?.id)
            )

            return creatorSelected || involvedFriendsSelected || currentUserInvolved
        })
    }

    // Filter by date range
    if (filters.value.dateFrom) {
        const fromDate = new Date(filters.value.dateFrom)
        filtered = filtered.filter(expense =>
            new Date(expense.created_at) >= fromDate
        )
    }

    if (filters.value.dateTo) {
        const toDate = new Date(filters.value.dateTo)
        toDate.setHours(23, 59, 59, 999) // End of day
        filtered = filtered.filter(expense =>
            new Date(expense.created_at) <= toDate
        )
    }

    return filtered
})

// Computed property for empty state message
const emptyStateMessage = computed(() => {
    return expenses.value.length === 0 ? 'Create your first expense to start tracking shared costs' : 'Try adjusting your filters to see more results'
})

// Methods
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const getFriendName = (friend: any) => {
    if (friend?.full_name) {
        return friend.full_name.split(' ')[0]
    }
    if (friend?.email) {
        return friend.email.split('@')[0]
    }
    return 'Unknown User'
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending':
            return 'warning'
        case 'accepted':
            return 'success'
        case 'rejected':
            return 'error'
        case 'paid':
            return 'green'
        default:
            return 'neutral'
    }
}

const fetchExpenses = async () => {
    if (!user.value) return

    loading.value = true
    error.value = null

    try {
        const { data, error: fetchError } = await useFetch('/api/expenses')

        if (fetchError.value) {
            throw new Error(fetchError.value.message)
        }

        if (data.value) {
            expenses.value = data.value
        }
    } catch (err: any) {
        error.value = err.message || 'Failed to load expenses'
        toast.add({
            title: 'Error',
            description: error.value || 'Failed to load expenses',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}

const deleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return
    }

    try {
        const { error: deleteError } = await useFetch(`/api/expenses/${expenseId}`, {
            method: 'DELETE'
        })

        if (deleteError.value) {
            throw new Error(deleteError.value.message)
        }

        // Remove from local list
        expenses.value = expenses.value.filter(expense => expense.id !== expenseId)

        toast.add({
            title: 'Success',
            description: 'Expense deleted successfully!',
            color: 'success'
        })
    } catch (err: any) {
        toast.add({
            title: 'Error',
            description: err.message || 'Failed to delete expense',
            color: 'error'
        })
    }
}

const applyFilters = () => {
    // This is handled by the computed property
    // Just trigger reactivity
}

const clearFilters = () => {
    filters.value = {
        dateFrom: '',
        dateTo: '',
        selectedFriends: []
    }
}

const toggleFriendFilter = (friendId: string) => {
    const index = filters.value.selectedFriends.indexOf(friendId)
    if (index > -1) {
        // Deselect if already selected
        filters.value.selectedFriends.splice(index, 1)
    } else {
        // Select new friend
        filters.value.selectedFriends.push(friendId)
    }
}

const fetchFriends = async () => {
    if (!user.value) return

    try {
        const { data, error: fetchError } = await useFetch('/api/friends')

        if (fetchError.value) {
            throw new Error(fetchError.value.message)
        }

        if (data.value) {
            // Extract unique friends from all expense shares
            const friendIds = new Set<string>()
            expenses.value.forEach(expense => {
                expense.expense_shares?.forEach(share => {
                    if (share.friend) {
                        friendIds.add(share.friend.id)
                    }
                })
            })

            // Add friends from the friends list
            data.value.forEach(friend => {
                if (friend.friend) {
                    friendIds.add(friend.friend.id)
                }
            })

            // Create unique friends list
            const uniqueFriends = new Map<string, any>()
            data.value.forEach(friend => {
                if (friend.friend && !uniqueFriends.has(friend.friend.id)) {
                    uniqueFriends.set(friend.friend.id, friend.friend)
                }
            })

            allFriends.value = Array.from(uniqueFriends.values())
        }
    } catch (err: any) {
        console.error('Failed to fetch friends for filtering:', err)
    }
}

// Initialize
onMounted(() => {
    fetchExpenses()
    fetchFriends()
})
</script>