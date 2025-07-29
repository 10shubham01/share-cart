<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { user, signOut } = useAuth()
const toast = useToast()

const userProfile = ref<any>(null)
const showMobileMenu = ref(false)

const fetchUserProfile = async () => {
  if (!user.value) return

  const { data } = await useFetch(`/api/users/profile`)
  if (data.value) {
    userProfile.value = data.value
  }
}

const handleSignOut = async () => {
  try {
    await signOut()
    toast.add({ title: 'Success', description: 'Signed out successfully', color: 'success' })
    await navigateTo('/login')
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
}

const dropdownItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: userProfile.value?.full_name || userProfile.value?.username || 'User',
      avatar: {
        src: userProfile.value?.avatar_url || undefined
      },
      type: 'label'
    }
  ],
  [
    {
      label: 'Profile',
      icon: 'i-lucide-user',
      to: '/profile'
    },
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/settings'
    }
  ],
  [
    {
      label: 'Sign Out',
      icon: 'i-lucide-log-out',
      click: handleSignOut
    }
  ]
])

onMounted(() => {
  fetchUserProfile()
})

watch(user, () => {
  if (user.value) {
    fetchUserProfile()
  } else {
    userProfile.value = null
  }
})
</script>

<template>
  <header class="bg-white shadow-sm border-b">
    <UContainer>
      <div class="flex items-center justify-between h-16">
        <NuxtLink to="/" class="flex items-center space-x-2">
          <UIcon name="i-lucide-shopping-cart" class="w-8 h-8 text-primary-600" />
          <span class="text-xl font-bold text-gray-900">ShareCart</span>
        </NuxtLink>

        <nav v-if="user" class="hidden md:flex items-center space-x-8">
          <NuxtLink to="/groceries" class="text-gray-600 hover:text-primary-600 transition-colors"
            active-class="text-primary-600 font-medium">
            Groceries
          </NuxtLink>
          <NuxtLink to="/" class="text-gray-600 hover:text-primary-600 transition-colors"
            active-class="text-primary-600 font-medium">
            Dashboard
          </NuxtLink>
          <NuxtLink to="/groups" class="text-gray-600 hover:text-primary-600 transition-colors"
            active-class="text-primary-600 font-medium">
            Groups
          </NuxtLink>
          <NuxtLink to="/shopping-lists" class="text-gray-600 hover:text-primary-600 transition-colors"
            active-class="text-primary-600 font-medium">
            Shopping Lists
          </NuxtLink>
          <NuxtLink to="/expenses" class="text-gray-600 hover:text-primary-600 transition-colors"
            active-class="text-primary-600 font-medium">
            Expenses
          </NuxtLink>
          <NuxtLink to="/grocery-items" class="text-gray-600 hover:text-primary-600 transition-colors"
            active-class="text-primary-600 font-medium">
            Manage Items
          </NuxtLink>
          <NuxtLink to="/reports" class="text-gray-600 hover:text-primary-600 transition-colors"
            active-class="text-primary-600 font-medium">
            Reports
          </NuxtLink>
        </nav>

        <UButton v-if="user" icon="i-lucide-menu" variant="ghost" color="neutral" size="sm" class="md:hidden"
          @click="showMobileMenu = !showMobileMenu" />

        <div v-if="user" class="flex items-center space-x-4">
          <UButton icon="i-lucide-bell" variant="ghost" color="neutral" size="sm" aria-label="Notifications" />

          <UDropdownMenu :items="dropdownItems" :ui="{
            content: 'w-48'
          }">
            <UButton variant="ghost" size="sm" class="p-0">
              <UAvatar :src="userProfile?.avatar_url || undefined"
                :alt="userProfile?.full_name || userProfile?.username || 'User'" size="sm" />
            </UButton>
          </UDropdownMenu>
        </div>

        <div v-if="showMobileMenu && user"
          class="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
          <div class="px-4 py-2 space-y-1">
            <NuxtLink to="/groceries"
              class="block px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              active-class="text-primary-600 bg-primary-50" @click="showMobileMenu = false">
              Groceries
            </NuxtLink>
            <NuxtLink to="/" class="block px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              active-class="text-primary-600 bg-primary-50" @click="showMobileMenu = false">
              Dashboard
            </NuxtLink>
            <NuxtLink to="/groups"
              class="block px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              active-class="text-primary-600 bg-primary-50" @click="showMobileMenu = false">
              Groups
            </NuxtLink>
            <NuxtLink to="/shopping-lists"
              class="block px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              active-class="text-primary-600 bg-primary-50" @click="showMobileMenu = false">
              Shopping Lists
            </NuxtLink>
            <NuxtLink to="/expenses"
              class="block px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              active-class="text-primary-600 bg-primary-50" @click="showMobileMenu = false">
              Expenses
            </NuxtLink>
            <NuxtLink to="/grocery-items"
              class="block px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              active-class="text-primary-600 bg-primary-50" @click="showMobileMenu = false">
              Manage Items
            </NuxtLink>
            <NuxtLink to="/reports"
              class="block px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              active-class="text-primary-600 bg-primary-50" @click="showMobileMenu = false">
              Reports
            </NuxtLink>
            <div class="border-t border-gray-200 pt-2 mt-2">
              <button @click="handleSignOut"
                class="w-full text-left px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md">
                <UIcon name="i-lucide-log-out" class="w-4 h-4 inline mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </header>
</template>
