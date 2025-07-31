<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <!-- Enhanced Header -->
        <div class="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
            <div class="px-4 py-6 max-w-7xl mx-auto">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                            <UIcon name="i-heroicons-currency-dollar" class="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1
                                class="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-blue-600 bg-clip-text text-transparent">
                                Expenses
                            </h1>
                            <p class="text-gray-600 font-medium">Track and manage your shared expenses</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="px-4 py-8 max-w-7xl mx-auto">
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div
                    class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Expenses</p>
                            <p class="text-2xl font-bold text-gray-900">${{ totalAmount.toFixed(2) }}</p>
                        </div>
                        <div class="p-3 bg-blue-100 rounded-xl">
                            <UIcon name="i-heroicons-currency-dollar" class="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div
                    class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">This Month</p>
                            <p class="text-2xl font-bold text-gray-900">${{ monthlyAmount.toFixed(2) }}</p>
                        </div>
                        <div class="p-3 bg-green-100 rounded-xl">
                            <UIcon name="i-heroicons-calendar" class="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div
                    class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Expenses</p>
                            <p class="text-2xl font-bold text-gray-900">{{ expenses.length }}</p>
                        </div>
                        <div class="p-3 bg-purple-100 rounded-xl">
                            <UIcon name="i-heroicons-document-text" class="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Filters Section -->
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">Filters</h3>
                        <p class="text-sm text-gray-600">Refine your expense list</p>
                    </div>
                    <UButton size="sm" variant="ghost" @click="clearFilters" class="text-gray-600 hover:text-gray-900"
                        :disabled="!hasActiveFilters">
                        <UIcon name="i-heroicons-arrow-path" class="h-4 w-4 mr-2" />
                        Clear All
                    </UButton>
                </div>

                <div class="space-y-8">
                    <!-- Friends Filter -->
                    <FriendFilter v-if="allFriendOptions.length > 0" :friends="allFriendOptions"
                        v-model:selected-friends="filters.selectedFriends" label="Filter by Friends" />

                    <!-- Date Range Filter -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <DateRangePicker v-model="dateRange" label="Date Range" placeholder="Select date range" />

                        <!-- Quick Date Presets -->
                        <div class="space-y-2">
                            <label class="text-sm font-semibold text-gray-700">Quick Filters</label>
                            <div class="flex flex-wrap gap-2">
                                <UButton v-for="preset in datePresets" :key="preset.label" size="sm" variant="outline"
                                    @click="applyDatePreset(preset)" class="text-xs"
                                    :class="{ 'bg-blue-50 border-blue-200 text-blue-700': preset.active }">
                                    {{ preset.label }}
                                </UButton>
                            </div>
                        </div>
                    </div>

                    <!-- Active Filters Summary -->
                    <div v-if="hasActiveFilters" class="pt-4 border-t border-gray-100">
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <UIcon name="i-heroicons-funnel" class="h-4 w-4" />
                            <span class="font-medium">Active Filters:</span>
                            <div class="flex flex-wrap gap-2">
                                <span v-if="filters.selectedFriends.length > 0"
                                    class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                    {{ filters.selectedFriends.length }} friend{{ filters.selectedFriends.length > 1 ?
                                        's' : '' }}
                                    <UIcon name="i-heroicons-x-mark" class="h-3 w-3 cursor-pointer"
                                        @click="clearFriendFilters" />
                                </span>
                                <span v-if="dateRange.start"
                                    class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                    Date range selected
                                    <UIcon name="i-heroicons-x-mark" class="h-3 w-3 cursor-pointer"
                                        @click="clearDateRange" />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="space-y-6">
                <div v-for="i in 3" :key="i"
                    class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="w-48 h-6 bg-gray-300 rounded-lg mb-3"></div>
                            <div class="w-32 h-4 bg-gray-300 rounded-lg"></div>
                        </div>
                        <div class="w-24 h-8 bg-gray-300 rounded-lg"></div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Empty State -->
            <div v-else-if="filteredExpenses.length === 0" class="text-center py-16">
                <div class="max-w-md mx-auto">
                    <div class="relative mb-8">
                        <div
                            class="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mx-auto flex items-center justify-center">
                            <UIcon name="i-heroicons-currency-dollar" class="h-12 w-12 text-blue-600" />
                        </div>
                        <div
                            class="absolute -top-2 -right-2 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <UIcon name="i-heroicons-plus" class="h-4 w-4 text-yellow-600" />
                        </div>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-3">
                        {{ expenses.length === 0 ? 'No expenses yet' : 'No matching expenses' }}
                    </h3>
                    <p class="text-gray-600 mb-8 text-lg">
                        {{ emptyStateMessage }}
                    </p>
                    <div class="space-x-4">
                        <UButton v-if="expenses.length === 0" color="blue" size="lg" @click="navigateTo('/groceries')"
                            class="shadow-lg hover:shadow-xl transition-all duration-300">
                            <UIcon name="i-heroicons-plus" class="h-5 w-5 mr-2" />
                            Create Your First Expense
                        </UButton>
                        <UButton v-else variant="outline" size="lg" @click="clearFilters"
                            class="border-gray-300 text-gray-700 hover:bg-gray-50">
                            <UIcon name="i-heroicons-arrow-path" class="h-5 w-5 mr-2" />
                            Clear Filters
                        </UButton>
                    </div>
                </div>
            </div>

            <!-- Enhanced Expenses List -->
            <div v-else class="space-y-6">
                <div v-for="expense in filteredExpenses" :key="expense.id"
                    class="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden group">

                    <!-- Enhanced Expense Header -->
                    <div class="p-4 sm:p-6 border-b border-gray-100">
                        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div class="flex-1">
                                <div class="flex items-center gap-3 mb-3">
                                    <div class="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                                        <UIcon name="i-heroicons-receipt-refund" class="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h3
                                        class="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {{ expense.title }}
                                    </h3>
                                </div>
                                <p v-if="expense.description"
                                    class="text-gray-600 mb-3 leading-relaxed text-sm sm:text-base">
                                    {{ expense.description }}
                                </p>
                                <div
                                    class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-500">
                                    <span class="flex items-center gap-2">
                                        <UIcon name="i-heroicons-calendar" class="h-4 w-4" />
                                        {{ formatDate(expense.created_at) }}
                                    </span>
                                    <span class="flex items-center gap-2">
                                        <UIcon name="i-heroicons-users" class="h-4 w-4" />
                                        {{ expense.expense_shares?.length || 0 }} participants
                                    </span>
                                </div>
                            </div>
                            <div
                                class="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start gap-3 sm:gap-2">
                                <div class="text-right">
                                    <div
                                        class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                                        ${{ expense.amount.toFixed(2) }}
                                    </div>
                                    <div class="text-sm text-gray-500 font-medium">
                                        {{ expense.currency }}
                                    </div>
                                </div>
                                <UButton size="sm" variant="ghost" color="red" @click="deleteExpense(expense.id)"
                                    icon="i-heroicons-trash"
                                    class="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                        </div>
                    </div>

                    <!-- Collapsible Items Section -->
                    <div v-if="expense.expense_items && expense.expense_items.length > 0"
                        class="border-b border-gray-100">
                        <button @click="toggleItems(expense.id)"
                            class="w-full p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors duration-200">
                            <div class="flex items-center justify-between">
                                <h4 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <UIcon name="i-heroicons-shopping-bag" class="h-4 w-4 text-gray-500" />
                                    Items ({{ expense.expense_items.length }})
                                </h4>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-gray-500 font-medium hidden sm:inline">
                                        {{ isItemsExpanded(expense.id) ? 'Hide' : 'Show' }} details
                                    </span>
                                    <UIcon name="i-heroicons-chevron-down"
                                        class="h-4 w-4 text-gray-500 transition-transform duration-300"
                                        :class="{ 'rotate-180': isItemsExpanded(expense.id) }" />
                                </div>
                            </div>
                        </button>

                        <!-- Collapsible Content -->
                        <Transition enter-active-class="transition-all duration-300 ease-out"
                            enter-from-class="opacity-0 max-h-0" enter-to-class="opacity-100 max-h-96"
                            leave-active-class="transition-all duration-300 ease-in"
                            leave-from-class="opacity-100 max-h-96" leave-to-class="opacity-0 max-h-0">
                            <div v-show="isItemsExpanded(expense.id)" class="px-4 sm:px-6 pb-4 sm:pb-6">
                                <div class="space-y-3">
                                    <TransitionGroup enter-active-class="transition-all duration-300 ease-out"
                                        enter-from-class="opacity-0 transform translate-y-4"
                                        enter-to-class="opacity-100 transform translate-y-0"
                                        leave-active-class="transition-all duration-200 ease-in"
                                        leave-from-class="opacity-100 transform translate-y-0"
                                        leave-to-class="opacity-0 transform translate-y-4">
                                        <div v-for="(item, index) in expense.expense_items" :key="item.id"
                                            class="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200"
                                            :style="{ animationDelay: `${index * 50}ms` }">
                                            <div class="flex items-center gap-3 min-w-0 flex-1">
                                                <div
                                                    class="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                                    <UIcon name="i-heroicons-shopping-cart"
                                                        class="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                                                </div>
                                                <div class="min-w-0 flex-1">
                                                    <div class="text-sm font-semibold text-gray-900 truncate">{{
                                                        item.name }}</div>
                                                    <div class="text-xs text-gray-500">
                                                        {{ item.quantity }} × ${{ item.unit_price.toFixed(2) }}
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="text-sm font-bold text-gray-900 flex-shrink-0 ml-3">
                                                ${{ item.total_price.toFixed(2) }}
                                            </div>
                                        </div>
                                    </TransitionGroup>
                                </div>
                            </div>
                        </Transition>
                    </div>

                    <!-- Enhanced Participants Section -->
                    <div v-if="expense.expense_shares && expense.expense_shares.length > 0" class="p-4 sm:p-6">
                        <h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <UIcon name="i-heroicons-user-group" class="h-4 w-4 text-gray-500" />
                            Participants ({{ expense.expense_shares.length }})
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <TransitionGroup enter-active-class="transition-all duration-300 ease-out"
                                enter-from-class="opacity-0 transform scale-95"
                                enter-to-class="opacity-100 transform scale-100"
                                leave-active-class="transition-all duration-200 ease-in"
                                leave-from-class="opacity-100 transform scale-100"
                                leave-to-class="opacity-0 transform scale-95">
                                <div v-for="(share, index) in expense.expense_shares" :key="share.id"
                                    class="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200"
                                    :style="{ animationDelay: `${index * 100}ms` }">
                                    <div class="flex items-center gap-3 min-w-0 flex-1">
                                        <UAvatar :src="share.friend?.avatar_url" :alt="getFriendName(share.friend)"
                                            size="sm" class="ring-2 ring-white shadow-sm flex-shrink-0" />
                                        <div class="min-w-0 flex-1">
                                            <div class="text-sm font-semibold text-gray-900 truncate">
                                                {{ getFriendName(share.friend) }}
                                            </div>
                                            <div class="text-xs text-gray-500 font-medium">
                                                Participant
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-xs text-gray-400 flex-shrink-0 ml-2">
                                        <UIcon name="i-heroicons-check-circle" class="h-4 w-4 text-green-500" />
                                    </div>
                                </div>
                            </TransitionGroup>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/database.types'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'

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
    selectedFriends: [] as string[]
})

