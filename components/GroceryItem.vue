<template>
    <UDrawer v-model:open="model">
        <template #header>
            <h1>{{ isEditing ? 'Edit Grocery Item' : 'Add Grocery Item' }}</h1>
        </template>
        <template #body>
            <form @submit.prevent="handleSubmit" class="space-y-4 p-4">
                <UFormField label="Name" name="name" required>
                    <UInput v-model="form.name" placeholder="Grocery Item Name" :error="errors.name" required />
                </UFormField>



                <UFormField label="Default Price" name="default_price">
                    <UInputNumber v-model="form.default_price" :increment="{
                        color: 'primary',
                        variant: 'solid',
                        size: 'xs'
                    }" :decrement="{
                        color: 'primary',
                        variant: 'solid',
                        size: 'xs'
                    }" placeholder="Enter Price" :min="0" :step="1" :error="errors.default_price" />
                </UFormField>

                <UFormField label="Unit" name="unit" required>
                    <USelectMenu v-model="form.unit" :items="units" placeholder="Select Unit" :error="errors.unit"
                        required />
                </UFormField>

                <UFormField label="Image URL" name="image_url">
                    <UInput v-model="form.image_url" placeholder="https://example.com/image.jpg"
                        :error="errors.image_url" />
                </UFormField>
            </form>
        </template>
        <template #footer>
            <div class="flex gap-2">
                <UButton color="neutral" variant="outline" @click="handleCancel" :disabled="loading">
                    Cancel
                </UButton>
                <UButton color="primary" :icon="isEditing ? 'i-lucide-Save' : 'i-lucide-Plus'" @click="handleSubmit"
                    :loading="loading" :disabled="!isFormValid" block>
                    {{ isEditing ? 'Update Item' : 'Add Item' }}
                </UButton>
            </div>
        </template>
    </UDrawer>
</template>

<script lang="ts" setup>
import type { Database } from '~/types/database.types'

type GroceryItem = Database['public']['Tables']['grocery_items']['Row']
type GroceryItemInsert = Database['public']['Tables']['grocery_items']['Insert']
type GroceryItemUpdate = Database['public']['Tables']['grocery_items']['Update']

// Props
interface Props {
    item?: GroceryItem | null
}

const props = withDefaults(defineProps<Props>(), {
    item: null
})

// Emits
const emit = defineEmits<{
    saved: [item: GroceryItem]
    cancelled: []
}>()

// Model
const model = defineModel<boolean>({
    type: Boolean,
    required: true,
})

// Reactive state
const loading = ref(false)
const errors = ref<Record<string, string>>({})
const user = useSupabaseUser()

// Form data
const form = ref<GroceryItemInsert>({
    name: '',
    default_price: null,
    unit: 'piece',
    image_url: null
})

// Available units
const units = [
    'piece', 'kg', 'gm', 'liter', 'ml', 'pack', 'bottle', 'box', 'dozen', 'bunch'
]

// Computed
const isEditing = computed(() => !!props.item?.id)
const isFormValid = computed(() => {
    return form.value.name.trim().length > 0 && (form.value.unit?.trim().length ?? 0) > 0
})

// Methods
const resetForm = () => {
    form.value = {
        name: '',
        default_price: null,
        unit: 'piece',
        image_url: null
    }
    errors.value = {}
}

const populateForm = () => {
    if (props.item) {
        form.value = {
            name: props.item.name,
            default_price: props.item.default_price,
            unit: props.item.unit,
            image_url: props.item.image_url
        }
    } else {
        resetForm()
    }
}

const validateForm = (): boolean => {
    errors.value = {}

    if (!form.value.name.trim()) {
        errors.value.name = 'Name is required'
    }

    if (!form.value.unit?.trim()) {
        errors.value.unit = 'Unit is required'
    }

    if (form.value.default_price !== null && form.value.default_price !== undefined && form.value.default_price < 0) {
        errors.value.default_price = 'Price cannot be negative'
    }

    return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
    if (!validateForm()) return

    loading.value = true

    try {
        let result: GroceryItem

        if (isEditing.value && props.item) {
            // Update existing item
            result = await $fetch(`/api/grocery-items/${props.item.id}`, {
                method: 'PUT',
                body: {
                    name: form.value.name,
                    default_price: form.value.default_price,
                    unit: form.value.unit,
                    image_url: form.value.image_url
                }
            })
        } else {
            // Create new item
            result = await $fetch('/api/grocery-items', {
                method: 'POST',
                body: {
                    name: form.value.name,
                    default_price: form.value.default_price,
                    unit: form.value.unit,
                    image_url: form.value.image_url,
                    created_by: user.value?.id ?? null
                }
            })
        }

        // Log the result for debugging
        console.log('API Response:', result)

        // Validate result before emitting
        if (!result || typeof result !== 'object') {
            throw new Error('Invalid response from server')
        }

        // Ensure result has required properties
        if (!result.id || !result.name) {
            throw new Error('Invalid item data received from server')
        }

        // Emit success event
        emit('saved', result)

        // Close drawer
        model.value = false

        // Reset form
        resetForm()

    } catch (error: any) {
        console.error('Error saving grocery item:', error)

        // Show error toast
        const toast = useToast()
        toast.add({
            title: 'Error',
            description: error.message || 'Failed to save grocery item',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}

const handleCancel = () => {
    emit('cancelled')
    model.value = false
    resetForm()
}

// Watch for changes in the item prop
watch(() => props.item, (newItem) => {
    if (newItem) {
        populateForm()
    } else {
        resetForm()
    }
}, { immediate: true })

// Watch for drawer open/close
watch(model, (isOpen) => {
    if (isOpen && props.item) {
        populateForm()
    } else if (!isOpen) {
        resetForm()
    }
})
</script>