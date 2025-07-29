<script setup lang="ts">
const { handleGoogleCallback } = useAuth()
const toast = useToast()

onMounted(async () => {
  try {
    const session = await handleGoogleCallback()
    await new Promise(resolve => setTimeout(resolve, 1000))

    const { data: { user } } = await useSupabaseClient().auth.getUser()

    if (user) {
      toast.add({ title: 'Success', description: 'Successfully signed in with Google!', color: 'success' })
      await navigateTo('/groceries')
    } else {
      throw new Error('Authentication failed - no user found')
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
    await navigateTo('/login')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin mx-auto mb-4" />
      <p class="text-gray-600">Completing sign in...</p>
    </div>
  </div>
</template>