// Date range for the new date picker
const dateRange = ref<{
    start: CalendarDate | null
    end: CalendarDate | null
}>({
    start: null,
    end: null
})

// All friends for filtering
const allFriends = ref<Array<{
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
}>>([])

// Collapsible state for items
const expandedItems = ref<Set<string>>(new Set())

// Date presets for quick filtering
const datePresets = ref([
    { label: 'Today', days: 0, active: false },
    { label: 'Last 7 days', days: 7, active: false },
    { label: 'Last 30 days', days: 30, active: false },
    { label: 'This month', days: -1, active: false },
    { label: 'Last month', days: -2, active: false }
])

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
        id: user.value?.id || '',
        label: user.value?.user_metadata?.full_name?.split(' ')[0] || user.value?.email?.split('@')[0] || 'Me',
        avatar_url: user.value?.user_metadata?.avatar_url || null
    }

    const friends = allFriends.value.map(friend => ({
        id: friend.id,
        label: friend.full_name?.split(' ')[0] || friend.email.split('@')[0],
        avatar_url: friend.avatar_url
    }))

    return [me, ...friends]
})

// Enhanced computed properties for summary cards
const totalAmount = computed(() => {
    return expenses.value.reduce((sum, expense) => sum + expense.amount, 0)
})

const monthlyAmount = computed(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return expenses.value
        .filter(expense => new Date(expense.created_at) >= startOfMonth)
        .reduce((sum, expense) => sum + expense.amount, 0)
})

