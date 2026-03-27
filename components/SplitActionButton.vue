<template>
  <div ref="containerRef" class="relative inline-flex">
    <!-- Primary action button -->
    <button
      class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-l-lg text-sm font-medium transition-colors"
      :disabled="disabled || loading"
      :title="primaryAction?.label"
      @click="$emit('execute', activeId)"
    >
      <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <v-icon v-else :name="primaryAction?.icon" scale="0.9" />
      <span class="hidden sm:inline">{{ primaryAction?.label }}</span>
    </button>

    <!-- Dropdown toggle -->
    <button
      class="flex items-center px-2 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-r-lg border-l border-indigo-500 transition-colors"
      :disabled="disabled || loading"
      @click="open = !open"
    >
      <v-icon name="bi-chevron-down" scale="0.7" />
    </button>

    <!-- Dropdown menu (opens upward) -->
    <div
      v-if="open"
      class="absolute right-0 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50"
      :class="dropDirection === 'down' ? 'top-full mt-1' : 'bottom-full mb-1'"
    >
      <button
        v-for="action in actions"
        :key="action.id"
        class="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        @click="selectAction(action.id)"
      >
        <v-icon :name="action.icon" scale="0.85" class="shrink-0" />
        <span class="flex-1 text-left">{{ action.label }}</span>
        <v-icon v-if="action.id === activeId" name="bi-check" scale="0.85" class="text-indigo-600 dark:text-indigo-400 shrink-0" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

interface Action {
  id: string
  icon: string
  label: string
}

const props = withDefaults(defineProps<{
  actions: Action[]
  activeId: string
  disabled?: boolean
  loading?: boolean
  dropDirection?: 'up' | 'down'
}>(), {
  dropDirection: 'up',
})

const emit = defineEmits<{
  execute: [id: string]
  'update:activeId': [id: string]
}>()

const open = ref(false)
const containerRef = ref<HTMLElement | null>(null)

onClickOutside(containerRef, () => { open.value = false })

const primaryAction = computed(() => props.actions.find(a => a.id === props.activeId) || props.actions[0])

function selectAction(id: string) {
  emit('update:activeId', id)
  emit('execute', id)
  open.value = false
}
</script>
