<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">History</h1>
      <span v-if="conversations.length" class="text-sm text-gray-500">
        {{ conversations.length }} conversations
      </span>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">Loading...</div>

    <div v-else-if="conversations.length === 0" class="text-center py-12">
      <svg class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <p class="text-gray-500 text-sm">No conversations yet</p>
      <NuxtLink to="/" class="inline-block mt-3 text-accent-500 dark:text-accent-400 hover:text-accent-600 dark:hover:text-accent-300 text-sm underline">
        Start a new conversation
      </NuxtLink>
    </div>

    <div v-else class="flex flex-col gap-3">
      <div
        v-for="conv in conversations"
        :key="conv.id"
        class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
      >
        <div class="flex items-center gap-3 px-4 py-3">
          <div class="flex-1 min-w-0 cursor-pointer" @click="openConversation(conv)">
            <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ conv.title || 'Untitled' }}</p>
            <div class="flex items-center gap-3 mt-1">
              <span class="text-xs text-gray-400 dark:text-gray-600">{{ formatDate(conv.updated_at) }}</span>
              <span v-if="conv.linear_issue_key" class="text-xs px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded">
                {{ conv.linear_issue_key }}
              </span>
              <span
                class="text-xs px-1.5 py-0.5 rounded"
                :class="conv.status === 'sent' ? 'bg-accent-50 dark:bg-accent-950 text-accent-600 dark:text-accent-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'"
              >
                {{ conv.status }}
              </span>
            </div>
          </div>
          <button
            class="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
            title="Delete"
            @click.stop="deleteConversation(conv)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { success: toastSuccess, error: toastError } = useToast()

interface ConversationSummary {
  id: number
  title: string
  status: string
  conversation_summary: string
  linear_issue_key: string | null
  linear_issue_url: string | null
  created_at: string
  updated_at: string
}

const conversations = ref<ConversationSummary[]>([])
const loading = ref(true)

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'Z')
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

async function fetchConversations() {
  loading.value = true
  try {
    conversations.value = await $fetch<ConversationSummary[]>('/api/conversations')
  } catch {
    toastError('Error loading conversations')
  } finally {
    loading.value = false
  }
}

async function openConversation(conv: ConversationSummary) {
  try {
    const full = await $fetch<any>(`/api/conversations/${conv.id}`)
    const state = useState<{ id: number; messages: any[]; conversation_summary: string } | null>('recover-conversation', () => null)
    state.value = {
      id: full.id,
      messages: full.messages,
      conversation_summary: full.conversation_summary || '',
    }
    navigateTo('/')
  } catch {
    toastError('Error opening conversation')
  }
}

async function deleteConversation(conv: ConversationSummary) {
  if (!confirm(`Delete "${conv.title || 'Untitled'}"?`)) return
  try {
    await $fetch(`/api/conversations/${conv.id}`, { method: 'DELETE' })
    conversations.value = conversations.value.filter(c => c.id !== conv.id)
  } catch {
    toastError('Error deleting')
  }
}

onMounted(() => {
  fetchConversations()
})
</script>
