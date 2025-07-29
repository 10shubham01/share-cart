<template>
  <UApp class="min-h-screen ">
    <AppHeader />
    <main>
      <slot />
    </main>
    <BottomNavigation />
  </UApp>
</template>

<script setup lang="ts">
import AppHeader from '~/components/AppHeader.vue'
</script>
