<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ t('contexts.title') }}</h1>
      <button
        class="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        @click="showNewForm = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ t('contexts.new') }}
      </button>
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
        class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500 placeholder-gray-400 dark:placeholder-gray-600 mb-3"
        @keydown.enter="createContext"
      />
      <div class="flex gap-2">
        <button
          class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
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
        :class="isActive(ctx.id) ? 'border-indigo-400 dark:border-indigo-700' : 'border-gray-200 dark:border-gray-800'"
      >
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3">
          <!-- Active toggle -->
          <button
            class="relative w-9 h-5 rounded-full transition-colors shrink-0"
            :class="isActive(ctx.id) ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'"
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
              v-model="editingNameValue"
              type="text"
              class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500"
              @keydown.enter="saveName(ctx)"
              @keydown.escape="editingNameId = null"
            />
          </div>
          <button
            v-else
            class="flex-1 text-left text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white truncate"
            @click="editingNameId = ctx.id; editingNameValue = ctx.name"
          >
            {{ ctx.name }}
          </button>

          <span
            v-if="isActive(ctx.id)"
            class="text-xs px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded shrink-0"
          >
            {{ t('contexts.active') }}
          </span>

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
            class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500 resize-y font-mono leading-relaxed placeholder-gray-400 dark:placeholder-gray-600"
            :placeholder="t('contexts.editorPlaceholder')"
            @blur="saveContent(ctx)"
          />
          <div class="flex items-center justify-between mt-2">
            <span class="text-xs text-gray-400 dark:text-gray-600">{{ ctx.content.length }} {{ t('index.chars') }}</span>
            <button
              class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs transition-colors"
              @click="saveContent(ctx)"
            >
              {{ t('contexts.save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Context } from '~/types'

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
  if (!editingNameValue.value.trim()) return
  try {
    const updated = await $fetch<Context>(`/api/contexts/${ctx.id}`, {
      method: 'PATCH',
      body: { name: editingNameValue.value.trim() },
    })
    const idx = contexts.value.findIndex(c => c.id === ctx.id)
    if (idx !== -1) contexts.value[idx] = { ...contexts.value[idx], ...updated }
    editingNameId.value = null
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
      saveConfig()
    }
  } catch {
    toastError(t('contexts.errorDelete'))
  }
}

onMounted(() => {
  loadConfig()
  fetchContexts()
})
</script>
