<template>
  <div class="relative">
    <div
      class="sticky top-0 bg-gradient-to-r from-white via-white to-primary-50/30 backdrop-blur-md border-b border-gray-200/50 py-6 w-full shadow-sm">
      <div class="flex justify-between flex-col sm:flex-row px-4 max-w-7xl mx-auto">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-primary-100 rounded-xl">
              <UIcon name="i-heroicons-shopping-bag" class="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1
                class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-primary-700 bg-clip-text text-transparent">
                Grocery Items
              </h1>
              <p class="text-gray-600 text-sm font-medium">Browse and split grocery items</p>
            </div>
          </div>

          <div class="relative max-w-md">
            <UInput v-model="searchQuery" placeholder="Search items, units, or prices..."
              leading-icon="i-heroicons-magnifying-glass">
              <template #trailing>
                <UIcon v-if="searchQuery" name="i-heroicons-x-mark" @click="searchQuery = ''" />
              </template>
            </UInput>
          </div>
        </div>

        <div class="flex items-center gap-3 mt-4 sm:mt-0">
          <UButton color="primary" variant="solid" size="lg" @click="showAddModal = !showAddModal"
            icon="i-heroicons-plus"
            class="shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-6 rounded-xl hover:scale-105">
            Add Item
          </UButton>

          <UButton :variant="isEditMode ? 'solid' : 'outline'" :color="isEditMode ? 'primary' : 'neutral'" size="lg"
            @click="toggleEditMode" icon="i-lucide-cog"
            class="shadow-md hover:shadow-lg transition-all duration-300 rounded-xl hover:scale-105">
            {{ isEditMode ? 'Done' : 'Edit' }}
          </UButton>

          <div
            class="flex items-center bg-white/80 backdrop-blur-sm rounded-xl p-1.5 shadow-lg border border-gray-200/50">
            <UButton :variant="viewMode === 'grid' ? 'solid' : 'ghost'"
              :color="viewMode === 'grid' ? 'primary' : 'neutral'" size="sm" @click="viewMode = 'grid'"
              class="rounded-lg transition-all duration-300 hover:scale-105">
              <UIcon name="i-heroicons-squares-2x2" class="h-4 w-4" />
            </UButton>
            <UButton :variant="viewMode === 'list' ? 'solid' : 'ghost'"
              :color="viewMode === 'list' ? 'primary' : 'neutral'" size="sm" @click="viewMode = 'list'"
              class="rounded-lg transition-all duration-300 hover:scale-105">
              <UIcon name="i-heroicons-list-bullet" class="h-4 w-4" />
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="pt-8">
    <div v-if="loading" class="px-4">
      <div v-if="viewMode === 'grid'"
        class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 xl:grid-cols-10 gap-3 sm:gap-4">
        <div v-for="i in 12" :key="i"
          class="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl animate-pulse shadow-lg">
          <div class="h-full flex flex-col justify-center items-center p-4">
            <div class="w-16 h-4 bg-gray-400 rounded mb-3 animate-pulse"></div>
            <div class="w-12 h-3 bg-gray-400 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
      <div v-else class="space-y-3">
        <div v-for="i in 6" :key="i"
          class="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl p-4 animate-pulse shadow-lg">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="w-32 h-5 bg-gray-400 rounded mb-2 animate-pulse"></div>
              <div class="w-24 h-4 bg-gray-400 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="displayGroceries.length === 0" class="text-center py-12 px-4">
      <div v-if="searchQuery" class="space-y-4">
        <UIcon name="i-heroicons-magnifying-glass" class="h-16 w-16 text-gray-400 mx-auto" />
        <h3 class="text-xl font-semibold text-gray-900">No items found</h3>
        <p class="text-gray-600">Try adjusting your search terms or browse all items</p>
        <UButton @click="searchQuery = ''" color="primary" variant="outline">
          Clear Search
        </UButton>
      </div>
      <div v-else class="space-y-4">
        <UIcon name="i-heroicons-shopping-bag" class="h-16 w-16 text-gray-400 mx-auto" />
        <h3 class="text-xl font-semibold text-gray-900">No Grocery Items</h3>
        <p class="text-gray-600">Get started by adding your first grocery item</p>
        <UButton @click="showAddModal = true" color="primary">
          <UIcon name="i-heroicons-plus" class="h-4 w-4 mr-2" />
          Add First Item
        </UButton>
      </div>
    </div>
    <div v-else-if="viewMode === 'grid'"
      class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 xl:grid-cols-10 gap-3 sm:gap-4 px-4"
      v-auto-animate>
      <UCard v-for="item in displayGroceries" :key="item.id" :class="[
        'bg-primary-100/25  p-1 shadow-primary-100/50 !shadow-inner hover:shadow-primary-500/75 transition-all duration-200 cursor-pointer aspect-square relative overflow-visible',
        selectedItems.includes(item.id) ? 'ring-2 ring-primary  shadow-primary-100/50 !shadow-inner' : ''
      ]" @click="toggleSelection(item.id)">
        <div class="h-full flex flex-col">
          <div class="flex-1 flex flex-col justify-center text-center">
            <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
              {{ item.name }}
            </h3>
            <div class="space-y-1">
              <div class="flex items-center justify-center">
                <span class="flex items-center gap-4 text-xs text-gray-600">
                  {{ item.default_price ? `₹${formatPrice(item.default_price)}/${item.unit}` : 'N/A' }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="isEditMode"
            class="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 rounded-b-lg p-2 transform transition-all duration-300 ease-out"
            :class="isEditMode ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'">
            <div class="flex justify-between w-full gap-2">
              <UButton size="xs" color="primary" variant="solid" icon="i-heroicons-pencil-square"
                class="shadow-sm hover:shadow-md transition-shadow" @click.stop="editItem(item)" />
              <UButton size="xs" color="error" variant="solid" icon="i-heroicons-trash"
                class="shadow-sm hover:shadow-md transition-shadow" @click.stop="deleteItem(item)" />
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- List View -->
    <div v-else class="space-y-3 px-4" v-auto-animate>
      <UCard v-for="item in displayGroceries" :key="item.id" :class="[
        'bg-primary-100/25  p-1 shadow-primary-100/50 !shadow-inner hover:shadow-md transition-all hover:shadow-primary-500/75 duration-200 cursor-pointer relative',
        selectedItems.includes(item.id) ? 'ring-2 ring-primary  shadow-primary-100/50 !shadow-inner' : ''
      ]" @click="toggleSelection(item.id)">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-1">
                {{ item.name }}
              </h3>
              <div class="flex items-center gap-4 text-xs text-gray-600">
                <span class="font-medium text-gray-900">
                  ₹{{ item.default_price ? formatPrice(item.default_price) : 'N/A' }}/{{ item.unit }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isEditMode"
          class="absolute bottom-0  right-0 bg-white/20 backdrop-blur-sm border-t border-gray-200 rounded-b-lg p-2 transform transition-all duration-300 ease-out flex flex-col h-full justify-between"
          :class="isEditMode ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'">
          <div class="flex flex-col justify-between gap-2 h-full">
            <UButton size="xs" color="primary" variant="solid" icon="i-heroicons-pencil-square"
              class="shadow-sm hover:shadow-md transition-shadow" @click.stop="editItem(item)" />
            <UButton size="xs" color="error" variant="solid" icon="i-heroicons-trash"
              class="shadow-sm hover:shadow-md transition-shadow" @click.stop="deleteItem(item)" />
          </div>
        </div>
      </UCard>

    </div>
  </div>

  <div class="fixed bottom-38 right-2 z-50">
    <UButton color="primary" size="xl" icon="i-lucide-share" @click="showSelectFriends = !showSelectFriends"
      :disabled="selectedItems.length === 0">
      <span class="font-medium">{{ selectedItems.length }}</span>
    </UButton>
  </div>

  <GroceryItem v-model="showAddModal" :item="editingItem" @saved="handleItemSaved" @cancelled="handleCancelled" />

  <!-- Select Friends Drawer -->
  <SelectFriends v-model="showSelectFriends" :grocery-items="selectedGroceryItems" @confirm="handleFriendsSelected"
    @cancel="showSelectFriends = false" />
</template>

<script lang="ts" setup>
import type { Database } from '~/types/database.types';

const groceries = ref<Database['public']['Tables']['grocery_items']['Row'][]>([])
const filteredGroceries = ref<Database['public']['Tables']['grocery_items']['Row'][]>([])
const loading = ref(false);
const error = ref<string | null>(null);
const showAddModal = ref(false);
const editingItem = ref<Database['public']['Tables']['grocery_items']['Row'] | null>(null);
const selectedItems = ref<string[]>([]);
const viewMode = ref<'grid' | 'list'>('grid');
const isEditMode = ref(false);
const searchQuery = ref('')
const showSelectFriends = ref(false);

// Computed properties
const displayGroceries = computed(() => {
  if (searchQuery.value.trim()) {
    return filteredGroceries.value
  }
  return groceries.value
})

const selectedGroceryItems = computed(() => {
  return groceries.value.filter(item => selectedItems.value.includes(item.id))
})

// Format price to 2 decimal places
const formatPrice = (price: number) => {
  return price.toFixed(2);
};

// Search functionality
const performSearch = () => {
  if (!searchQuery.value.trim()) {
    filteredGroceries.value = groceries.value
    return
  }

  const query = searchQuery.value.toLowerCase().trim()
  filteredGroceries.value = groceries.value.filter(item =>
    item.name.toLowerCase().includes(query) ||
    item.unit.toLowerCase().includes(query) ||
    (item.default_price && item.default_price.toString().includes(query))
  )
}

async function fecthGrocery() {
  loading.value = true;
  error.value = null;

  try {
    const { data } = await useFetch('/api/grocery-items', {
      method: 'GET',
    });

    if (data.value) {
      groceries.value = data.value;
      filteredGroceries.value = data.value;
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load grocery items';
    useToast().add({
      title: 'Error',
      description: error.value || 'Failed to load grocery items',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}

function toggleSelection(itemId: string) {
  const index = selectedItems.value.indexOf(itemId);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(itemId);
  }
}

function handleItemSaved(item: Database['public']['Tables']['grocery_items']['Row']) {
  // Refresh the groceries list
  fecthGrocery();

  // Show success message
  useToast().add({
    title: 'Success',
    description: `Item "${item.name}" ${editingItem.value ? 'updated' : 'added'} successfully`,
    color: 'success'
  });

  // Reset editing item
  editingItem.value = null;
}

function handleCancelled() {
  // Reset editing item
  editingItem.value = null;
}

function handleFriendsSelected(selectedFriends: any[]) {
  // Show success message
  useToast().add({
    title: 'Success',
    description: `Selected ${selectedFriends.length} friends for expense sharing!`,
    color: 'success'
  });

  // Close the select friends drawer
  showSelectFriends.value = false;

  // Clear selected items
  selectedItems.value = [];

  // Navigate to expenses page
  navigateTo('/expenses');
}

function editItem(item: Database['public']['Tables']['grocery_items']['Row']) {
  editingItem.value = item;
  showAddModal.value = true;
}

function toggleEditMode() {
  isEditMode.value = !isEditMode.value;
  // Clear selections when entering edit mode
  if (isEditMode.value) {
    selectedItems.value = [];
  }
}

async function deleteItem(item: Database['public']['Tables']['grocery_items']['Row']) {
  try {
    await $fetch(`/api/grocery-items/${item.id}`, {
      method: 'DELETE'
    });

    // Remove from local list
    const index = groceries.value.findIndex(grocery => grocery.id === item.id);
    if (index > -1) {
      groceries.value.splice(index, 1);
    }

    // Show success message
    useToast().add({
      title: 'Success',
      description: `Item "${item.name}" deleted successfully`,
      color: 'success'
    });

  } catch (error: any) {
    useToast().add({
      title: 'Error',
      description: error.message || 'Failed to delete item',
      color: 'error'
    });
  }
}

// Watch for search query changes
watch(searchQuery, () => {
  performSearch()
})

onMounted(async () => {
  await fecthGrocery();
});
</script>