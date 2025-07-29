<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
    item: {
        id?: string;
        name: string;
        quantity: number;
        price: number;
        image?: string;
    };
}>();

const emit = defineEmits<{
    (e: "close", value: boolean): void;
    (e: "save", item: typeof props.item): void;
}>();

const internalItem = ref({ ...props.item });

// Fetch Unsplash image based on name
const fetchImage = async (name: string) => {
    if (!name) return;
    // Use Unsplash source endpoint (no auth needed)
    const url = `https://source.unsplash.com/featured/?${encodeURIComponent(name)}`;
    internalItem.value.image = url;
};

// Watch name change to fetch image
watch(
    () => internalItem.value.name,
    (newName) => {
        fetchImage(newName);
    }
);

// Watch prop updates
watch(
    () => props.item,
    (val) => {
        internalItem.value = { ...val };
        if (val.name) fetchImage(val.name);
    },
    { deep: true, immediate: true }
);

const close = () => emit("close", false);
const save = () => emit("save", internalItem.value);
</script>

<template>
    <UCard>
        <div class="space-y-4">
            <UInput v-model="internalItem.name" label="Name" placeholder="Item name" class="w-full" size="xl" />
            <UInputNumber v-model.number="internalItem.quantity" label="Quantity" type="number" class="w-full"
                size="sm" />
            <UInputNumber v-model.number="internalItem.price" label="Price" type="number" class="w-full" size="sm" />

            <!-- Image Preview -->
            <div v-if="internalItem.image" class="mt-4">
                <img :src="internalItem.image" alt="Item Image" class="w-full h-48 object-cover rounded" />
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton @click="close">Cancel</UButton>
                <UButton color="primary" @click="save">Save</UButton>
            </div>
        </template>
    </UCard>
</template>
