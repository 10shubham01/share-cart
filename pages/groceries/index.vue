<script setup lang="ts">
import type { Database } from '~/types/database.types'

const { user } = useAuth()
const toast = useToast()

onMounted(() => {
  if (!user.value) {
    navigateTo('/login')
  }
})

const groceryItems = ref<Array<Database['public']['Tables']['grocery_items']['Row'] & { category_name?: string }>>([])
const categories = ref<Database['public']['Tables']['categories']['Row'][]>([])
const groups = ref<Database['public']['Tables']['groups']['Row'][]>([])
const loading = ref(false)
const showAddExpenseModal = ref(false)
const showShareModal = ref(false)
const selectedItem = ref<Database['public']['Tables']['grocery_items']['Row'] | null>(null)
const newExpense = ref({
  quantity: 1,
  price_per_unit: 0,
  purchase_date: new Date().toISOString().split('T')[0],
  store_name: '',
  notes: ''
})
const shareData = ref({
  group_id: null as string | null,
  user_ids: [] as string[],
  message: ''
})
const selectedCategory = ref<string | null>(null)
const searchQuery = ref('')
const selectedItems = ref<Set<string>>(new Set())
const showBulkExpenseDrawer = ref(false)
const showBulkShareDrawer = ref(false)
const bulkExpenseData = ref({
  items: [] as Array<{ id: string; quantity: number; price_per_unit: number }>,
  purchase_date: new Date().toISOString().split('T')[0],
  store_name: '',
  notes: ''
})
const bulkShareData = ref({
  group_id: null as string | null,
  user_ids: [] as string[],
  message: ''
})

const filteredItems = computed(() => {
  let items = groceryItems.value

  if (selectedCategory.value) {
    items = items.filter(item => item.category_id === selectedCategory.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.unit.toLowerCase().includes(query) ||
      categories.value.find(c => c.id === item.category_id)?.name.toLowerCase().includes(query)
    )
  }

  return items
})

const calculateTotal = computed(() => {
  return newExpense.value.quantity * newExpense.value.price_per_unit
})

