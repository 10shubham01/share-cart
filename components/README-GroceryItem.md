# GroceryItem Component

A reusable Vue component for adding and editing grocery items in a drawer modal.

## Features

- ✅ Add new grocery items
- ✅ Edit existing grocery items
- ✅ Form validation
- ✅ Unit selection
- ✅ Price input with validation
- ✅ Image URL input
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design

## Usage

### Basic Usage

```vue
<template>
  <div>
    <!-- Add new item -->
    <UButton @click="openAddModal">Add Item</UButton>
    
    <!-- Edit existing item -->
    <UButton @click="openEditModal">Edit Item</UButton>
    
    <!-- GroceryItem Component -->
    <GroceryItem
      v-model="showModal"
      :item="editingItem"
      @saved="handleItemSaved"
      @cancelled="handleCancelled"
    />
  </div>
</template>

<script setup>
const showModal = ref(false)
const editingItem = ref(null)

const openAddModal = () => {
  editingItem.value = null
  showModal.value = true
}

const openEditModal = () => {
  editingItem.value = selectedItem.value
  showModal.value = true
}

const handleItemSaved = (item) => {
  // Handle successful save
  console.log('Item saved:', item)
}

const handleCancelled = () => {
  // Handle cancellation
  console.log('Operation cancelled')
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `item` | `GroceryItem \| null` | `null` | The grocery item to edit. If null, component will be in "add" mode |

## Emits

| Event | Payload | Description |
|-------|---------|-------------|
| `saved` | `GroceryItem` | Emitted when an item is successfully saved (created or updated) |
| `cancelled` | - | Emitted when the user cancels the operation |

## Data Structure

### GroceryItem Type
```typescript
interface GroceryItem {
  id: string
  name: string
  default_price: number | null
  unit: string
  image_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}
```



## Form Fields

1. **Name** (required) - The name of the grocery item
2. **Default Price** (optional) - The default price per unit
3. **Unit** (required) - The unit of measurement (piece, kg, gm, liter, ml, pack, bottle, box, dozen, bunch)
4. **Image URL** (optional) - URL to an image of the item

## Validation

- Name is required and cannot be empty
- Unit is required and cannot be empty
- Price must be non-negative if provided
- Form is disabled until required fields are filled

## API Integration

The component automatically handles API calls:

- **POST** `/api/grocery-items` - For creating new items
- **PUT** `/api/grocery-items/{id}` - For updating existing items

## Styling

The component uses Nuxt UI components and follows the design system:
- UDrawer for the modal
- UFormField for form fields
- UInput, UInputNumber, USelectMenu for inputs
- UButton for actions

## Error Handling

- Form validation errors are displayed inline
- API errors are logged to console
- Loading states prevent multiple submissions
- User-friendly error messages

## Example Implementation

See `GroceryItemExample.vue` for a complete implementation example showing how to:
- Manage the modal state
- Handle add vs edit modes
- Process saved items
- Display existing items
- Handle user interactions 