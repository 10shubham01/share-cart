<template>
    <UDrawer v-model:open="model">
        <template #header>
            <div class="flex items-center justify-between">
                <h1 class="text-lg font-semibold">Share with friends</h1>
                <UButton icon="i-heroicons-x-mark" variant="ghost" size="sm" @click="closeDrawer" />
            </div>
        </template>
        <template #body>
            <div class="p-4">
                <!-- Search Bar -->
                <div class="mb-4">
                    <UInput v-model="searchQuery" placeholder="Search..." leading-icon="i-heroicons-magnifying-glass"
                        class="w-full" />
                </div>

                <!-- Loading State -->
                <div v-if="loading" class="space-y-3">
                    <div v-for="i in 5" :key="i" class="flex items-center space-x-3 p-3 animate-pulse">
                        <div class="w-10 h-10 bg-gray-300 rounded-full"></div>
                        <div class="flex-1">
                            <div class="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                            <div class="h-3 bg-gray-300 rounded w-16"></div>
                        </div>
                        <div class="w-5 h-5 bg-gray-300 rounded"></div>
                    </div>
                </div>

                <!-- Friends List -->
                <div v-else-if="filteredFriends.length > 0" class="grid grid-cols-4 gap-2 min-h-72">
                    <div v-for="friend in filteredFriends" :key="friend.id" class="cursor-pointer transition-colors"
                        @click="toggleFriendSelection(friend)">
                        <div class="flex flex-col items-center space-y-2">
                            <!-- Avatar -->
                            <UAvatar :src="friend.friend?.avatar_url" :alt="getFriendName(friend)" size="md"
                                class="flex-shrink-0"
                                :class="isSelected(friend.id) ? 'outline-dashed outline-2 outline-primary-500' : ''" />
                            <!-- Name -->
                            <div class="flex-1 min-w-0">
                                <h4 class="text-sm font-medium text-gray-900 truncate"
                                    :class="isSelected(friend.id) ? 'text-primary-500' : ''">
                                    {{ getFriendName(friend) }}
                                </h4>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-if="!loading && filteredFriends.length === 0" class="text-center py-8 min-h-72">
                    <UIcon v-if="searchQuery" name="i-heroicons-magnifying-glass"
                        class="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <UIcon v-else name="i-heroicons-user-group" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">
                        {{ searchQuery ? 'No friends found' : 'No friends yet' }}
                    </h3>
                    <p class="text-gray-600">
                        {{ searchQuery ? 'Try adjusting your search terms' : 'Add friends to get started' }}
                    </p>
                </div>

                <!-- Action Button -->
                <div class="mt-6 py-4">
                    <UButton color="primary" block :disabled="selectedFriendIds.length === 0" @click="confirmSelection">
                        Share
                    </UButton>
                </div>
            </div>
        </template>
    </UDrawer>
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

interface Emits {
    (e: 'confirm', selectedFriends: Friend[]): void
    (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

const model = defineModel<boolean>({
    type: Boolean,
    required: true,
})

// Reactive data
const friends = ref<Friend[]>([])
const selectedFriendIds = ref<string[]>([])
const searchQuery = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

// Composables
const { user } = useAuth()
const toast = useToast()

// Computed properties
const filteredFriends = computed(() => {
    if (!searchQuery.value.trim()) {
        return friends.value
    }

    const query = searchQuery.value.toLowerCase().trim()
    return friends.value.filter(friend =>
        getFriendName(friend).toLowerCase().includes(query) ||
        friend.friend?.email?.toLowerCase().includes(query)
    )
})

const selectedFriends = computed(() => {
    return friends.value.filter(friend =>
        selectedFriendIds.value.includes(friend.friend?.id || friend.friend_id)
    )
})

// Methods
const getFriendName = (friend: Friend) => {
    if (friend.friend?.full_name) {
        // Split by space and take the first part (first name)
        return friend.friend.full_name.split(' ')[0]
    }
    if (friend.friend?.email) {
        return friend.friend.email.split('@')[0]
    }
    if (friend.friend_id) {
        return `User ${friend.friend_id.slice(0, 8)}`
    }
    return 'Unknown User'
}

const isSelected = (friendId: string) => {
    const friend = friends.value.find(f => f.id === friendId)
    const actualFriendId = friend?.friend?.id || friend?.friend_id
    return actualFriendId ? selectedFriendIds.value.includes(actualFriendId) : false
}

const toggleFriendSelection = (friend: Friend) => {
    const friendId = friend.friend?.id || friend.friend_id

    if (!friendId) return

    if (selectedFriendIds.value.includes(friendId)) {
        selectedFriendIds.value = selectedFriendIds.value.filter(id => id !== friendId)
    } else {
        selectedFriendIds.value = [...selectedFriendIds.value, friendId]
    }
}

const fetchFriends = async () => {
    if (!user.value) return

    loading.value = true
    error.value = null

    try {
        const { data, error: fetchError } = await useFetch('/api/friends')

        if (fetchError.value) {
            throw new Error(fetchError.value.message)
        }

        if (data.value) {
            friends.value = data.value
        }
    } catch (err: any) {
        error.value = err.message || 'Failed to load friends'
        toast.add({
            title: 'Error',
            description: error.value || 'Failed to load friends',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}

const confirmSelection = () => {
    if (selectedFriendIds.value.length === 0) return

    emit('confirm', selectedFriends.value)
    closeDrawer()
}

const closeDrawer = () => {
    model.value = false
    emit('cancel')
}

// Watch for drawer open/close
watch(model, (isOpen) => {
    if (isOpen) {
        fetchFriends()
    } else {
        // Reset selection when drawer closes
        selectedFriendIds.value = []
        searchQuery.value = ''
    }
})

// Initialize
onMounted(() => {
    if (model.value) {
        fetchFriends()
    }
})
</script>

<style scoped>
.friend-item {
    @apply transition-all duration-200;
}

.friend-item:hover {
    @apply transform scale-[1.02];
}

/* Custom scrollbar for the friends list */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>