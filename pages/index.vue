<template>
  <div class="flex flex-col h-[calc(100dvh-3.5rem)]">

    <!-- Config banner -->
    <div
      v-if="!isConfigured"
      class="shrink-0 mx-4 mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm flex items-center gap-3"
    >
      <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <span>{{ t('index.configBanner') }}</span>
      <NuxtLink to="/config" class="ml-auto text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 underline text-sm whitespace-nowrap">
        {{ t('index.goToConfig') }}
      </NuxtLink>
    </div>

    <!-- Browser support warning -->
    <div
      v-if="!isSupported && config.sttEngine === 'browser'"
      class="shrink-0 mx-4 mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm flex items-center gap-3"
    >
      <span>{{ t('index.browserWarning') }}</span>
      <button
        class="ml-auto text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200 underline text-sm whitespace-nowrap"
        @click="config.sttEngine = 'groq'; saveConfig()"
      >
        {{ t('index.switchApi') }}
      </button>
    </div>

    <!-- Main content area -->
    <div class="flex flex-1 min-h-0">

      <!-- Chat area -->
      <div class="flex-1 flex flex-col min-w-0">

        <!-- Messages -->
        <div ref="chatContainer" class="flex-1 overflow-y-auto px-4 space-y-4 pt-3">

          <!-- Empty state -->
          <div v-if="messages.length === 0 && !isListening" class="flex flex-col items-center justify-center h-full text-center">
            <div class="relative mb-4">
              <button
                :disabled="!isSupported"
                class="relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-accent-600 hover:bg-accent-700 shadow-lg shadow-accent-500/20"
                @click="toggleRecording"
              >
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('index.tapToRecord') }}</p>
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-600">
              {{ config.sttEngine === 'groq' ? 'Groq Whisper' : 'Web Speech API' }}
            </p>

          </div>

          <!-- Listening bubble -->
          <div v-if="isListening" class="flex justify-start">
            <div class="max-w-[80%] sm:max-w-[70%]">
              <div class="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span class="text-gray-500 dark:text-gray-400">{{ t('index.listening') }}</span>
                </div>
                <p v-if="interimText" class="mt-2 italic text-gray-500 dark:text-gray-400">
                  {{ interimText }}
                </p>
              </div>
            </div>
          </div>

          <!-- Chat messages -->
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="flex"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div class="max-w-[85%] sm:max-w-[75%]">
              <div
                class="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                :class="msg.role === 'user' ? 'bg-accent-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'"
              >
                <div v-if="msg.generating && !msg.content" class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {{ t('index.generating') }}
                </div>

                <template v-if="msg.role === 'user'">
                  <p class="whitespace-pre-wrap">{{ msg.content }}</p>
                </template>

                <div
                  v-if="msg.role === 'system' && msg.content && purifyReady && !msg.error"
                  class="markdown-preview"
                  v-html="renderMarkdown(msg.content)"
                />
                <p
                  v-if="msg.role === 'system' && msg.content && (!purifyReady || msg.error)"
                  class="whitespace-pre-wrap"
                  :class="msg.error ? 'text-red-500 dark:text-red-400' : ''"
                >{{ msg.content }}</p>

                <div v-if="msg.role === 'system' && msg.generating && msg.content" class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                  <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {{ t('index.generating') }}
                </div>

                <div v-if="msg.role === 'system' && msg.toolsUsed?.length" class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div v-for="(tool, ti) in msg.toolsUsed" :key="ti" class="flex items-center gap-1.5 text-xs text-accent-500 dark:text-accent-400">
                    <v-icon :name="toolIcons[tool.name] || 'bi-search'" scale="0.7" />
                    <span>{{ toolLabels[tool.name] || tool.name }}</span>
                    <span v-if="tool.args?.path || tool.args?.query" class="text-gray-400 dark:text-gray-500 truncate max-w-[200px]">{{ tool.args.path || tool.args.query }}</span>
                  </div>
                </div>

                <div
                  v-if="msg.createdIssue"
                  class="mt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400"
                >
                  <span>&#10003;</span>
                  <a
                    :href="msg.createdIssue.url"
                    target="_blank"
                    rel="noopener"
                    class="font-medium hover:underline"
                  >
                    {{ msg.createdIssue.identifier }}
                  </a>
                  <span>{{ t('index.created') }}</span>
                </div>
              </div>

              <!-- Retry button under user message -->
              <div v-if="msg.role === 'user' && hasErrorAfter(i)" class="mt-1.5 flex justify-end">
                <button
                  class="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                  :disabled="isBusy"
                  @click="retryMessage(i)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {{ t('index.retry') }}
                </button>
              </div>

              <!-- Token usage + actions row -->
              <div v-if="msg.role === 'system' && msg.content && !msg.generating" class="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span class="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                  {{ msg.elapsed || '...' }}s
                </span>
                <span v-if="msg.usage" class="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                  {{ msg.usage.prompt }}↑ {{ msg.usage.completion }}↓ {{ msg.usage.total }} tokens
                </span>
                <div class="flex-1" />
                <SplitActionButton
                  :actions="sendActions"
                  :active-id="config.lastSendAction || 'linear'"
                  :disabled="sending"
                  :loading="sending"
                  drop-direction="up"
                  @execute="handleSendFromChat(i, $event)"
                  @update:active-id="updateLastSendAction"
                />
              </div>
            </div>
          </div>

          <!-- Summarizing indicator -->
          <div v-if="summarizing" class="flex justify-center">
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 text-xs text-accent-600 dark:text-accent-400">
              <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ t('index.summarizing') }}
            </div>
          </div>

          <div ref="scrollAnchor" />
        </div>

        <!-- Bottom input bar -->
        <div class="shrink-0 px-4 pb-3 pt-2">
          <div class="max-w-xl mx-auto flex items-end gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2 shadow-sm">
            <button
              :disabled="!isSupported"
              class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              :class="isListening ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-accent-600 hover:bg-accent-700 disabled:opacity-40 text-white'"
              @click="toggleRecording"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <textarea
              ref="inputRef"
              v-model="inputText"
              rows="1"
              class="flex-1 bg-transparent resize-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none max-h-32 py-1.5"
              :placeholder="t('index.chatPlaceholder')"
              @input="autoResize"
              @keydown="handleEnter"
            />
            <button
              class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              :class="inputText.trim() && !isBusy ? 'bg-accent-600 hover:bg-accent-700 text-white' : 'text-gray-300 dark:text-gray-600'"
              :disabled="!inputText.trim() || isBusy"
              @click="sendMessage"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Right sidebar (desktop only) -->
      <ChatSidebar
        v-if="showSidebar"
        :favorite-contexts="favoriteContexts"
        :active-context-ids="config.activeContextIds || []"
        :labels="linearLabels"
        :selected-label-ids="config.selectedLabelIds || []"
        :projects="linearProjects"
        :selected-project-id="config.selectedProjectId || ''"
        :project-contexts="projectContexts"
        :active-project-context-ids="config.activeProjectContextIds || []"
        @toggle-context="toggleContextActive"
        @toggle-label="toggleLabel"
        @toggle-project="toggleProject"
        @toggle-project-context="toggleProjectContextActive"
        @update:project-contexts="projectContexts = $event"
        @update:active-project-context-ids="config.activeProjectContextIds = $event; saveConfig()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

