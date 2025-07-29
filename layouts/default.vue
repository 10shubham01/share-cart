<template>
  <UApp class="min-h-screen ">
    <AppHeader />
    <main>
      <slot />
    </main>
    <BottomNavigation v-if="user" />
  </UApp>
</template>

<script setup lang="ts">
import AppHeader from '~/components/AppHeader.vue'
const user = useSupabaseUser()
</script>
