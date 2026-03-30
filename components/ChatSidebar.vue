<template>
  <div class="hidden sm:flex flex-col w-72 shrink-0 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
    <div class="p-4 space-y-5 flex-1">
      <!-- Auto mode -->
      <div>
        <button
          class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors border"
          :class="autoMode ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'"
          @click="$emit('toggle-auto')"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ autoMode ? t('index.autoModeOn') : t('index.autoMode') }}
        </button>
      </div>

      <!-- Quick contexts -->
      <div v-if="favoriteContexts.length > 0">
        <p class="text-xs text-gray-400 dark:text-gray-600 mb-1.5 font-medium uppercase tracking-wider">{{ t('index.favoriteContexts') }}</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="fav in activeFavoriteContexts"
            :key="fav.id"
            class="px-3 py-1.5 text-xs rounded-full border transition-colors flex items-center gap-1.5 whitespace-nowrap bg-accent-50 dark:bg-accent-950 border-accent-400 dark:border-accent-600 text-accent-700 dark:text-accent-300"
            @click="$emit('toggle-context', fav.id)"
          >
            {{ fav.name }}
            <svg class="w-3 h-3 ml-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            class="px-3 py-1.5 text-xs rounded-full border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            @click="showContextPicker = !showContextPicker"
          >
            + {{ t('index.add') }}
          </button>
        </div>
        <div v-if="showContextPicker" class="mt-2 max-h-40 overflow-y-auto space-y-1">
          <button
            v-for="fav in inactiveFavoriteContexts"
            :key="fav.id"
            class="w-full px-3 py-1.5 text-xs rounded-lg border transition-colors text-left hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
            @click="$emit('toggle-context', fav.id); showContextPicker = false"
          >
            {{ fav.name }}
          </button>
        </div>
      </div>

      <!-- Labels -->
      <div v-if="labels.length > 0">
        <p class="text-xs text-gray-400 dark:text-gray-600 mb-1.5 font-medium uppercase tracking-wider">{{ t('index.labels') }}</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="label in activeLabels"
            :key="label.id"
            class="px-3 py-1.5 text-xs rounded-full border transition-colors flex items-center gap-1.5 whitespace-nowrap bg-accent-50 dark:bg-accent-950 border-accent-400 dark:border-accent-600 text-accent-700 dark:text-accent-300"
            @click="$emit('toggle-label', label.id)"
          >
            <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: label.color }" />
            {{ label.name }}
            <svg class="w-3 h-3 ml-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            class="px-3 py-1.5 text-xs rounded-full border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            @click="showLabelPicker = !showLabelPicker"
          >
            + {{ t('index.add') }}
          </button>
        </div>
        <div v-if="showLabelPicker" class="mt-2 max-h-40 overflow-y-auto space-y-1">
          <button
            v-for="label in inactiveLabels"
            :key="label.id"
            class="w-full px-3 py-1.5 text-xs rounded-lg border transition-colors text-left hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
            @click="$emit('toggle-label', label.id); showLabelPicker = false"
          >
            <span class="inline-block w-2 h-2 rounded-full mr-1.5" :style="{ backgroundColor: label.color }" />
            {{ label.name }}
          </button>
        </div>
      </div>

      <!-- Project -->
      <div v-if="projects.length > 0">
        <p class="text-xs text-gray-400 dark:text-gray-600 mb-1.5 font-medium uppercase tracking-wider">{{ t('index.project') }}</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="project in selectedProjects"
            :key="project.id"
            class="px-3 py-1.5 text-xs rounded-full border transition-colors flex items-center gap-1.5 whitespace-nowrap bg-accent-50 dark:bg-accent-950 border-accent-400 dark:border-accent-600 text-accent-700 dark:text-accent-300"
            @click="$emit('toggle-project', project.id)"
          >
            {{ project.name }}
            <svg class="w-3 h-3 ml-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            class="px-3 py-1.5 text-xs rounded-full border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            @click="showProjectPicker = !showProjectPicker"
          >
            + {{ t('index.add') }}
          </button>
        </div>
        <div v-if="showProjectPicker" class="mt-2 max-h-40 overflow-y-auto space-y-1">
          <button
            v-for="project in unselectedProjects"
            :key="project.id"
            class="w-full px-3 py-1.5 text-xs rounded-lg border transition-colors text-left hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
            @click="$emit('toggle-project', project.id); showProjectPicker = false"
          >
            {{ project.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  autoMode: boolean
  favoriteContexts: { id: number; name: string }[]
  activeContextIds: number[]
  labels: { id: string; name: string; color: string }[]
  selectedLabelIds: string[]
  projects: { id: string; name: string }[]
  selectedProjectId: string
}>()

defineEmits<{
  'toggle-auto': []
  'toggle-context': [id: number]
  'toggle-label': [id: string]
  'toggle-project': [id: string]
}>()

const showContextPicker = ref(false)
const showLabelPicker = ref(false)
const showProjectPicker = ref(false)

const activeFavoriteContexts = computed(() =>
  props.favoriteContexts.filter(c => props.activeContextIds.includes(c.id))
)
const inactiveFavoriteContexts = computed(() =>
  props.favoriteContexts.filter(c => !props.activeContextIds.includes(c.id))
)
const activeLabels = computed(() =>
  props.labels.filter(l => props.selectedLabelIds.includes(l.id))
)
const inactiveLabels = computed(() =>
  props.labels.filter(l => !props.selectedLabelIds.includes(l.id))
)
const selectedProjects = computed(() =>
  props.projects.filter(p => props.selectedProjectId === p.id)
)
const unselectedProjects = computed(() =>
  props.projects.filter(p => props.selectedProjectId !== p.id)
)
</script>
