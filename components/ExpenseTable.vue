<template>
    <div class="expense-table">
        <!-- Header -->
        <div class="mb-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Expense Details</h2>
            <p class="text-gray-600 text-sm">Review your items and add friends to split the expense</p>
        </div>

        <!-- Expense Form -->
        <div class="space-y-6">
            <!-- Basic Info -->
            <div class="grid grid-cols-1 gap-4">
                <UFormField label="Expense Title" required>
                    <UInput v-model="expenseData.title" placeholder="e.g., Grocery Shopping" />
                </UFormField>
            </div>

            <UFormField label="Description">
                <UTextarea v-model="expenseData.description" placeholder="Add a description for this expense..."
                    :rows="3" />
            </UFormField>

            <!-- Items Table -->
            <div class="bg-white rounded-lg border">
                <div class="p-4 border-b">
                    <h3 class="text-lg font-medium text-gray-900">Items</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th
                                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Item
                                </th>
                                <th
                                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th
                                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Unit Price
                                </th>
                                <th
                                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="item in itemsWithQuantities" :key="item.id" class="hover:bg-gray-50">
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <img v-if="item.image_url" :src="item.image_url" :alt="item.name"
                                            class="w-8 h-8 rounded object-cover mr-3" />
                                        <div>
                                            <div class="text-sm font-medium text-gray-900">{{ item.name }}</div>
                                            <div class="text-sm text-gray-500">{{ item.unit }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <UInput v-model="item.quantity" type="number" min="1" class="w-20"
                                        @input="updateItemTotal(item)" />
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <UInput v-model="item.currentPrice" type="number" min="0" step="0.01" class="w-24"
                                        @input="updateItemTotal(item)" />
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    ₹{{ item.totalPrice.toFixed(2) }}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot class="bg-gray-50">
                            <tr>
                                <td colspan="3" class="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                    Total:
                                </td>
                                <td class="px-4 py-3 text-sm font-bold text-gray-900">
                                    ₹{{ totalAmount.toFixed(2) }}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Friends Section -->
            <div class="bg-white rounded-lg border">
                <div class="p-4 border-b flex items-center justify-between">
                    <h3 class="text-lg font-medium text-gray-900">Split with Friends</h3>
                    <UButton color="primary" variant="outline" size="sm" @click="showSelectFriends = true"
                        icon="i-heroicons-user-plus">
                        Add Friends
                    </UButton>
                </div>
                <div class="p-4">
                    <div v-if="selectedFriends.length === 0" class="text-center py-8">
                        <UIcon name="i-heroicons-user-group" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 class="text-lg font-medium text-gray-900 mb-2">No friends selected</h4>
                        <p class="text-gray-600 mb-4">Add friends to split this expense with</p>
                        <UButton color="primary" @click="showSelectFriends = true" icon="i-heroicons-user-plus">
                            Add Friends
                        </UButton>
                    </div>
                    <div v-else class="space-y-3">
                        <div v-for="friend in selectedFriends" :key="friend.id"
                            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <UAvatar :src="friend.friend?.avatar_url" :alt="getFriendName(friend)" size="sm" />
                                <div>
                                    <div class="text-sm font-medium text-gray-900">
                                        {{ getFriendName(friend) }}
                                    </div>
                                    <div class="text-xs text-gray-500">
                                        Involved in expense
                                    </div>
                                </div>
                            </div>
                            <UButton size="sm" variant="ghost" color="red" @click="removeFriend(friend.id)"
                                icon="i-heroicons-x-mark" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Summary -->
            <div class="bg-blue-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-blue-900">Total Amount:</span>
                    <span class="text-lg font-bold text-blue-900">₹{{ totalAmount.toFixed(2) }}</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-blue-700">Friends Involved:</span>
                    <span class="text-sm font-medium text-blue-700">{{ selectedFriends.length }}</span>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3">
                <UButton variant="outline" @click="$emit('cancel')">
                    Cancel
                </UButton>
                <UButton color="primary" :disabled="!expenseData.title || selectedFriends.length === 0"
                    :loading="loading" @click="createExpense">
                    Create Expense
                </UButton>
            </div>
        </div>

        <!-- Select Friends Drawer -->
        <SelectFriends v-model="showSelectFriends" @confirm="handleFriendsSelected"
            @cancel="showSelectFriends = false" />
    </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Friend = Database['public']['Tables']['friends']['Row'] & {
    friend?: {
        id: string
        email: string
        full_name: string | null
        avatar_url: string | null
    }
}

type GroceryItem = Database['public']['Tables']['grocery_items']['Row']

interface Props {
    items: GroceryItem[]
}

interface Emits {
    (e: 'expense-created', expense: any): void
    (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive data
const showSelectFriends = ref(false)
const selectedFriends = ref<Friend[]>([])
const loading = ref(false)

const expenseData = ref({
    title: '',
    description: ''
})

// Create items with quantities and current prices
const itemsWithQuantities = ref<Array<GroceryItem & {
    quantity: number
    currentPrice: number
    totalPrice: number
}>>([])

// Initialize items with quantities
onMounted(() => {
    itemsWithQuantities.value = props.items.map(item => ({
        ...item,
        quantity: 1,
        currentPrice: item.default_price || 0,
        totalPrice: item.default_price || 0
    }))
})

// Computed properties
const totalAmount = computed(() => {
    return itemsWithQuantities.value.reduce((total, item) => {
        return total + item.totalPrice
    }, 0)
})

// Methods
const updateItemTotal = (item: any) => {
    item.totalPrice = item.quantity * item.currentPrice
}

const getFriendName = (friend: Friend) => {
    if (friend.friend?.full_name) {
        return friend.friend.full_name.split(' ')[0]
    }
    if (friend.friend?.email) {
        return friend.friend.email.split('@')[0]
    }
    return 'Unknown User'
}

const handleFriendsSelected = (friends: Friend[]) => {
    selectedFriends.value = friends
    showSelectFriends.value = false
}

const removeFriend = (friendId: string) => {
    selectedFriends.value = selectedFriends.value.filter(f => f.id !== friendId)
}

const createExpense = async () => {
    if (!expenseData.value.title || selectedFriends.value.length === 0) return

    loading.value = true

    try {
        const { data, error } = await useFetch('/api/expenses', {
            method: 'POST',
            body: {
                title: expenseData.value.title,
                description: expenseData.value.description,
                amount: totalAmount.value,
                currency: 'INR',
                selectedFriends: selectedFriends.value.map(f => f.friend?.id || f.friend_id),
                items: itemsWithQuantities.value.map(item => ({
                    grocery_item_id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    unit_price: item.currentPrice,
                    total_price: item.totalPrice,
                    notes: null
                }))
            }
        })

        if (error.value) {
            throw new Error(error.value.message)
        }

        emit('expense-created', data.value)
    } catch (err: any) {
        const toast = useToast()
        toast.add({
            title: 'Error',
            description: err.message || 'Failed to create expense',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}
</script>