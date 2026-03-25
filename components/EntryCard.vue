<template>
  <div class="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
    <div class="flex items-start gap-3">
      <div class="flex-1 min-w-0">
        <p class="text-gray-200 line-clamp-2 text-sm leading-relaxed">{{ entry.text }}</p>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-xs text-gray-500">{{ formatDate(entry.created_at) }}</span>
          <span
            :class="[
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
              entry.status === 'sent'
                ? 'bg-green-950 text-green-300 border border-green-800'
                : 'bg-gray-800 text-gray-400 border border-gray-700',
            ]"
          >
            {{ entry.status === 'sent' ? 'Enviado' : 'Borrador' }}
          </span>
          <a
            v-if="entry.status === 'sent' && entry.linear_issue_url"
            :href="entry.linear_issue_url"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 transition-colors"
          >
            {{ entry.linear_issue_key }}
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button
          v-if="entry.status === 'draft'"
          class="p-2 text-gray-500 hover:text-indigo-400 hover:bg-gray-800 rounded transition-colors"
          title="Reintentar envio"
          @click="$emit('retry', entry)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          class="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
          title="Eliminar"
          @click="$emit('delete', entry)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Entry } from '~/types'

defineProps<{ entry: Entry }>()
defineEmits<{
  delete: [entry: Entry]
  retry: [entry: Entry]
}>()

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `hace ${diffHours}h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} dias`

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
</script>
