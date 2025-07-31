<template>
  <UApp class="min-h-screen flex flex-col justify-between relative">
    <AppHeader class="sticky top-0 !z-50" />
    <main class="mb-28">
      <slot />
    </main>
    <BottomNavigation v-if="user" class="fixed bottom-0 left-1/2 transform -translate-x-1/2" />
  </UApp>
</template>

<script setup lang="ts">
import AppHeader from '~/components/AppHeader.vue'
const user = useSupabaseUser()
</script>