interface TokenUsage {
  prompt: number
  completion: number
  total: number
}

interface ChatMessage {
  role: 'user' | 'system'
  content: string
  generating?: boolean
  createdIssue?: { identifier: string; url: string }
  usage?: TokenUsage
  error?: boolean
  toolsUsed?: { name: string; args: Record<string, any> }[]
  elapsed?: string
}

const { config, isConfigured, loadConfig, saveConfig } = useConfig()
const { success: toastSuccess, error: toastError } = useToast()
const { t } = useI18n()

const lang = computed(() => config.value.language || 'es-ES')
const sttEngine = computed(() => config.value.sttEngine || 'browser')
const audioDeviceId = computed(() => config.value.audioDeviceId || '')
const browserSTT = useSpeechToText(lang)
const apiSTT = useGroqSpeechToText(lang, sttEngine, audioDeviceId)

const stt = computed(() => config.value.sttEngine === 'browser' ? browserSTT : apiSTT)
const transcript = computed(() => stt.value.transcript.value)
const interimText = computed(() => stt.value.interimText.value)
const isListening = computed(() => stt.value.isListening.value)
const isSupported = computed(() => stt.value.isSupported.value)

function start() { stt.value.start() }
function stop() { stt.value.stop() }
function reset() { stt.value.reset() }

