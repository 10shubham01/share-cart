<script setup lang="ts">
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface Expense {
    id: string
    title: string
    description: string | null
    amount: number
    currency: string
    created_at: string
    created_by: string
    expense_shares?: Array<{
        friend?: {
            id: string
            full_name: string | null
            email: string
            avatar_url: string | null
        }
    }>
    expense_items?: Array<{
        id: string
        name: string
        quantity: number
        unit_price: number
        total_price: number
        notes: string | null
    }>
}

interface Props {
    expenses: Expense[]
    loading?: boolean
    disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    disabled: false
})

const isExporting = ref(false)

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const getFriendNames = (expense: Expense) => {
    if (!expense.expense_shares || expense.expense_shares.length === 0) {
        return 'None'
    }

    return expense.expense_shares
        .map(share => {
            if (share.friend?.full_name) {
                return share.friend.full_name.split(' ')[0]
            }
            if (share.friend?.email) {
                return share.friend.email.split('@')[0]
            }
            return 'Unknown'
        })
        .join(', ')
}

const getItemDetails = (expense: Expense) => {
    if (!expense.expense_items || expense.expense_items.length === 0) {
        return 'No items'
    }

    return expense.expense_items
        .map(item => `${item.name} (${item.quantity} × ₹${item.unit_price.toFixed(2)})`)
        .join('; ')
}

const createSummarySheet = () => {
    const totalAmount = props.expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const avgAmount = totalAmount / props.expenses.length || 0
    const totalItems = props.expenses.reduce((sum, expense) => sum + (expense.expense_items?.length || 0), 0)

    // Calculate unique participants
    const allParticipants = new Set<string>()
    props.expenses.forEach(expense => {
        expense.expense_shares?.forEach(share => {
            if (share.friend?.id) {
                allParticipants.add(share.friend.id)
            }
        })
    })
    const uniqueParticipants = allParticipants.size
    const totalParticipations = props.expenses.reduce((sum, expense) => sum + (expense.expense_shares?.length || 0), 0)

    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyExpenses = props.expenses.filter(expense => new Date(expense.created_at) >= currentMonth)
    const monthlyAmount = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)

    const summaryData = [
        { 'Metric': 'Total Expenses', 'Value': props.expenses.length },
        { 'Metric': 'Total Amount', 'Value': `₹${totalAmount.toFixed(2)}` },
        { 'Metric': 'Average Amount', 'Value': `₹${avgAmount.toFixed(2)}` },
        { 'Metric': 'This Month Expenses', 'Value': monthlyExpenses.length },
        { 'Metric': 'This Month Amount', 'Value': `₹${monthlyAmount.toFixed(2)}` },
        { 'Metric': 'Total Items', 'Value': totalItems },
        { 'Metric': 'Unique Participants', 'Value': uniqueParticipants },
        { 'Metric': 'Total Participations', 'Value': totalParticipations },
        { 'Metric': 'Average Participations per Expense', 'Value': (totalParticipations / props.expenses.length || 0).toFixed(1) },
        { 'Metric': 'Export Date', 'Value': formatDate(now.toISOString()) }
    ]

    return XLSX.utils.json_to_sheet(summaryData)
}

