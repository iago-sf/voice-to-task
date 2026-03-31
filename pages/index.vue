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
            <div class="mt-4 flex items-center gap-3">
              <button
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors border"
                :class="config.autoMode ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'"
                @click="config.autoMode = !config.autoMode; saveConfig()"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {{ config.autoMode ? t('index.autoModeOn') : t('index.autoMode') }}
              </button>
            </div>
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

                <div v-if="msg.autoStep" class="flex items-center gap-2 text-accent-600 dark:text-accent-400 mb-2 text-xs">
                  <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {{ msg.autoStep }}
                </div>

                <template v-if="msg.role === 'user'">
                  <p class="whitespace-pre-wrap">{{ msg.content }}</p>
                </template>

                <div
                  v-if="msg.role === 'system' && msg.content && purifyReady"
                  class="markdown-preview"
                  v-html="renderMarkdown(msg.content)"
                />
                <p
                  v-if="msg.role === 'system' && msg.content && !purifyReady"
                  class="whitespace-pre-wrap"
                >{{ msg.content }}</p>

                <div v-if="msg.role === 'system' && msg.generating && msg.content" class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                  <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {{ t('index.generating') }}
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

              <div v-if="msg.role === 'system' && msg.content && !msg.generating" class="mt-1.5 flex items-center gap-1.5 flex-wrap">
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
              :class="inputText.trim() ? 'bg-accent-600 hover:bg-accent-700 text-white' : 'text-gray-300 dark:text-gray-600'"
              :disabled="!inputText.trim()"
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
        :auto-mode="config.autoMode"
        :favorite-contexts="favoriteContexts"
        :active-context-ids="config.activeContextIds || []"
        :labels="linearLabels"
        :selected-label-ids="config.selectedLabelIds || []"
        :projects="linearProjects"
        :selected-project-id="config.selectedProjectId || ''"
        @toggle-auto="config.autoMode = !config.autoMode; saveConfig()"
        @toggle-context="toggleContextActive"
        @toggle-label="toggleLabel"
        @toggle-project="toggleProject"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

interface ChatMessage {
  role: 'user' | 'system'
  content: string
  generating?: boolean
  autoStep?: string
  createdIssue?: { identifier: string; url: string }
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
const generatingPlan = ref(false)
const chatContainer = ref<HTMLElement | null>(null)
const scrollAnchor = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const showSidebar = ref(true)

const purify = ref<{ sanitize: (html: string) => string } | null>(null)
const purifyReady = ref(false)
if (import.meta.client) {
  import('dompurify').then(m => {
    purify.value = m.default
    purifyReady.value = true
  })
}

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

  try {
    allContexts.value = await $fetch<{ id: number; name: string }[]>('/api/contexts')
  } catch {}

  const recoverEntry = useState<import('~/types').Entry | null>('recover-entry', () => null)
  if (recoverEntry.value) {
    inputText.value = recoverEntry.value.text
    recoverEntry.value = null
    nextTick(() => autoResize())
  }

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const tag = (document.activeElement as HTMLElement)?.tagName
    if (e.code === 'Space' && tag !== 'TEXTAREA' && tag !== 'INPUT') {
      e.preventDefault()
      toggleRecording()
    }
  })
})

function toggleRecording() {
  if (isListening.value) {
    stop()
    const text = inputText.value.trim()
    if (text) {
      addUserMessage(text)
      if (config.value.autoMode && isConfigured.value) {
        runAutoFlow()
      }
    }
    reset()
  } else {
    start()
  }
}

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
  if (!text) return

  addUserMessage(text)
  inputText.value = ''
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }
  generatePlanForMessage(text)
}

function getLLMBody(text: string) {
  return {
    text,
    language: config.value.language?.split('-')[0] || 'es',
    engine: config.value.llmEngine || 'groq',
    model: config.value.llmEngine === 'zai'
      ? (config.value.zaiModel || 'glm-4-plus')
      : config.value.llmEngine === 'minimax'
        ? (config.value.minimaxModel || 'MiniMax-M2.7')
        : (config.value.groqModel || 'openai/gpt-oss-120b'),
    contextIds: config.value.activeContextIds || [],
    customPrompt: config.value.customPrompt || undefined,
  }
}