const linearLabels = ref<import('~/types').LinearLabel[]>([])
const linearProjects = ref<import('~/types').LinearProject[]>([])

const projectContexts = ref<import('~/types').ProjectContext[]>([])

async function fetchLinearMeta() {
  const teamId = config.value.teamId
  if (!teamId) {
    linearLabels.value = []
    linearProjects.value = []
    return
  }
  try {
    const [labels, projects] = await Promise.all([
      $fetch<import('~/types').LinearLabel[]>('/api/linear/labels', { params: { teamId } }),
      $fetch<import('~/types').LinearProject[]>('/api/linear/projects', { params: { teamId } }),
    ])
    linearLabels.value = labels
    linearProjects.value = projects
  } catch {
    linearLabels.value = []
    linearProjects.value = []
  }
}

async function fetchProjectContexts() {
  if (config.value.llmEngine === undefined) return
  try {
    projectContexts.value = await $fetch<import('~/types').ProjectContext[]>('/api/project-contexts')
  } catch {
    projectContexts.value = []
  }
}

function toggleProjectContextActive(id: number) {
  if (!config.value.activeProjectContextIds) config.value.activeProjectContextIds = []
  const idx = config.value.activeProjectContextIds.indexOf(id)
  if (idx === -1) config.value.activeProjectContextIds.push(id)
  else config.value.activeProjectContextIds.splice(idx, 1)
  saveConfig()
}

function toggleLabel(id: string) {
  if (!config.value.selectedLabelIds) config.value.selectedLabelIds = []
  const idx = config.value.selectedLabelIds.indexOf(id)
  if (idx === -1) config.value.selectedLabelIds.push(id)
  else config.value.selectedLabelIds.splice(idx, 1)
  saveConfig()
}

function toggleProject(id: string) {
  config.value.selectedProjectId = config.value.selectedProjectId === id ? '' : id
  saveConfig()
}

const allContexts = ref<{ id: number; name: string }[]>([])

const favoriteContexts = computed(() => {
  const favIds = config.value.favoriteContextIds || []
  if (!favIds.length) return []
  return allContexts.value.filter(c => favIds.includes(c.id))
})

function toggleContextActive(id: number) {
  if (!config.value.activeContextIds) {
    config.value.activeContextIds = []
  }
  const idx = config.value.activeContextIds.indexOf(id)
  if (idx === -1) {
    config.value.activeContextIds.push(id)
  } else {
    config.value.activeContextIds.splice(idx, 1)
  }
  saveConfig()
}

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const sending = ref(false)

const sendActions = computed(() => {
  const actions = [
    { id: 'linear', icon: 'bi-arrow-up-right', label: 'Linear' },
    { id: 'copy', icon: 'bi-clipboard', label: 'Copy' },
  ]
  if (isDesktop.value) {
    actions.push({ id: 'terminal', icon: 'bi-terminal', label: 'Terminal' })
  }
  return actions
})

function updateLastSendAction(id: string) {
  config.value.lastSendAction = id
  saveConfig()
}
const generatingPlan = ref(false)
const summarizing = ref(false)
const conversationSummary = ref('')
const conversationId = ref<number | null>(null)
const chatContainer = ref<HTMLElement | null>(null)
const scrollAnchor = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const showSidebar = ref(true)
const runtimeConfig = useRuntimeConfig()
const isDesktop = computed(() => runtimeConfig.public.desktopMode === true)

const isBusy = computed(() => generatingPlan.value)

const purify = ref<{ sanitize: (html: string) => string } | null>(null)
const purifyReady = ref(false)
if (import.meta.client) {
  import('dompurify').then(m => {
    purify.value = m.default
    purifyReady.value = true
  })
}

