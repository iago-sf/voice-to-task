<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ t('history.title') }}</h1>
      <span v-if="entries.length" class="text-sm text-gray-500">
        {{ entries.length }} {{ t('history.entries') }} ({{ sentCount }} {{ t('history.sent') }})
      </span>
    </div>

    <div class="flex gap-2 mb-3">
      <button
        v-for="f in filters"
        :key="f.value"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        :class="filter === f.value
          ? 'bg-accent-600 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'"
        @click="filter = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <div class="flex gap-2 mb-6">
      <button
        v-for="f in taskStatusFilters"
        :key="f.value"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        :class="taskStatusFilter === f.value
          ? 'bg-accent-600 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'"
        @click="taskStatusFilter = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">{{ t('history.loading') }}</div>

    <div v-else-if="filteredEntries.length === 0" class="text-center py-12">
      <svg class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <p class="text-gray-500 text-sm">{{ t('history.empty') }}</p>
      <NuxtLink to="/" class="inline-block mt-3 text-accent-500 dark:text-accent-400 hover:text-accent-600 dark:hover:text-accent-300 text-sm underline">
        {{ t('history.createFirst') }}
      </NuxtLink>
    </div>

    <div v-else class="flex flex-col gap-3">
      <EntryCard
        v-for="entry in filteredEntries"
        :key="entry.id"
        :entry="entry"
        @delete="handleDelete"
        @retry="handleRetry"
        @edit="handleEdit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Entry } from '~/types'

const { config, loadConfig, isConfigured } = useConfig()
const { success: toastSuccess, error: toastError } = useToast()
const { t } = useI18n()

const entries = ref<Entry[]>([])
const loading = ref(true)
const filter = ref<'all' | 'draft' | 'sent'>('all')
const taskStatusFilter = ref<'all' | 'TRIAGE' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('all')

const filters = computed(() => [
  { label: t('history.all'), value: 'all' as const },
  { label: t('history.drafts'), value: 'draft' as const },
  { label: t('history.sentFilter'), value: 'sent' as const },
])

const taskStatusFilters = computed(() => [
  { label: t('history.taskStatusAll'), value: 'all' as const },
  { label: t('taskStatus.TRIAGE'), value: 'TRIAGE' as const },
  { label: t('taskStatus.TODO'), value: 'TODO' as const },
  { label: t('taskStatus.IN_PROGRESS'), value: 'IN_PROGRESS' as const },
  { label: t('taskStatus.DONE'), value: 'DONE' as const },
])

const filteredEntries = computed(() => {
  let result = entries.value
  if (filter.value !== 'all') {
    result = result.filter(e => e.status === filter.value)
  }
  if (taskStatusFilter.value !== 'all') {
    result = result.filter(e => e.task_status === taskStatusFilter.value)
  }
  return result
})

const sentCount = computed(() => entries.value.filter(e => e.status === 'sent').length)

async function fetchEntries() {
  loading.value = true
  try {
    entries.value = await $fetch<Entry[]>('/api/entries')
  } catch {
    toastError(t('history.errorLoad'))
  } finally {
    loading.value = false
  }
}

async function handleDelete(entry: Entry) {
  if (!confirm(t('history.deleteConfirm'))) return
  try {
    await $fetch(`/api/entries/${entry.id}`, { method: 'DELETE' })
    entries.value = entries.value.filter(e => e.id !== entry.id)
  } catch {
    toastError(t('history.errorDelete'))
  }
}

function handleEdit(entry: Entry) {
  useState<Entry | null>('recover-entry', () => null).value = entry
  navigateTo('/')
}

async function handleRetry(entry: Entry) {
  if (!isConfigured.value) {
    toastError(t('history.configFirst'))
    return
  }

  try {
    const lines = entry.text.split('\n')
    const title = lines[0].slice(0, 200)
    const description = lines.slice(1).join('\n').trim() || undefined

    const result = await $fetch('/api/linear/create-issue', {
      method: 'POST',
      body: { title, description, teamId: config.value.teamId, assigneeId: config.value.assigneeId },
    })

    const updated = await $fetch<Entry>(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      body: { linear_issue_id: result.issue.id, linear_issue_key: result.issue.identifier, linear_issue_url: result.issue.url, status: 'sent' },
    })

    const idx = entries.value.findIndex(e => e.id === entry.id)
    if (idx !== -1) entries.value[idx] = updated

    toastSuccess(`${result.issue.identifier} ${t('index.created')}`, { url: result.issue.url, label: t('index.openLinear') })
  } catch (err: any) {
    toastError(`${t('history.errorRetry')}: ${err.data?.message || err.message || 'Unknown'}`)
  }
}

onMounted(() => {
  loadConfig()
  fetchEntries()
})
</script>
