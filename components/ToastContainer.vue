<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'rounded-lg px-4 py-3 shadow-lg border text-sm',
          toast.type === 'success' && 'bg-green-950 border-green-800 text-green-200',
          toast.type === 'error' && 'bg-red-950 border-red-800 text-red-200',
          toast.type === 'info' && 'bg-blue-950 border-blue-800 text-blue-200',
        ]"
      >
        <div class="flex items-start gap-2">
          <span class="mt-0.5">
            <template v-if="toast.type === 'success'">&#10003;</template>
            <template v-else-if="toast.type === 'error'">&#10007;</template>
            <template v-else>&#9432;</template>
          </span>
          <div class="flex-1">
            <p>{{ toast.message }}</p>
            <a
              v-if="toast.link"
              :href="toast.link.url"
              target="_blank"
              rel="noopener"
              class="inline-block mt-1 text-xs underline hover:no-underline opacity-80 hover:opacity-100"
            >
              {{ toast.link.label }}
            </a>
          </div>
          <button
            class="opacity-60 hover:opacity-100 ml-2"
            @click="remove(toast.id)"
          >
            &times;
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
const { toasts, remove } = useToast()
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease;
}
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