const toolIcons: Record<string, string> = { list_files: 'bi-folder', read_file: 'bi-file-earmark-code', git_log: 'bi-git', git_diff: 'bi-code-slash', git_branch: 'bi-git', search_files: 'bi-search' }
const toolLabels: Record<string, string> = { list_files: 'Listing files', read_file: 'Reading file', git_log: 'Git log', git_diff: 'Git diff', git_branch: 'Git branch', search_files: 'Searching' }

function renderMarkdown(text: string): string {
  if (!text) return ''
  const html = marked.parse(text) as string
  return purify.value ? purify.value.sanitize(html) : html
}

function scrollToBottom() {
  nextTick(() => {
    scrollAnchor.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

const pendingVoiceInput = ref(false)

function toggleRecording() {
  if (isListening.value) {
    stop()
    pendingVoiceInput.value = true
    nextTick(() => {
      const text = transcript.value?.trim()
      if (text) {
        inputText.value = text
        autoResize()
        pendingVoiceInput.value = false
        reset()
      }
    })
  } else {
    start()
  }
}

function autoResize() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 128) + 'px'
}

watch(transcript, (val) => {
  if (val && isListening.value) {
    inputText.value = val
    autoResize()
  } else if (val && pendingVoiceInput.value) {
    inputText.value = val
    autoResize()
    pendingVoiceInput.value = false
    nextTick(() => reset())
  }
})

watch(() => messages.value.length, () => {
  scrollToBottom()
})

watch(() => config.value.teamId, (newTeamId, oldTeamId) => {
  if (newTeamId !== oldTeamId) {
    config.value.selectedLabelIds = []
    config.value.selectedProjectId = ''
    saveConfig()
    fetchLinearMeta()
  }
})

onMounted(async () => {
  loadConfig()
  fetchLinearMeta()
  fetchProjectContexts()

  try {
    allContexts.value = await $fetch<{ id: number; name: string }[]>('/api/contexts')
  } catch {}

  const recoverEntry = useState<import('~/types').Entry | null>('recover-entry', () => null)
  if (recoverEntry.value) {
    inputText.value = recoverEntry.value.text
    conversationSummary.value = recoverEntry.value.conversation_summary || ''
    recoverEntry.value = null
    nextTick(() => autoResize())
  }

  const recoverConversation = useState<{ id: number; messages: any[]; conversation_summary: string } | null>('recover-conversation', () => null)
  if (recoverConversation.value) {
    const conv = recoverConversation.value
    conversationId.value = conv.id
    conversationSummary.value = conv.conversation_summary || ''
    for (const m of conv.messages) {
      messages.value.push({ role: m.role, content: m.content })
    }
    recoverConversation.value = null
    scrollToBottom()
  }

  if (import.meta.client && 'Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission()
  }

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const tag = (document.activeElement as HTMLElement)?.tagName
    if (e.code === 'Space' && tag !== 'TEXTAREA' && tag !== 'INPUT') {
      e.preventDefault()
      toggleRecording()
    }
  })
})

function addUserMessage(text: string) {
  messages.value.push({ role: 'user', content: text })
  scrollToBottom()
}

function handleEnter(e: KeyboardEvent) {
  if (e.key !== 'Enter') return
  if (e.shiftKey) return
  e.preventDefault()
  sendMessage()
}

function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isBusy.value) return

  addUserMessage(text)
  inputText.value = ''
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }
  generatePlanForMessage(text)
}

function hasErrorAfter(userIndex: number): boolean {
  const next = messages.value[userIndex + 1]
  return !!next?.error
}

function retryMessage(userIndex: number) {
  const userMsg = messages.value[userIndex]
  if (!userMsg || userMsg.role !== 'user' || isBusy.value) return

  const next = messages.value[userIndex + 1]
  if (next?.error) {
    messages.value.splice(userIndex + 1, 1)
  }

  generatePlanForMessage(userMsg.content)
}

function getLLMBody(text: string) {
  return {
    text,
    language: config.value.language?.split('-')[0] || 'es',
    engine: config.value.llmEngine || 'groq',
    model: config.value.llmEngine === 'zai'
      ? (config.value.zaiModel || 'glm-5.1')
      : config.value.llmEngine === 'minimax'
        ? (config.value.minimaxModel || 'MiniMax-M2.7')
        : (config.value.groqModel || 'openai/gpt-oss-120b'),
    contextIds: config.value.activeContextIds || [],
    customPrompt: config.value.customPrompt || undefined,
    conversationSummary: conversationSummary.value || undefined,
    projectContextIds: config.value.activeProjectContextIds || [],
  }
}

