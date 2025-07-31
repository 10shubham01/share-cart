<script setup lang="ts">
const user = useSupabaseUser()
const loading = ref(true)
const error = ref<string | null>(null)

watch(user, async () => {
  if (user.value) {
    try {
      const syncData: any = {}
      if (user.value?.user_metadata?.name) {
        syncData.full_name = user.value.user_metadata.name
      } else if (user.value?.user_metadata?.username) {
        syncData.full_name = user.value.user_metadata.username
      } else if (user.value?.user_metadata?.full_name) {
        syncData.full_name = user.value.user_metadata.full_name
      }

      await $fetch('/api/auth/sync-profile', {
        method: 'POST',
        body: syncData
      })
    } catch (syncError: any) {
      error.value = 'Profile sync failed, but you can still use the app'
    } finally {
      loading.value = false
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