const hasActiveFilters = computed(() => {
    return filters.value.selectedFriends.length > 0 || dateRange.value.start !== null
})

const filteredExpenses = computed(() => {
    let filtered = expenses.value

    // Filter by selected friends (including Me)
    if (filters.value.selectedFriends.length > 0) {
        filtered = filtered.filter(expense => {
            const creatorSelected = filters.value.selectedFriends.includes(expense.created_by)
            const involvedFriendsSelected = expense.expense_shares?.some(share =>
                filters.value.selectedFriends.includes(share.friend_id)
            )
            const currentUserInvolved = expense.expense_shares?.some(share =>
                share.user_id === user.value?.id && filters.value.selectedFriends.includes(user.value?.id)
            )

            return creatorSelected || involvedFriendsSelected || currentUserInvolved
        })
    }

    // Filter by date range
    if (dateRange.value.start) {
        const startDate = dateRange.value.start.toDate(getLocalTimeZone())
        filtered = filtered.filter(expense =>
            new Date(expense.created_at) >= startDate
        )
    }

    if (dateRange.value.end) {
        const endDate = dateRange.value.end.toDate(getLocalTimeZone())
        endDate.setHours(23, 59, 59, 999)
        filtered = filtered.filter(expense =>
            new Date(expense.created_at) <= endDate
        )
    }

    return filtered
})