async function saveConversation() {
  if (messages.value.length === 0) return

  const title = messages.value.find(m => m.role === 'user')?.content?.slice(0, 100) || 'Untitled'
  const msgs = messages.value.map(m => ({ role: m.role, content: m.content }))

  try {
    if (conversationId.value) {
      await $fetch(`/api/conversations/${conversationId.value}`, {
        method: 'PATCH',
        body: {
          title,
          messages: msgs,
          conversation_summary: conversationSummary.value,
          status: 'draft',
        },
      })
    } else {
      const result = await $fetch<{ id: number }>('/api/conversations', {
        method: 'POST',
        body: {
          title,
          messages: msgs,
          conversation_summary: conversationSummary.value,
          project_context_ids: config.value.activeProjectContextIds || [],
          context_ids: config.value.activeContextIds || [],
        },
      })
      conversationId.value = result.id
    }
  } catch (err: any) {
    console.error('Failed to save conversation:', err)
  }
}

async function summarizeConversation() {
  if (messages.value.length === 0) return

  summarizing.value = true
  scrollToBottom()

  try {
    const result = await $fetch<{ summary: string }>('/api/ai/summarize', {
      method: 'POST',
      body: {
        messages: messages.value.map(m => ({ role: m.role, content: m.content })),
        existingSummary: conversationSummary.value,
        engine: config.value.llmEngine || 'groq',
        model: config.value.llmEngine === 'zai'
          ? (config.value.zaiModel || 'glm-5.1')
          : config.value.llmEngine === 'minimax'
            ? (config.value.minimaxModel || 'MiniMax-M2.7')
            : (config.value.groqModel || 'openai/gpt-oss-120b'),
      },
    })
    if (result.summary) {
      conversationSummary.value = result.summary
    }
  } catch (err: any) {
    console.error('Summarization failed:', err)
  } finally {
    summarizing.value = false
  }
}

async function streamPlan(text: string, msgIndex: number) {
  generatingPlan.value = true
  let receivedChunks = false
  const startTime = Date.now()

  const getMsg = () => messages.value[msgIndex]
  if (!getMsg()) return

  try {
    const response = await fetch('/api/ai/action-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getLLMBody(text)),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.message || 'Request failed')
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''
    const READ_TIMEOUT = 90_000
    let lastChunkTime = Date.now()

    while (true) {
      const readPromise = reader.read()
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Stream timed out')), READ_TIMEOUT - (Date.now() - lastChunkTime))
      )
      const { done, value } = await Promise.race([readPromise, timeoutPromise])
      lastChunkTime = Date.now()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''

      for (const part of parts) {
        if (!part.startsWith('data: ')) continue
        const data = part.slice(6)
        if (data === '[DONE]') continue
        try {
          const json = JSON.parse(data)
          if (json.chunk && getMsg()) {
            receivedChunks = true
            getMsg()!.content += json.chunk
          } else if (json.usage && getMsg()) {
            getMsg()!.usage = json.usage
          } else if (json.tool && getMsg()) {
            if (!getMsg()?.toolsUsed) getMsg()!.toolsUsed = []
            getMsg()!.toolsUsed!.push(json.tool)
            receivedChunks = true
            const toolNames = { list_files: 'Listing files', read_file: 'Reading file', git_log: 'Checking git log', git_diff: 'Checking changes', git_branch: 'Checking branch', search_files: 'Searching code' }
          } else if (json.error && getMsg()) {
            getMsg()!.content = json.error
            getMsg()!.error = true
          }
        } catch {}
      }
    }

    if (buffer.trim().startsWith('data: ')) {
      const data = buffer.trim().slice(6)
      if (data !== '[DONE]') {
        try {
          const json = JSON.parse(data)
          if (json.chunk && getMsg()) {
            receivedChunks = true
            getMsg()!.content += json.chunk
          } else if (json.usage && getMsg()) {
            getMsg()!.usage = json.usage
          }
        } catch {}
      }
    }

    if (!receivedChunks && getMsg() && !getMsg()?.error) {
      getMsg()!.content = t('index.errorPlan')
      getMsg()!.error = true
    }
  } catch (err: any) {
    if (getMsg()) {
      getMsg()!.content = `${t('index.errorPlan')}: ${err.message || 'Unknown'}`
      getMsg()!.error = true
    }
  } finally {
    if (getMsg()) {
      getMsg()!.generating = false
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      getMsg()!.elapsed = elapsed
    }
    generatingPlan.value = false
    scrollToBottom()

    if (!messages.value[msgIndex]?.error) {
      summarizeConversation().catch(() => {})
    }
    saveConversation().catch(() => {})

    if (!document.hasFocus()) {
      const isError = messages.value[msgIndex]?.error
      const body = isError ? 'Error generating response' : 'Response ready'
      const electron = (window as any).__electron
      if (electron?.notify) {
        electron.notify('Voice to Task', body)
      } else if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const notif = new Notification('Voice to Task', { body })
          notif.onclick = () => { window.focus(); notif.close() }
        } catch {}
      }
    }
  }
}

