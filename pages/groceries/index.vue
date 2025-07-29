<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Grocery Items</h1>
          <p class="text-gray-600">Browse and split grocery items</p>
        </div>
      </div>
    </div>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-primary" />
      <span class="ml-2 text-gray-600">Loading grocery items...</span>
    </div>
    <div v-else-if="groceries.length === 0" class="text-center py-12">
      <UIcon name="i-heroicons-shopping-bag" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="sm:text-lg text-xs font-semibold text-gray-900 mb-2">No Grocery Items</h3>
      <p class="text-gray-600">Get started by adding your first grocery item.</p>
    </div>
    <div v-else-if="viewMode === 'grid'"
      class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 xl:grid-cols-10 gap-3 sm:gap-4">
      <UCard v-for="item in groceries" :key="item.id" :class="[
        'bg-primary-100/25  p-1 shadow-primary-100/50 !shadow-inner hover:shadow-primary-500/75 transition-all duration-200 cursor-pointer aspect-square relative',
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
        </div>
      </UCard>
    </div>

    <!-- List View -->
    <div v-else class="space-y-3">
      <UCard v-for="item in groceries" :key="item.id" :class="[
        'bg-primary-100/25  p-1 shadow-primary-100/50 !shadow-inner hover:shadow-md transition-all hover:shadow-primary-500/75 duration-200 cursor-pointer',
        selectedItems.includes(item.id) ? 'ring-2 ring-primary  shadow-primary-100/50 !shadow-inner' : ''
      ]" @click="toggleSelection(item.id)">
        <div class="flex items-center justify-between">
          <!-- Selection Indicator -->
          <div class="flex items-center gap-4">
            <!-- Item Info -->
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
      </UCard>
    </div>
    <!-- Footer Items -->
    <div
      class="fixed bottom-28 flex flex-col justify-between items-center gap-4 right-0  bg-primary-100/25 rounded-l-2xl p-1 shadow-primary-100/50 !shadow-inner">
      <div class="flex items-center gap-2  rounded-lg p-1 flex-col">
        <UButton :variant="viewMode === 'grid' ? 'solid' : 'ghost'" size="sm" @click="viewMode = 'grid'" class="px-3">
          <UIcon name="i-heroicons-squares-2x2" class="h-4 w-4" />
        </UButton>
        <UButton :variant="viewMode === 'list' ? 'solid' : 'ghost'" size="sm" @click="viewMode = 'list'" class="px-3">
          <UIcon name="i-heroicons-list-bullet" class="h-4 w-4" />
        </UButton>
      </div>
      <USeparator></USeparator>
      <UButton color="primary" variant="ghost" @click="showAddModal = true" icon="i-lucide-share">
        <span class="min-w-4"> {{ selectedItems.length }}</span>
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Database } from '~/types/database.types';

const groceries = ref<Database['public']['Tables']['grocery_items']['Row'][]>([])
const loading = ref(false);
const error = ref<string | null>(null);
const showAddModal = ref(false);
const selectedItems = ref<string[]>([]);
const viewMode = ref<'grid' | 'list'>('grid');

// Format price to 2 decimal places
const formatPrice = (price: number) => {
  return price.toFixed(2);
};

async function fecthGrocery() {
  loading.value = true;
  error.value = null;

  try {
    const { data } = await useFetch('/api/grocery-items', {
      method: 'GET',
    });

    if (data.value) {
      groceries.value = data.value;
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

onMounted(async () => {
  await fecthGrocery();
});
</script>