<script setup lang="ts">
interface Friend {
    id: string
    label: string
    avatar_url: string | null
}

interface Props {
    friends: Friend[]
    selectedFriends: string[]
    label?: string
}

interface Emits {
    (e: 'update:selectedFriends', value: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
    label: 'Filter by Friends'
})

const emit = defineEmits<Emits>()

const toggleFriend = (friendId: string) => {
    const newSelected = [...props.selectedFriends]
    const index = newSelected.indexOf(friendId)

    if (index > -1) {
        newSelected.splice(index, 1)
    } else {
        newSelected.push(friendId)
    }

    emit('update:selectedFriends', newSelected)
}

const clearAll = () => {
    emit('update:selectedFriends', [])
}
</script>

<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <label class="text-sm font-semibold text-gray-700">{{ label }}</label>
            <UButton v-if="selectedFriends.length > 0" size="xs" variant="ghost" @click="clearAll"
                class="text-gray-500 hover:text-gray-700">
                <UIcon name="i-heroicons-x-mark" class="h-3 w-3 mr-1" />
                Clear
            </UButton>
        </div>

        <div class="flex flex-wrap gap-3">
            <div v-for="friend in friends" :key="friend.id" class="cursor-pointer group transition-all duration-200"
                @click="toggleFriend(friend.id)">
                <div class="relative">
                    <UAvatar :src="friend.avatar_url" :alt="friend.label" size="lg"
                        class="border-3 transition-all duration-300 group-hover:scale-105" :class="selectedFriends.includes(friend.id)
                            ? 'border-blue-500 ring-4 ring-blue-100 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300'" />
                    <div v-if="selectedFriends.includes(friend.id)"
                        class="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <UIcon name="i-heroicons-check" class="h-3 w-3 text-white" />
                    </div>
                </div>
                <div class="text-xs text-center mt-2 font-medium"
                    :class="selectedFriends.includes(friend.id) ? 'text-blue-600' : 'text-gray-600'">
                    {{ friend.label }}
                </div>
            </div>
        </div>
    </div>
</template>