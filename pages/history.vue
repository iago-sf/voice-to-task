<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Historial</h1>
      <span v-if="entries.length" class="text-sm text-gray-500">
        {{ entries.length }} entries ({{ sentCount }} enviadas)
      </span>
    </div>

    <!-- Filter -->
    <div class="flex gap-2 mb-6">
      <button
        v-for="f in filters"
        :key="f.value"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        :class="filter === f.value
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:text-gray-300'"
        @click="filter = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-gray-500">
      Cargando...
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredEntries.length === 0" class="text-center py-12">
      <svg class="w-12 h-12 mx-auto text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <p class="text-gray-500 text-sm">No hay entries todavia</p>
      <NuxtLink to="/" class="inline-block mt-3 text-indigo-400 hover:text-indigo-300 text-sm underline">
        Crear primera entry
      </NuxtLink>
    </div>

    <!-- Entry list -->
    <div v-else class="flex flex-col gap-3">
      <EntryCard
        v-for="entry in filteredEntries"
        :key="entry.id"
        :entry="entry"
        @delete="handleDelete"
        @retry="handleRetry"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Entry } from '~/types'

const { config, loadConfig, isConfigured } = useConfig()
const { success: toastSuccess, error: toastError } = useToast()

const entries = ref<Entry[]>([])
const loading = ref(true)
const filter = ref<'all' | 'draft' | 'sent'>('all')

const filters = [
  { label: 'Todos', value: 'all' as const },
  { label: 'Borradores', value: 'draft' as const },
  { label: 'Enviados', value: 'sent' as const },
]

const filteredEntries = computed(() => {
  if (filter.value === 'all') return entries.value
  return entries.value.filter(e => e.status === filter.value)
})

const sentCount = computed(() => entries.value.filter(e => e.status === 'sent').length)

async function fetchEntries() {
  loading.value = true
  try {
    entries.value = await $fetch<Entry[]>('/api/entries')
  } catch {
    toastError('Error al cargar el historial')
  } finally {
    loading.value = false
  }
}

async function handleDelete(entry: Entry) {
  if (!confirm('¿Eliminar esta entry?')) return
  try {
    await $fetch(`/api/entries/${entry.id}`, { method: 'DELETE' })
    entries.value = entries.value.filter(e => e.id !== entry.id)
  } catch {
    toastError('Error al eliminar')
  }
}

async function handleRetry(entry: Entry) {
  if (!isConfigured.value) {
    toastError('Configura tu equipo de Linear primero')
    return
  }

  try {
    const lines = entry.text.split('\n')
    const title = lines[0].slice(0, 200)
    const description = lines.slice(1).join('\n').trim() || undefined

    const result = await $fetch('/api/linear/create-issue', {
      method: 'POST',
      body: {
        title,
        description,
        teamId: config.value.teamId,
        assigneeId: config.value.assigneeId,
      },
    })

    const updated = await $fetch<Entry>(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      body: {
        linear_issue_id: result.issue.id,
        linear_issue_key: result.issue.identifier,
        linear_issue_url: result.issue.url,
        status: 'sent',
      },
    })

    const idx = entries.value.findIndex(e => e.id === entry.id)
    if (idx !== -1) entries.value[idx] = updated

    toastSuccess(`${result.issue.identifier} creada`, {
      url: result.issue.url,
      label: 'Abrir en Linear',
    })
  } catch (err: any) {
    toastError(`Error: ${err.data?.message || err.message || 'Error desconocido'}`)
  }
}

onMounted(() => {
  loadConfig()
  fetchEntries()
})
</script>
