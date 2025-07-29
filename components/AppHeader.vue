<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { user, signOut } = useAuth()
const toast = useToast()

const userProfile = ref<any>(null)

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
      onSelect: handleSignOut
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
  <header class="bg-white shadow-sm border-b border-gray-200">
    <UContainer>
      <div class="flex items-center justify-between h-16">
        <NuxtLink to="/" class="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <UIcon name="i-lucide-shopping-cart" class="w-8 h-8 text-primary-600" />
          <span class="text-xl font-bold text-gray-900">ShareCart</span>
        </NuxtLink>

        <div v-if="user" class="flex items-center space-x-3">
          <UButton icon="i-lucide-bell" variant="ghost" color="neutral" size="sm" aria-label="Notifications"
            class="hover:bg-gray-100 transition-colors" />

          <UDropdownMenu :items="dropdownItems" :ui="{
            content: 'w-48 bg-white shadow-lg border border-gray-200 rounded-lg'
          }">
            <UButton variant="ghost" size="sm" class="p-0 hover:bg-gray-100 transition-colors">
              <UAvatar :src="userProfile?.avatar_url || undefined"
                :alt="userProfile?.full_name || userProfile?.username || 'User'" size="sm"
                class="ring-2 ring-gray-200 hover:ring-primary-300 transition-all" />
            </UButton>
          </UDropdownMenu>
        </div>
      </div>
    </UContainer>
  </header>
</template>