const createExpensesSheet = () => {
    const exportData = props.expenses.map(expense => ({
        'Expense ID': expense.id,
        'Title': expense.title,
        'Description': expense.description || '',
        'Amount': expense.amount,
        'Currency': expense.currency,
        'Date Created': formatDate(expense.created_at),
        'Participants': getFriendNames(expense),
        'Items': getItemDetails(expense),
        'Total Items': expense.expense_items?.length || 0,
        'Total Participants': expense.expense_shares?.length || 0
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    const columnWidths = [
        { wch: 15 }, // Expense ID
        { wch: 25 }, // Title
        { wch: 30 }, // Description
        { wch: 12 }, // Amount
        { wch: 10 }, // Currency
        { wch: 20 }, // Date Created
        { wch: 25 }, // Participants
        { wch: 40 }, // Items
        { wch: 12 }, // Total Items
        { wch: 15 }  // Total Participants
    ]
    worksheet['!cols'] = columnWidths

    return worksheet
}

const createParticipantsSheet = () => {
    const participantsData: any[] = []

    props.expenses.forEach(expense => {
        if (expense.expense_shares && expense.expense_shares.length > 0) {
            expense.expense_shares.forEach(share => {
                participantsData.push({
                    'Expense ID': expense.id,
                    'Expense Title': expense.title,
                    'Participant Name': share.friend?.full_name || 'Unknown',
                    'Participant Email': share.friend?.email || '',
                    'Expense Amount': expense.amount,
                    'Currency': expense.currency,
                    'Date': formatDate(expense.created_at)
                })
            })
        }
    })

    if (participantsData.length === 0) {
        return null
    }

    const worksheet = XLSX.utils.json_to_sheet(participantsData)

    // Set column widths
    const columnWidths = [
        { wch: 15 }, // Expense ID
        { wch: 25 }, // Expense Title
        { wch: 25 }, // Participant Name
        { wch: 30 }, // Participant Email
        { wch: 15 }, // Expense Amount
        { wch: 10 }, // Currency
        { wch: 20 }  // Date
    ]
    worksheet['!cols'] = columnWidths

    return worksheet
}

const createItemsSheet = () => {
    const itemsData: any[] = []

    props.expenses.forEach(expense => {
        if (expense.expense_items && expense.expense_items.length > 0) {
            expense.expense_items.forEach(item => {
                itemsData.push({
                    'Expense ID': expense.id,
                    'Expense Title': expense.title,
                    'Item Name': item.name,
                    'Quantity': item.quantity,
                    'Unit Price': item.unit_price,
                    'Total Price': item.total_price,
                    'Notes': item.notes || '',
                    'Date': formatDate(expense.created_at)
                })
            })
        }
    })

    if (itemsData.length === 0) {
        return null
    }

    const worksheet = XLSX.utils.json_to_sheet(itemsData)

    // Set column widths
    const columnWidths = [
        { wch: 15 }, // Expense ID
        { wch: 25 }, // Expense Title
        { wch: 25 }, // Item Name
        { wch: 10 }, // Quantity
        { wch: 12 }, // Unit Price
        { wch: 12 }, // Total Price
        { wch: 30 }, // Notes
        { wch: 20 }  // Date
    ]
    worksheet['!cols'] = columnWidths

    return worksheet
}

const exportToExcel = async () => {
    if (props.expenses.length === 0) {
        return
    }

    isExporting.value = true

    try {
        // Create workbook
        const workbook = XLSX.utils.book_new()

        // Add Summary sheet
        const summarySheet = createSummarySheet()
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

        // Add Expenses sheet
        const expensesSheet = createExpensesSheet()
        XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses')

        // Add Participants sheet
        const participantsSheet = createParticipantsSheet()
        if (participantsSheet) {
            XLSX.utils.book_append_sheet(workbook, participantsSheet, 'Participants')
        }

        // Add Items sheet if there are items
        const itemsSheet = createItemsSheet()
        if (itemsSheet) {
            XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items')
        }

        // Generate filename with current date
        const now = new Date()
        const dateStr = now.toISOString().split('T')[0]
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
        const filename = `expenses_${dateStr}_${timeStr}.xlsx`

        // Export to file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        saveAs(blob, filename)

        // Show success message
        const toast = useToast()
        toast.add({
            title: 'Export Successful',
            description: `${props.expenses.length} expenses exported to ${filename}`,
            color: 'success'
        })

    } catch (error) {
        console.error('Export failed:', error)

        // Show error message
        const toast = useToast()
        toast.add({
            title: 'Export Failed',
            description: 'Failed to export expenses. Please try again.',
            color: 'error'
        })
    } finally {
        isExporting.value = false
    }
}
</script>

<template>
    <UButton :loading="isExporting || loading" :disabled="disabled || expenses.length === 0" color="green"
        variant="outline" @click="exportToExcel" class="transition-all duration-200 hover:shadow-md">
        <UIcon :name="isExporting ? 'i-heroicons-arrow-path' : 'i-heroicons-arrow-down-tray'" class="h-4 w-4 mr-2"
            :class="{ 'animate-spin': isExporting }" />
        {{ isExporting ? 'Exporting...' : `Export ${expenses.length} Expenses` }}
    </UButton>
</template>