const fetchGroceryItems = async () => {
  loading.value = true
  try {
    const { data } = await useFetch('/api/grocery-items')
    if (data.value) {
      groceryItems.value = data.value
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const { data } = await useFetch('/api/categories')
    if (data.value) {
      categories.value = data.value
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
}

const fetchGroups = async () => {
  try {
    const { data } = await useFetch('/api/groups')
    if (data.value) {
      groups.value = data.value
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
}

const openAddExpenseModal = (item: Database['public']['Tables']['grocery_items']['Row']) => {
  selectedItem.value = item
  newExpense.value = {
    quantity: 1,
    price_per_unit: item.default_price || 0,
    purchase_date: new Date().toISOString().split('T')[0],
    store_name: '',
    notes: ''
  }
  showAddExpenseModal.value = true
}

const openShareModal = (item: Database['public']['Tables']['grocery_items']['Row']) => {
  selectedItem.value = item
  shareData.value = {
    group_id: null,
    user_ids: [],
    message: ''
  }
  showShareModal.value = true
}

const addExpense = async () => {
  if (!selectedItem.value) return

  try {
    const { data, error } = await useFetch('/api/expenses', {
      method: 'POST',
      body: {
        grocery_item_id: selectedItem.value.id,
        quantity: newExpense.value.quantity,
        price_per_unit: newExpense.value.price_per_unit,
        total_amount: calculateTotal.value,
        purchase_date: newExpense.value.purchase_date,
        store_name: newExpense.value.store_name,
        notes: newExpense.value.notes
      }
    })

    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'error' })
    } else {
      toast.add({ title: 'Success', description: 'Expense added successfully!', color: 'success' })
      showAddExpenseModal.value = false
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
}

const shareExpense = async () => {
  if (!selectedItem.value) return

  try {
    const { data, error } = await useFetch('/api/expense-shares', {
      method: 'POST',
      body: {
        grocery_item_id: selectedItem.value.id,
        group_id: shareData.value.group_id,
        user_ids: shareData.value.user_ids,
        message: shareData.value.message
      }
    })

    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'error' })
    } else {
      toast.add({ title: 'Success', description: 'Expense shared successfully!', color: 'success' })
      showShareModal.value = false
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
}

const toggleItemSelection = (itemId: string) => {
  if (selectedItems.value.has(itemId)) {
    selectedItems.value.delete(itemId)
  } else {
    selectedItems.value.add(itemId)
  }
}

const openBulkExpenseDrawer = () => {
  const selectedGroceryItems = groceryItems.value.filter(item => selectedItems.value.has(item.id))
  bulkExpenseData.value = {
    items: selectedGroceryItems.map(item => ({
      id: item.id,
      quantity: 1,
      price_per_unit: item.default_price || 0
    })),
    purchase_date: new Date().toISOString().split('T')[0],
    store_name: '',
    notes: ''
  }
  showBulkExpenseDrawer.value = true
}

const openBulkShareDrawer = () => {
  bulkShareData.value = {
    group_id: null,
    user_ids: [],
    message: ''
  }
  showBulkShareDrawer.value = true
}

const addBulkExpense = async () => {
  try {
    const { data, error } = await useFetch('/api/expenses/bulk', {
      method: 'POST',
      body: bulkExpenseData.value
    })

    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'error' })
    } else {
      toast.add({ title: 'Success', description: 'Bulk expenses added successfully!', color: 'success' })
      showBulkExpenseDrawer.value = false
      selectedItems.value.clear()
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
}

const shareBulkExpense = async () => {
  try {
    const { data, error } = await useFetch('/api/expense-shares/bulk', {
      method: 'POST',
      body: {
        item_ids: Array.from(selectedItems.value),
        group_id: bulkShareData.value.group_id,
        user_ids: bulkShareData.value.user_ids,
        message: bulkShareData.value.message
      }
    })

    if (error.value) {
      toast.add({ title: 'Error', description: error.value.message, color: 'error' })
    } else {
      toast.add({ title: 'Success', description: 'Bulk expenses shared successfully!', color: 'success' })
      showBulkShareDrawer.value = false
      selectedItems.value.clear()
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
}

const toggleGroupSelection = (groupId: string) => {
  if (bulkShareData.value.group_id === groupId) {
    bulkShareData.value.group_id = null
  } else {
    bulkShareData.value.group_id = groupId
  }
}

onMounted(async () => {
  await Promise.all([
    fetchGroceryItems(),
    fetchCategories(),
    fetchGroups()
  ])
})


</script>

<template>
  <div v-if="user" class="min-h-screen bg-gray-50">
    <UContainer class="py-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Groceries</h1>
          <p class="text-gray-600 mt-2">Browse and manage your grocery items</p>
        </div>
        <div v-if="selectedItems.size > 0" class="flex space-x-2">
          <UButton @click="openBulkExpenseDrawer" color="success" icon="i-lucide-plus">
            Add to Expenses ({{ selectedItems.size }})
          </UButton>
          <UButton @click="openBulkShareDrawer" color="primary" icon="i-lucide-share">
            Share ({{ selectedItems.size }})
          </UButton>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UCard>
          <div class="flex items-center space-x-3">
            <UIcon name="i-lucide-package" class="w-8 h-8 text-blue-600" />
            <div>
              <p class="text-sm text-gray-600">Total Items</p>
              <p class="text-2xl font-bold text-gray-900">{{ groceryItems.length }}</p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center space-x-3">
            <UIcon name="i-lucide-tag" class="w-8 h-8 text-green-600" />
            <div>
              <p class="text-sm text-gray-600">Categories</p>
              <p class="text-2xl font-bold text-gray-900">{{ categories.length }}</p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center space-x-3">
            <UIcon name="i-lucide-users" class="w-8 h-8 text-purple-600" />
            <div>
              <p class="text-sm text-gray-600">Your Groups</p>
              <p class="text-2xl font-bold text-gray-900">{{ groups.length }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <div class="mb-6 space-y-4">
        <UFormField label="Search Groceries">
          <UInput v-model="searchQuery" placeholder="Search by name, unit, or category..." icon="i-lucide-search"
            clearable />
        </UFormField>
        <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <UFormField label="Filter by Category" class="flex-1 max-w-xs">
            <USelect v-model="selectedCategory" :options="categories.map(c => ({ label: c.name, value: c.id }))"
              placeholder="All categories" clearable icon="i-lucide-filter" />
          </UFormField>
          <div class="flex items-center space-x-2">
            <UBadge :value="filteredItems.length" color="primary" variant="soft">
              {{ (selectedCategory || searchQuery) ? 'Filtered' : 'Total' }} Items
            </UBadge>
            <UButton v-if="selectedCategory || searchQuery" icon="i-lucide-x" variant="ghost" size="sm"
              @click="selectedCategory = null; searchQuery = ''">
              Clear Filters
            </UButton>
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
      </div>

      <div v-else-if="filteredItems.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard v-for="item in filteredItems" :key="item.id"
          class="hover:shadow-lg transition-all duration-200 hover:scale-105 relative cursor-pointer"
          :class="{ 'ring-2 ring-primary-500 bg-primary-50/30': selectedItems.has(item.id) }"
          @click="toggleItemSelection(item.id)">
          <div v-if="selectedItems.has(item.id)" class="absolute top-3 left-3 z-10">
            <div class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center shadow-lg">
              <UIcon name="i-lucide-check" class="w-4 h-4 text-white" />
            </div>
          </div>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <UIcon name="i-lucide-package" class="w-5 h-5 text-primary-500" />
                <h3 class="text-lg font-semibold text-gray-900 truncate">{{ item.name }}</h3>
              </div>
              <UBadge :value="item.unit" color="neutral" variant="soft" size="sm" />
            </div>
          </template>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-gray-600 text-sm">Price:</span>
              <span class="font-bold text-lg text-primary-600">₹{{ item.default_price || 0 }}</span>
            </div>
            <div v-if="item.category_id" class="flex items-center justify-between">
              <span class="text-gray-600 text-sm">Category:</span>
              <UBadge :value="categories.find(c => c.id === item.category_id)?.name || 'Unknown'" color="primary"
                variant="soft" size="sm" />
            </div>
            <div class="border-t border-gray-200 my-4"></div>
            <div class="flex space-x-2">
              <UButton @click.stop="openAddExpenseModal(item)" variant="solid" size="sm" block color="success"
                icon="i-lucide-plus">
                Add to Expenses
              </UButton>
              <UButton @click.stop="openShareModal(item)" variant="outline" size="sm" block color="primary"
                icon="i-lucide-share">
                Share
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-package" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ (selectedCategory || searchQuery) ? 'No items found' : 'No grocery items yet' }}
        </h3>
        <p class="text-gray-600 mb-6">
          {{ (selectedCategory || searchQuery) ? 'Try adjusting your filters' : 'Add some grocery items to get started'
          }}
        </p>
        <div class="flex justify-center space-x-4">
          <UButton v-if="selectedCategory || searchQuery" @click="selectedCategory = null; searchQuery = ''"
            color="neutral">
            Clear Filters
          </UButton>
          <UButton to="/grocery-items" color="primary" icon="i-lucide-plus">
            Add Grocery Items
          </UButton>
        </div>
      </div>
    </UContainer>

    <UDrawer v-model:open="showAddExpenseModal">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Add to Expenses</h3>
          <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="showAddExpenseModal = false" />
        </div>
      </template>
      <template #body>
        <div v-if="selectedItem" class="space-y-6">
          <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <UIcon name="i-lucide-package" class="w-8 h-8 text-blue-600" />
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-900 text-lg">{{ selectedItem.name }}</h4>
                <p class="text-sm text-gray-600 mt-1">
                  Default price: ₹{{ selectedItem.default_price || 0 }} per {{ selectedItem.unit }}
                </p>
              </div>
            </div>
          </div>
          <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Quantity" required>
                <UInputNumber v-model.number="newExpense.quantity" :min="0.1" :step="0.1" required placeholder="1"
                  class="w-full" />
              </UFormField>
              <UFormField label="Price per Unit">
                <UInputNumber v-model.number="newExpense.price_per_unit" :min="0" :step="0.01" placeholder="0.00"
                  class="w-full" />
              </UFormField>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Purchase Date">
                <UInput v-model="newExpense.purchase_date" type="date" class="w-full" />
              </UFormField>
              <UFormField label="Store Name">
                <UInput v-model="newExpense.store_name" placeholder="Enter store name" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Notes">
              <UTextarea v-model="newExpense.notes" placeholder="Add any notes..." :rows="3" class="w-full" />
            </UFormField>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <span class="text-lg font-semibold text-gray-900">Total Amount:</span>
                <span class="text-2xl font-bold text-primary-600">₹{{ calculateTotal.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end space-x-3">
          <UButton variant="outline" @click="showAddExpenseModal = false" class="px-6">Cancel</UButton>
          <UButton color="primary" @click="addExpense" :disabled="!newExpense.quantity || newExpense.quantity <= 0"
            icon="i-lucide-plus" class="px-6">
            Add Expense
          </UButton>
        </div>
      </template>
    </UDrawer>

    <UDrawer v-model:open="showShareModal">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Share Item</h3>
          <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="showShareModal = false" />
        </div>
      </template>
      <template #body>
        <div v-if="selectedItem" class="space-y-6">
          <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <UIcon name="i-lucide-package" class="w-8 h-8 text-green-600" />
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-900 text-lg">{{ selectedItem.name }}</h4>
                <p class="text-sm text-gray-600 mt-1">Share this item with your groups or friends</p>
              </div>
            </div>
          </div>
          <div class="space-y-6">
            <UFormField label="Share with Group">
              <USelect v-model="shareData.group_id" :options="groups.map(g => ({ label: g.name, value: g.id }))"
                placeholder="Select a group" clearable class="w-full" />
            </UFormField>
            <UFormField label="Message">
              <UTextarea v-model="shareData.message" placeholder="Add a message..." :rows="3" class="w-full" />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end space-x-3">
          <UButton variant="outline" @click="showShareModal = false" class="px-6">Cancel</UButton>
          <UButton color="primary" @click="shareExpense" icon="i-lucide-share" class="px-6">
            Share Item
          </UButton>
        </div>
      </template>
    </UDrawer>

    <UDrawer v-model:open="showBulkExpenseDrawer">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Add Bulk Expenses</h3>
          <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="showBulkExpenseDrawer = false" />
        </div>
      </template>
      <template #body>
        <div class="space-y-6">
          <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div class="flex items-center space-x-3">
              <UIcon name="i-lucide-package" class="w-8 h-8 text-blue-600" />
              <div>
                <h4 class="font-semibold text-gray-900">{{ bulkExpenseData.items.length }} Items Selected</h4>
                <p class="text-sm text-gray-600">Configure quantities and prices for each item</p>
              </div>
            </div>
          </div>
          <div class="space-y-4">
            <div v-for="item in bulkExpenseData.items" :key="item.id" class="border rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <h5 class="font-medium text-gray-900">
                  {{groceryItems.find(g => g.id === item.id)?.name}}
                </h5>
                <UBadge :value="groceryItems.find(g => g.id === item.id)?.unit" color="neutral" variant="soft"
                  size="sm" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Quantity">
                  <UInputNumber v-model.number="item.quantity" :min="0.1" :step="0.1" class="w-full" />
                </UFormField>
                <UFormField label="Price per Unit">
                  <UInputNumber v-model.number="item.price_per_unit" :min="0" :step="0.01" class="w-full" />
                </UFormField>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Purchase Date">
              <UInput v-model="bulkExpenseData.purchase_date" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Store Name">
              <UInput v-model="bulkExpenseData.store_name" placeholder="Enter store name" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Notes">
            <UTextarea v-model="bulkExpenseData.notes" placeholder="Add any notes..." :rows="3" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end space-x-3">
          <UButton variant="outline" @click="showBulkExpenseDrawer = false" class="px-6">Cancel</UButton>
          <UButton color="primary" @click="addBulkExpense" icon="i-lucide-plus" class="px-6">
            Add Bulk Expenses
          </UButton>
        </div>
      </template>
    </UDrawer>

    <UDrawer v-model:open="showBulkShareDrawer">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Share Multiple Items</h3>
          <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="showBulkShareDrawer = false" />
        </div>
      </template>
      <template #body>
        <div class="space-y-6">
          <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div class="flex items-center space-x-3">
              <UIcon name="i-lucide-package" class="w-8 h-8 text-green-600" />
              <div>
                <h4 class="font-semibold text-gray-900">{{ selectedItems.size }} Items Selected</h4>
                <p class="text-sm text-gray-600">Share these items with your groups or friends</p>
              </div>
            </div>
          </div>
          <div class="space-y-4">
            <h5 class="font-medium text-gray-900">Select Groups</h5>
            <div class="space-y-3">
              <div v-for="group in groups" :key="group.id"
                class="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                :class="{ 'bg-primary-50 border-primary-200': bulkShareData.group_id === group.id }"
                @click="toggleGroupSelection(group.id)">
                <UCheckbox :model-value="bulkShareData.group_id === group.id" />
                <div class="flex-1">
                  <h6 class="font-medium text-gray-900">{{ group.name }}</h6>
                  <p class="text-sm text-gray-600">{{ group.description || 'No description' }}</p>
                </div>
              </div>
            </div>
          </div>
          <UFormField label="Message">
            <UTextarea v-model="bulkShareData.message" placeholder="Add a message..." :rows="3" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end space-x-3">
          <UButton variant="outline" @click="showBulkShareDrawer = false" class="px-6">Cancel</UButton>
          <UButton color="primary" @click="shareBulkExpense" icon="i-lucide-share" class="px-6">
            Share Items
          </UButton>
        </div>
      </template>
    </UDrawer>
  </div>
</template>