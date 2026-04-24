<template>
  <div
    class="max-w-2xl mx-auto px-4 py-8 relative"
    @dragover.prevent="dragging = true"
    @dragenter.prevent="dragging = true"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- Drop overlay -->
    <div
      v-if="dragging"
      class="absolute inset-0 z-50 flex items-center justify-center bg-accent-600/10 border-2 border-dashed border-accent-400 rounded-xl backdrop-blur-sm pointer-events-none"
    >
      <span class="text-accent-600 dark:text-accent-300 text-lg font-medium">{{ t('contexts.dropOverlay') }}</span>
    </div>

    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ t('contexts.title') }}</h1>
      <div class="flex items-center gap-2">
        <button
          v-if="contexts.length >= 2"
          class="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
          :disabled="compacting"
          @click="openCompactModal"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          {{ compacting ? t('contexts.compacting') : t('contexts.compact') }}
        </button>
        <button
          class="flex items-center gap-2 px-3 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm font-medium transition-colors"
          @click="showNewForm = true"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ t('contexts.new') }}
        </button>
      </div>
    </div>

    <p class="text-sm text-gray-500 mb-6">
      {{ t('contexts.description') }}
    </p>

    <!-- New context form -->
    <div v-if="showNewForm" class="mb-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <input
        v-model="newName"
        type="text"
        :placeholder="t('contexts.namePlaceholder')"
        class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500 placeholder-gray-400 dark:placeholder-gray-600 mb-3"
        @keydown.enter="createContext"
      />
      <div class="flex gap-2">
        <button
          class="px-3 py-1.5 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm transition-colors"
          :disabled="!newName.trim()"
          @click="createContext"
        >
          {{ t('contexts.create') }}
        </button>
        <button
          class="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
          @click="showNewForm = false; newName = ''"
        >
          {{ t('contexts.cancel') }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-gray-500">{{ t('contexts.loading') }}</div>

    <!-- Empty state -->
    <div v-else-if="contexts.length === 0 && !showNewForm" class="text-center py-12">
      <svg class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-gray-500 text-sm">{{ t('contexts.empty') }}</p>
      <p class="text-gray-400 dark:text-gray-600 text-xs mt-1">{{ t('contexts.emptyHint') }}</p>
    </div>

    <!-- Context list -->
    <div v-else class="flex flex-col gap-3">
      <div
        v-for="ctx in contexts"
        :key="ctx.id"
        class="bg-white dark:bg-gray-900 border rounded-lg overflow-hidden transition-colors"
        :class="isActive(ctx.id) ? 'border-accent-400 dark:border-accent-700' : 'border-gray-200 dark:border-gray-800'"
      >
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3">
          <!-- Active toggle -->
          <button
            class="relative w-9 h-5 rounded-full transition-colors shrink-0"
            :class="isActive(ctx.id) ? 'bg-accent-600' : 'bg-gray-300 dark:bg-gray-700'"
            @click="toggleActive(ctx.id)"
          >
            <div
              class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              :class="isActive(ctx.id) ? 'translate-x-4' : ''"
            />
          </button>

          <!-- Name (editable) -->
          <div v-if="editingNameId === ctx.id" class="flex-1">
            <input
              ref="nameInputRef"
              v-model="editingNameValue"
              type="text"
              class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500"
              @keydown.enter="($event.target as HTMLInputElement).blur()"
              @keydown.escape="editingNameId = null"
              @blur="saveName(ctx)"
            />
          </div>
          <button
            v-else
            class="flex-1 text-left text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white truncate"
            @click="startEditingName(ctx)"
          >
            {{ ctx.name }}
          </button>

          <span
            v-if="isActive(ctx.id)"
            class="text-xs px-2 py-0.5 bg-accent-50 dark:bg-accent-950 text-accent-600 dark:text-accent-300 border border-accent-200 dark:border-accent-800 rounded shrink-0"
          >
            {{ t('contexts.active') }}
          </span>

          <!-- Favorite toggle -->
          <button
            class="p-1 transition-colors shrink-0"
            :class="isFavorite(ctx.id) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'"
            :title="t('contexts.favorite')"
            @click="toggleFavorite(ctx.id)"
          >
            <svg class="w-4 h-4" :fill="isFavorite(ctx.id) ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>

          <!-- Expand / collapse -->
          <button
            class="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            @click="expandedId = expandedId === ctx.id ? null : ctx.id"
          >
            <svg
              class="w-4 h-4 transition-transform"
              :class="expandedId === ctx.id ? 'rotate-180' : ''"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Delete -->
          <button
            class="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            :title="t('entry.deleteTitle')"
            @click="deleteContext(ctx)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <!-- Content editor (expanded) -->
        <div v-if="expandedId === ctx.id" class="border-t border-gray-200 dark:border-gray-800 p-4">
          <textarea
            v-model="ctx.content"
            rows="12"
            class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500 resize-y font-mono leading-relaxed placeholder-gray-400 dark:placeholder-gray-600"
            :placeholder="t('contexts.editorPlaceholder')"
            @blur="saveContent(ctx)"
          />
          <div class="mt-2">
            <span class="text-xs text-gray-400 dark:text-gray-600">{{ ctx.content.length }} {{ t('index.chars') }}</span>
          </div>
        </div>
      </div>
    </div>


    <!-- Project contexts (desktop only) -->
    <div v-if="isDesktop" class="mt-10">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <svg class="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Projects
        </h2>
        <button
          class="flex items-center gap-2 px-3 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm font-medium transition-colors"
          @click="addProjectFolder"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add folder
        </button>
      </div>
      <p class="text-sm text-gray-500 mb-4">Local project folders used as live context via file tools. The AI can explore files, read code, and check git status in real time.</p>

      <div v-if="projectContexts.length === 0" class="text-center py-8 bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
        <svg class="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <p class="text-gray-500 text-sm">No project folders added yet</p>
      </div>

      <div v-else class="flex flex-col gap-3">
        <div
          v-for="pc in projectContexts"
          :key="'project-' + pc.id"
          class="bg-white dark:bg-gray-900 border rounded-lg overflow-hidden transition-colors"
          :class="isProjectActive(pc.id) ? 'border-accent-400 dark:border-accent-700' : 'border-gray-200 dark:border-gray-800'"
        >
          <div class="flex items-center gap-3 px-4 py-3">
            <button
              class="relative w-9 h-5 rounded-full transition-colors shrink-0"
              :class="isProjectActive(pc.id) ? 'bg-accent-600' : 'bg-gray-300 dark:bg-gray-700'"
              @click="toggleProjectActive(pc.id)"
            >
              <div
                class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                :class="isProjectActive(pc.id) ? 'translate-x-4' : ''"
              />
            </button>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ pc.name }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-600 truncate font-mono">{{ pc.folder_path }}</p>
            </div>
            <span
              v-if="isProjectActive(pc.id)"
              class="text-xs px-2 py-0.5 bg-accent-50 dark:bg-accent-950 text-accent-600 dark:text-accent-300 border border-accent-200 dark:border-accent-800 rounded shrink-0"
            >
              Active
            </span>
            <button
              class="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
              title="Remove project"
              @click="deleteProjectContext(pc)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Compact modal -->
    <Teleport to="body">
      <div
        v-if="showCompactModal"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="showCompactModal = false"
      >
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
          <!-- Header -->
          <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 class="text-base font-semibold text-gray-800 dark:text-gray-200">{{ t('contexts.compactSelect') }}</h2>
          </div>

          <!-- Context list -->
          <div class="px-5 py-3 max-h-72 overflow-y-auto">
            <div class="flex items-center justify-between mb-3">
              <button
                class="text-xs text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300"
                @click="compactSelection = contexts.map(c => c.id)"
              >
                {{ t('contexts.compactSelectAll') }}
              </button>
              <button
                class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                @click="compactSelection = []"
              >
                {{ t('contexts.compactNone') }}
              </button>
            </div>
            <label
              v-for="ctx in contexts"
              :key="ctx.id"
              class="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                :checked="compactSelection.includes(ctx.id)"
                class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-accent-600 focus:ring-accent-500"
                @change="toggleCompactSelection(ctx.id)"
              />
              <div class="flex-1 min-w-0">
                <span class="text-sm text-gray-800 dark:text-gray-200 truncate block">{{ ctx.name }}</span>
                <span class="text-xs text-gray-400 dark:text-gray-600">{{ ctx.content.length }} {{ t('index.chars') }}</span>
              </div>
              <span
                v-if="isActive(ctx.id)"
                class="text-[10px] px-1.5 py-0.5 bg-accent-50 dark:bg-accent-950 text-accent-600 dark:text-accent-300 border border-accent-200 dark:border-accent-800 rounded shrink-0"
              >
                {{ t('contexts.active') }}
              </span>
            </label>
          </div>

          <!-- Footer -->
          <div class="px-5 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
            <span v-if="compactSelection.length < 2" class="text-xs text-amber-600 dark:text-amber-400">
              {{ t('contexts.compactMin') }}
            </span>
            <span v-else class="text-xs text-gray-500">
              {{ compactSelection.length }} / {{ contexts.length }}
            </span>
            <div class="flex gap-2">
              <button
                class="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                @click="showCompactModal = false"
              >
                {{ t('contexts.cancel') }}
              </button>
              <button
                class="px-4 py-1.5 bg-accent-600 hover:bg-accent-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
                :disabled="compactSelection.length < 2 || compacting"
                @click="compactContexts"
              >
                {{ compacting ? t('contexts.compacting') : t('contexts.compactMerge') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Context, ProjectContext } from '~/types'

const { config, loadConfig, saveConfig } = useConfig()
const { success: toastSuccess, error: toastError } = useToast()
const { t } = useI18n()

const contexts = ref<Context[]>([])
const loading = ref(true)
const showNewForm = ref(false)
const newName = ref('')
const expandedId = ref<number | null>(null)
const editingNameId = ref<number | null>(null)
const editingNameValue = ref('')
const nameInputRef = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const projectContexts = ref<ProjectContext[]>([])
const runtimeConfig = useRuntimeConfig()
const isDesktop = computed(() => runtimeConfig.public.desktopMode === true)
const compacting = ref(false)
const showCompactModal = ref(false)
const compactSelection = ref<number[]>([])

function openCompactModal() {
  // Pre-select active contexts
  compactSelection.value = contexts.value
    .filter(ctx => isActive(ctx.id))
    .map(ctx => ctx.id)
  showCompactModal.value = true
}

function toggleCompactSelection(id: number) {
  const idx = compactSelection.value.indexOf(id)
  if (idx === -1) {
    compactSelection.value.push(id)
  } else {
    compactSelection.value.splice(idx, 1)
  }
}

function isFavorite(id: number): boolean {
  return (config.value.favoriteContextIds || []).includes(id)
}

function toggleFavorite(id: number) {
  if (!config.value.favoriteContextIds) {
    config.value.favoriteContextIds = []
  }
  const idx = config.value.favoriteContextIds.indexOf(id)
  if (idx === -1) {
    config.value.favoriteContextIds.push(id)
    toastSuccess(t('contexts.favoriteAdded'))
  } else {
    config.value.favoriteContextIds.splice(idx, 1)
    toastSuccess(t('contexts.favoriteRemoved'))
  }
  saveConfig()
}

async function compactContexts() {
  const ids = [...compactSelection.value]
  if (ids.length < 2) return

  compacting.value = true
  try {
    const created = await $fetch<Context>('/api/contexts/compact', {
      method: 'POST',
      body: {
        contextIds: ids,
        engine: config.value.llmEngine || 'groq',
        model: config.value.llmEngine === 'zai'
          ? (config.value.zaiModel || 'glm-5.1')
          : config.value.llmEngine === 'minimax'
            ? (config.value.minimaxModel || 'MiniMax-M2.7')
            : (config.value.groqModel || 'openai/gpt-oss-120b'),
      },
    })

    // Remove compacted contexts from local list
    contexts.value = contexts.value.filter(c => !ids.includes(c.id))
    contexts.value.push(created)

    // Update activeContextIds: remove old, add new
    const hadActive = config.value.activeContextIds.some((id: number) => ids.includes(id))
    config.value.activeContextIds = config.value.activeContextIds.filter((id: number) => !ids.includes(id))
    if (hadActive) {
      config.value.activeContextIds.push(created.id)
    }

    // Update favoriteContextIds: remove old, add new if any were favorites
    const hadFavorite = (config.value.favoriteContextIds || []).some((id: number) => ids.includes(id))
    config.value.favoriteContextIds = (config.value.favoriteContextIds || []).filter((id: number) => !ids.includes(id))
    if (hadFavorite) {
      config.value.favoriteContextIds.push(created.id)
    }

    saveConfig()
    showCompactModal.value = false
    toastSuccess(t('contexts.compacted'))
  } catch {
    toastError(t('contexts.errorSave'))
  } finally {
    compacting.value = false
  }
}

function startEditingName(ctx: Context) {
  editingNameId.value = ctx.id
  editingNameValue.value = ctx.name
  nextTick(() => {
    nameInputRef.value?.focus()
    nameInputRef.value?.select()
  })
}

function onDragLeave(e: DragEvent) {
  const related = e.relatedTarget as Node | null
  if (!related || !(e.currentTarget as HTMLElement).contains(related)) {
    dragging.value = false
  }
}

async function onDrop(e: DragEvent) {
  dragging.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  if (!files.length) return

  let hasNonMd = false
  for (const file of files) {
    if (!file.name.endsWith('.md')) {
      hasNonMd = true
      continue
    }
    const content = await file.text()
    const name = file.name.replace(/\.md$/, '')
    try {
      const ctx = await $fetch<Context>('/api/contexts', {
        method: 'POST',
        body: { name, content },
      })
      contexts.value.push(ctx)
      toastSuccess(t('contexts.imported', { name }))
    } catch {
      toastError(t('contexts.errorCreate'))
    }
  }
  if (hasNonMd) {
    toastError(t('contexts.errorNotMd'))
  }
}

function isActive(id: number): boolean {
  return config.value.activeContextIds.includes(id)
}

function toggleActive(id: number) {
  const idx = config.value.activeContextIds.indexOf(id)
  if (idx === -1) {
    config.value.activeContextIds.push(id)
  } else {
    config.value.activeContextIds.splice(idx, 1)
  }
  saveConfig()
}

async function fetchContexts() {
  loading.value = true
  try {
    contexts.value = await $fetch<Context[]>('/api/contexts')
  } catch {
    toastError(t('contexts.errorLoad'))
  } finally {
    loading.value = false
  }
}

async function createContext() {
  if (!newName.value.trim()) return
  try {
    const ctx = await $fetch<Context>('/api/contexts', {
      method: 'POST',
      body: { name: newName.value.trim() },
    })
    contexts.value.push(ctx)
    newName.value = ''
    showNewForm.value = false
    expandedId.value = ctx.id
    toastSuccess(t('contexts.created'))
  } catch {
    toastError(t('contexts.errorCreate'))
  }
}

async function saveName(ctx: Context) {
  editingNameId.value = null
  const trimmed = editingNameValue.value.trim()
  if (!trimmed || trimmed === ctx.name) return
  try {
    const updated = await $fetch<Context>(`/api/contexts/${ctx.id}`, {
      method: 'PATCH',
      body: { name: trimmed },
    })
    const idx = contexts.value.findIndex(c => c.id === ctx.id)
    if (idx !== -1) contexts.value[idx] = { ...contexts.value[idx], ...updated }
  } catch {
    toastError(t('contexts.errorRename'))
  }
}

async function saveContent(ctx: Context) {
  try {
    await $fetch(`/api/contexts/${ctx.id}`, {
      method: 'PATCH',
      body: { content: ctx.content },
    })
    toastSuccess(t('contexts.saved'))
  } catch {
    toastError(t('contexts.errorSave'))
  }
}

async function deleteContext(ctx: Context) {
  if (!confirm(t('contexts.deleteConfirm', { name: ctx.name }))) return
  try {
    await $fetch(`/api/contexts/${ctx.id}`, { method: 'DELETE' })
    contexts.value = contexts.value.filter(c => c.id !== ctx.id)
    // Remove from active if present
    const idx = config.value.activeContextIds.indexOf(ctx.id)
    if (idx !== -1) {
      config.value.activeContextIds.splice(idx, 1)
    }
    // Remove from favorites if present
    const favIdx = (config.value.favoriteContextIds || []).indexOf(ctx.id)
    if (favIdx !== -1) {
      config.value.favoriteContextIds.splice(favIdx, 1)
    }
    if (idx !== -1 || favIdx !== -1) {
      saveConfig()
    }
  } catch {
    toastError(t('contexts.errorDelete'))
  }
}


function isProjectActive(id: number): boolean {
  return (config.value.activeProjectContextIds || []).includes(id)
}

function toggleProjectActive(id: number) {
  if (!config.value.activeProjectContextIds) config.value.activeProjectContextIds = []
  const idx = config.value.activeProjectContextIds.indexOf(id)
  if (idx === -1) config.value.activeProjectContextIds.push(id)
  else config.value.activeProjectContextIds.splice(idx, 1)
  saveConfig()
}

async function fetchProjectContexts() {
  try {
    projectContexts.value = await $fetch<ProjectContext[]>('/api/project-contexts')
  } catch {
    projectContexts.value = []
  }
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
    projectContexts.value.push({ ...result, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ProjectContext)
    toastSuccess(`Project "${result.name}" added`)
  } catch (err: any) {
    toastError(`Error: ${err.data?.message || err.message}`)
  }
}

async function deleteProjectContext(pc: ProjectContext) {
  if (!confirm(`Remove project "${pc.name}"?`)) return
  try {
    await $fetch(`/api/project-contexts/${pc.id}`, { method: 'DELETE' })
    projectContexts.value = projectContexts.value.filter(p => p.id !== pc.id)
    const idx = (config.value.activeProjectContextIds || []).indexOf(pc.id)
    if (idx !== -1) {
      config.value.activeProjectContextIds.splice(idx, 1)
      saveConfig()
    }
  } catch {
    toastError('Error removing project')
  }
}

onMounted(() => {
  loadConfig()
  fetchContexts()
  fetchProjectContexts()
})
</script>