async function streamPlan(text: string, msgIndex: number) {
  generatingPlan.value = true
  let receivedChunks = false

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

    while (true) {
      const { done, value } = await reader.read()
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
          if (json.chunk) {
            receivedChunks = true
            messages.value[msgIndex].content += json.chunk
          } else if (json.error) {
            toastError(`${t('index.errorPlan')}: ${json.error}`)
          }
        } catch {}
      }
    }

    if (buffer.trim().startsWith('data: ')) {
      const data = buffer.trim().slice(6)
      if (data !== '[DONE]') {
        try {
          const json = JSON.parse(data)
          if (json.chunk) {
            receivedChunks = true
            messages.value[msgIndex].content += json.chunk
          }
        } catch {}
      }
    }

    if (!receivedChunks) {
      messages.value[msgIndex].content = t('index.errorPlan')
    }
  } catch (err: any) {
    messages.value[msgIndex].content = `${t('index.errorPlan')}: ${err.message || 'Unknown'}`
  } finally {
    messages.value[msgIndex].generating = false
    generatingPlan.value = false
    scrollToBottom()
  }
}

async function generatePlanForMessage(text: string) {
  const sysMsg: ChatMessage = { role: 'system', content: '', generating: true }
  messages.value.push(sysMsg)
  scrollToBottom()
  await streamPlan(text, messages.value.length - 1)
}

async function runAutoFlow() {
  await new Promise(resolve => setTimeout(resolve, 100))

  const userMsgs = messages.value.filter(m => m.role === 'user')
  const lastUserMsg = userMsgs[userMsgs.length - 1]
  if (!lastUserMsg) return

  const autoMsg: ChatMessage = { role: 'system', content: '', generating: true, autoStep: t('index.generatingPlan') }
  messages.value.push(autoMsg)
  scrollToBottom()

  const autoMsgIndex = messages.value.length - 1
  await streamPlan(lastUserMsg.content, autoMsgIndex)

  messages.value[autoMsgIndex].autoStep = t('index.sendingLinear')
  await handleSendFromChat(autoMsgIndex, config.value.lastSendAction || 'linear')
  messages.value[autoMsgIndex].autoStep = ''
}

const sendActions = computed(() => [
  { id: 'linear', icon: 'ai-hal', label: t('index.sendLinear') },
  { id: 'copy', icon: 'bi-robot', label: t('index.copyPrompt') },
  { id: 'save', icon: 'md-save-outlined', label: t('index.saveLocal') },
])

function updateLastSendAction(id: string) {
  config.value.lastSendAction = id as 'linear' | 'copy' | 'save'
  saveConfig()
}

async function handleSendFromChat(msgIndex: number, actionId: string) {
  const msg = messages.value[msgIndex]
  if (!msg?.content) return

  if (actionId === 'copy') {
    try {
      await navigator.clipboard.writeText(msg.content)
      toastSuccess(t('index.copied'))
    } catch {
      toastError('Clipboard error')
    }
    return
  }

  if (actionId === 'save') {
    sending.value = true
    try {
      await $fetch('/api/entries', { method: 'POST', body: { text: msg.content } })
      toastSuccess(t('index.saved'))
    } catch (err: any) {
      toastError(`${t('index.errorSave')}: ${err.data?.message || err.message || 'Unknown'}`)
    } finally {
      sending.value = false
    }
    return
  }

  if (actionId === 'linear') {
    sending.value = true
    try {
      const entry = await $fetch('/api/entries', { method: 'POST', body: { text: msg.content } })

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

onBeforeRouteLeave(() => {
  if (messages.value.length > 0) {
    return confirm(t('index.unsavedWarning'))
  }
})
</script>
