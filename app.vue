<template>
  <div class="min-h-screen pb-16 sm:pt-16 sm:pb-0 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <NavBar />
    <ToastContainer />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const { loadConfig } = useConfig()
const { applyTheme } = useTheme()

onMounted(() => {
  loadConfig()
  applyTheme()
})
</script>
