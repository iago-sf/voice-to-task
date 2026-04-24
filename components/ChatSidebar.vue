<template>
  <div class="hidden sm:flex flex-col w-72 shrink-0 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
    <div class="p-4 space-y-5 flex-1">
      <!-- Project contexts (desktop only) -->
      <div v-if="isDesktop">
        <p class="text-xs text-gray-400 dark:text-gray-600 mb-1.5 font-medium uppercase tracking-wider">Projects</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="pc in activeProjectContexts"
            :key="pc.id"
            class="px-3 py-1.5 text-xs rounded-full border transition-colors flex items-center gap-1.5 whitespace-nowrap bg-accent-50 dark:bg-accent-950 border-accent-400 dark:border-accent-600 text-accent-700 dark:text-accent-300"
            @click="toggleProjectContext(pc.id)"
          >
            <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {{ pc.name }}
            <svg class="w-3 h-3 ml-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            class="px-3 py-1.5 text-xs rounded-full border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            @click="showProjectContextPicker = !showProjectContextPicker"
          >
            + Add
          </button>
        </div>
        <div v-if="showProjectContextPicker" class="mt-2 max-h-40 overflow-y-auto space-y-1">
          <button
            v-for="pc in inactiveProjectContexts"
            :key="pc.id"
            class="w-full px-3 py-1.5 text-xs rounded-lg border transition-colors text-left hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
            @click="toggleProjectContext(pc.id); showProjectContextPicker = false"
          >
            {{ pc.name }}
          </button>
          <button
            class="w-full px-3 py-1.5 text-xs rounded-lg border border-dashed border-accent-300 dark:border-accent-700 text-accent-500 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950 transition-colors text-left flex items-center gap-1.5"
            @click="addProjectFolder"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New folder...
          </button>
        </div>
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

      <!-- Linear Project -->
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
import type { ProjectContext } from '~/types'

const { t } = useI18n()
const { success: toastSuccess, error: toastError } = useToast()

const props = defineProps<{
  favoriteContexts: { id: number; name: string }[]
  activeContextIds: number[]
  labels: { id: string; name: string; color: string }[]
  selectedLabelIds: string[]
  projects: { id: string; name: string }[]
  selectedProjectId: string
  projectContexts: ProjectContext[]
  activeProjectContextIds: number[]
}>()

const emit = defineEmits<{
  'toggle-context': [id: number]
  'toggle-label': [id: string]
  'toggle-project': [id: string]
  'toggle-project-context': [id: number]
  'update:project-contexts': [contexts: ProjectContext[]]
  'update:active-project-context-ids': [ids: number[]]
}>()

const config = useRuntimeConfig()
const isDesktop = computed(() => config.public.desktopMode === true)

const showContextPicker = ref(false)
const showLabelPicker = ref(false)
const showProjectPicker = ref(false)
const showProjectContextPicker = ref(false)

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
const activeProjectContexts = computed(() =>
  props.projectContexts.filter(pc => props.activeProjectContextIds.includes(pc.id))
)
const inactiveProjectContexts = computed(() =>
  props.projectContexts.filter(pc => !props.activeProjectContextIds.includes(pc.id))
)

function toggleProjectContext(id: number) {
  emit('toggle-project-context', id)
}

async function addProjectFolder() {
  try {
    const folderPath = await (window as any).__electron?.selectFolder()
    if (!folderPath) return

    const name = folderPath.split('/').pop() || folderPath
    const result = await $fetch<{ id: number; name: string; folder_path: string }>('/api/project-contexts', {
      method: 'POST',
      body: { name, folder_path: folderPath },
    })

    emit('update:project-contexts', [...props.projectContexts, { ...result, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
    emit('update:active-project-context-ids', [...props.activeProjectContextIds, result.id])
    showProjectContextPicker.value = false
    toastSuccess(`Project "${result.name}" added`)
  } catch (err: any) {
    toastError(`Error adding project: ${err.data?.message || err.message}`)
  }
}
</script>