async function generatePlanForMessage(text: string) {
  const sysMsg: ChatMessage = { role: 'system', content: '', generating: true }
  messages.value.push(sysMsg)
  scrollToBottom()
  await streamPlan(text, messages.value.length - 1)
}


async function handleSendFromChat(msgIndex: number, actionId: string) {
  const msg = messages.value[msgIndex]
  if (!msg?.content) return

  if (actionId === 'copy') {
    try {
      await navigator.clipboard.writeText(msg.content)
      toastSuccess(t('index.copied'))
      saveConversation().catch(() => {})
    } catch {
      toastError('Clipboard error')
    }
    return
  }

  if (actionId === 'terminal') {
    sending.value = true
    try {
      const electron = (window as any).__electron
      if (!electron?.launchTerminalAgent) {
        toastError('Terminal agent only available in desktop app')
        return
      }
      const result = await electron.launchTerminalAgent({
        planText: msg.content,
        agent: config.value.terminalAgent || 'opencode',
        cwd: config.value.projectPath || '',
        terminalApp: config.value.terminalApp || 'terminal',
        terminalPath: config.value.terminalPath || '',
      })
      if (result.success) {
        toastSuccess('Terminal agent launched')
      } else {
        toastError(`Terminal error: ${result.error}`)
      }
    } catch (err: any) {
      toastError(`Terminal error: ${err.message}`)
    } finally {
      sending.value = false
    }
    return
  }

  if (actionId === 'linear') {
    sending.value = true
    try {
      const entry = await $fetch('/api/entries', {
        method: 'POST',
        body: { text: msg.content, conversation_summary: conversationSummary.value },
      })

      const lines = msg.content.split('\n')
      const title = (lines[0] || '').slice(0, 200)
      const description = lines.slice(1).join('\n').trim() || undefined

      const issueBody: Record<string, any> = {
        title,
        description,
        teamId: config.value.teamId,
        assigneeId: config.value.assigneeId,
      }
      if (config.value.selectedLabelIds?.length) {
        issueBody.labelIds = config.value.selectedLabelIds
      }
      if (config.value.selectedProjectId) {
        issueBody.projectId = config.value.selectedProjectId
      }

      const result = await $fetch('/api/linear/create-issue', { method: 'POST', body: issueBody })

      await $fetch(`/api/entries/${(entry as any).id}`, {
        method: 'PATCH',
        body: {
          linear_issue_id: result.issue.id,
          linear_issue_key: result.issue.identifier,
          linear_issue_url: result.issue.url,
          status: 'sent',
        },
      })

      msg.createdIssue = { identifier: result.issue.identifier, url: result.issue.url }

      toastSuccess(`${result.issue.identifier} ${t('index.created')}`, {
        url: result.issue.url,
        label: t('index.openLinear'),
      })
    } catch (err: any) {
      toastError(`${t('index.errorCreate')}: ${err.data?.message || err.message || 'Unknown'}`)
    } finally {
      sending.value = false
    }
  }
}

onBeforeRouteLeave(() => {})
</script>
