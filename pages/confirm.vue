<script setup lang="ts">
const user = useSupabaseUser()

watch(user, () => {
  if (user.value) {
    navigateTo('/groceries')
  }
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center items-center bg-gray-50">
    <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary-600 mb-4" />
    <p class="text-xl font-semibold text-gray-900">Waiting for login...</p>
    <p class="text-sm text-gray-600 mt-1">Redirecting you to groceries if logged in.</p>
  </div>
</template>
