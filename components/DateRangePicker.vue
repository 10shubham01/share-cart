<script setup lang="ts">
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

interface DateRange {
    start: CalendarDate | null
    end: CalendarDate | null
}

interface Props {
    modelValue?: DateRange
    placeholder?: string
    label?: string
}

interface Emits {
    (e: 'update:modelValue', value: DateRange): void
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: () => ({ start: null, end: null }),
    placeholder: 'Pick a date range',
    label: 'Date Range'
})

const emit = defineEmits<Emits>()

const df = new DateFormatter('en-US', {
    dateStyle: 'medium'
})

const dateRange = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value || { start: null, end: null })
})

const displayText = computed(() => {
    if (!dateRange.value?.start) {
        return props.placeholder
    }

    if (dateRange.value.end) {
        return `${df.format(dateRange.value.start.toDate(getLocalTimeZone()))} - ${df.format(dateRange.value.end.toDate(getLocalTimeZone()))}`
    }

    return df.format(dateRange.value.start.toDate(getLocalTimeZone()))
})

const clearDateRange = () => {
    emit('update:modelValue', { start: null, end: null })
}
</script>

<template>
    <div class="space-y-2">
        <label v-if="label" class="text-sm font-semibold text-gray-700">{{ label }}</label>
        <UPopover>
            <UButton color="neutral" variant="outline" icon="i-heroicons-calendar"
                class="w-full justify-between text-left" :class="{ 'text-gray-500': !dateRange?.start }">
                <span class="truncate">{{ displayText }}</span>
                <UIcon v-if="dateRange?.start" name="i-heroicons-x-mark"
                    class="h-4 w-4 text-gray-400 hover:text-gray-600 ml-2" @click.stop="clearDateRange" />
            </UButton>

            <template #content>
                <div class="p-4">
                    <UCalendar v-model="dateRange" :number-of-months="2" range class="p-2" />
                </div>
            </template>
        </UPopover>
    </div>
</template>