const emptyStateMessage = computed(() => {
    return expenses.value.length === 0
        ? 'Start tracking your shared expenses with friends and family'
        : 'Try adjusting your filters to see more results'
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

// Collapsible methods
const toggleItems = (expenseId: string) => {
    if (expandedItems.value.has(expenseId)) {
        expandedItems.value.delete(expenseId)
    } else {
        expandedItems.value.add(expenseId)
    }
}

const isItemsExpanded = (expenseId: string) => {
    return expandedItems.value.has(expenseId)
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
    // Handled by computed property
}

const clearFilters = () => {
    filters.value = {
        selectedFriends: []
    }
    dateRange.value = {
        start: null,
        end: null
    }
    datePresets.value.forEach(p => p.active = false)
}

const applyDatePreset = (preset: { label: string; days: number }) => {
    const now = new Date()
    let startDate: CalendarDate
    let endDate: CalendarDate

    if (preset.days === -1) { // This month
        startDate = new CalendarDate(now.getFullYear(), now.getMonth() + 1, 1)
        endDate = new CalendarDate(now.getFullYear(), now.getMonth() + 2, 0)
    } else if (preset.days === -2) { // Last month
        startDate = new CalendarDate(now.getFullYear(), now.getMonth(), 1)
        endDate = new CalendarDate(now.getFullYear(), now.getMonth() + 1, 0)
    } else if (preset.days === 0) { // Today
        startDate = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
        endDate = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
    } else if (preset.days === 7) { // Last 7 days
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        startDate = new CalendarDate(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth() + 1, sevenDaysAgo.getDate())
        endDate = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
    } else { // Last 30 days
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        startDate = new CalendarDate(thirtyDaysAgo.getFullYear(), thirtyDaysAgo.getMonth() + 1, thirtyDaysAgo.getDate())
        endDate = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
    }

    dateRange.value = { start: startDate, end: endDate }
    datePresets.value.forEach(p => p.active = false)
    const activePreset = datePresets.value.find(p => p.label === preset.label)
    if (activePreset) {
        activePreset.active = true
    }
}

const clearDateRange = () => {
    dateRange.value = { start: null, end: null }
    datePresets.value.forEach(p => p.active = false)
}

const clearFriendFilters = () => {
    filters.value.selectedFriends = []
}

const fetchFriends = async () => {
    if (!user.value) return

    try {
        const { data, error: fetchError } = await useFetch('/api/friends')

        if (fetchError.value) {
            throw new Error(fetchError.value.message)
        }

        if (data.value) {
            const friendIds = new Set<string>()
            expenses.value.forEach(expense => {
                expense.expense_shares?.forEach(share => {
                    if (share.friend) {
                        friendIds.add(share.friend.id)
                    }
                })
            })

            data.value.forEach(friend => {
                if (friend.friend) {
                    friendIds.add(friend.friend.id)
                }
            })

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