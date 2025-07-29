<template>
    <div class="p-4">
        <h2 class="text-2xl font-bold mb-4">Grocery Items Management</h2>

        <!-- Add New Item Button -->
        <UButton color="primary" icon="i-lucide-Plus" @click="openAddModal" class="mb-4">
            Add New Item
        </UButton>

        <!-- Edit Item Button (example) -->
        <UButton v-if="selectedItem" color="secondary" icon="i-lucide-Edit" @click="openEditModal" class="mb-4 ml-2">
            Edit Selected Item
        </UButton>

        <!-- Grocery Item Component -->
        <GroceryItem v-model="showModal" :item="editingItem" @saved="handleItemSaved" @cancelled="handleCancelled" />

        <!-- Display Items (example) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <UCard v-for="item in groceryItems" :key="item.id" class="cursor-pointer hover:shadow-md transition-shadow"
                @click="selectItem(item)">
                <div class="p-4">
                    <h3 class="font-semibold text-lg">{{ item.name }}</h3>
                    <p class="text-gray-600">{{ item.unit }}</p>
                    <p v-if="item.default_price" class="text-green-600 font-medium">
                        ₹{{ item.default_price }}
                    </p>
                </div>
            </UCard>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { Database } from '~/types/database.types'

type GroceryItem = Database['public']['Tables']['grocery_items']['Row']

// Reactive state
const showModal = ref(false)
const editingItem = ref<GroceryItem | null>(null)
const selectedItem = ref<GroceryItem | null>(null)
const groceryItems = ref<GroceryItem[]>([])

// Methods
const openAddModal = () => {
    editingItem.value = null
    showModal.value = true
}

const openEditModal = () => {
    if (selectedItem.value) {
        editingItem.value = selectedItem.value
        showModal.value = true
    }
}

const selectItem = (item: GroceryItem) => {
    selectedItem.value = item
}

const handleItemSaved = (item: GroceryItem) => {
    // Refresh the items list
    fetchGroceryItems()

    // Show success message
    const toast = useToast()
    toast.add({
        title: 'Success',
        description: `Item "${item.name}" ${editingItem.value ? 'updated' : 'added'} successfully`,
        color: 'success'
    })
}

const handleCancelled = () => {
    // Handle cancellation if needed
    console.log('Operation cancelled')
}

const fetchGroceryItems = async () => {
    try {
        const { data } = await useFetch('/api/grocery-items')
        if (data.value) {
            groceryItems.value = data.value
        }
    } catch (error) {
        console.error('Error fetching grocery items:', error)
    }
}

// Fetch data on component mount
onMounted(() => {
    fetchGroceryItems()
})
</script>