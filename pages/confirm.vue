<script setup lang="ts">
const user = useSupabaseUser()
const loading = ref(true)
const error = ref<string | null>(null)

watch(user, async () => {
  if (user.value) {
    try {
      // Sync user profile before redirecting
      await $fetch('/api/auth/sync-profile', { method: 'POST' })
      console.log('Profile synced successfully')
    } catch (syncError: any) {
      console.warn('Profile sync failed:', syncError)
      error.value = 'Profile sync failed, but you can still use the app'
      // Don't block the redirect if sync fails
    } finally {
      loading.value = false
      // Redirect to dashboard after a short delay to show sync status
      setTimeout(() => {
        navigateTo('/')
      }, 1000)
    }
  }
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center items-center bg-gray-50">
    <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary-600 mb-4" />
    <p class="text-xl font-semibold text-gray-900">
      {{ loading ? 'Setting up your profile...' : 'Profile ready!' }}
    </p>
    <p class="text-sm text-gray-600 mt-1">
      {{ loading ? 'Please wait while we sync your account.' : 'Redirecting to dashboard...' }}
    </p>

    <div v-if="error" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p class="text-sm text-yellow-800">{{ error }}</p>
    </div>
  </div>
</template>
