<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-center mb-8">{{ t('app.title') }}</h1>

    <!-- Config banner -->
    <div
      v-if="!isConfigured"
      class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm flex items-center gap-3"
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
      class="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm flex items-center gap-3"
    >
      <span>{{ t('index.browserWarning') }}</span>
      <button
        class="ml-auto text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200 underline text-sm whitespace-nowrap"
        @click="config.sttEngine = 'groq'; saveConfig()"
      >
        {{ t('index.switchApi') }}
      </button>
    </div>

    <!-- STT error -->
    <div
      v-if="sttError"
      class="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm"
    >
      {{ t('index.error') }}: {{ sttError }}
    </div>

    <!-- Record button -->
    <div class="flex flex-col items-center mb-8">
      <div class="relative">
        <div
          v-if="isListening"
          class="absolute inset-0 rounded-full bg-red-500/20 animate-pulse-ring"
        />
        <button
          :disabled="!isSupported"
          class="relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          :class="isListening
            ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30'
            : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'"
          @click="toggleRecording"
        >
          <svg v-if="!isListening" class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <svg v-else class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
      </div>
      <p class="mt-3 text-sm text-gray-500">
        {{ isListening ? t('index.listening') : t('index.tapToRecord') }}
      </p>
      <p class="mt-1 text-xs text-gray-400 dark:text-gray-700">
        {{ config.sttEngine === 'zai' ? 'ZAI GLM-ASR' : config.sttEngine === 'groq' ? 'Groq Whisper' : 'Web Speech API' }}
      </p>
      <p v-if="interimText" class="mt-2 text-sm text-gray-500 dark:text-gray-600 italic text-center max-w-md">
        {{ interimText }}
      </p>
    </div>

    <!-- Auto mode toggle -->
    <div class="flex items-center justify-center mb-6">
      <button
        class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors border"
        :class="config.autoMode
          ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
          : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'"
        @click="config.autoMode = !config.autoMode; saveConfig()"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {{ config.autoMode ? t('index.autoModeOn') : t('index.autoMode') }}
      </button>
      <span v-if="config.autoMode" class="ml-3 text-xs text-gray-400 dark:text-gray-600">
        {{ t('index.autoFlow') }}
      </span>
    </div>

    <!-- Auto mode progress -->
    <div
      v-if="autoStep"
      class="mb-6 p-3 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-lg text-indigo-700 dark:text-indigo-200 text-sm flex items-center gap-3"
    >
      <svg class="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span>{{ autoStep }}</span>
    </div>

    <!-- Text area -->
    <div class="relative mb-4">
      <textarea
        ref="textareaRef"
        v-model="editableText"
        rows="6"
        class="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-y text-sm leading-relaxed"
        :placeholder="t('index.placeholder')"
      />
      <span class="absolute bottom-2 right-3 text-xs text-gray-400 dark:text-gray-600">
        {{ editableText.length }} {{ t('index.chars') }}
      </span>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2">
      <button
        class="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-40"
        :disabled="!editableText && !isListening"
        :title="t('index.clear')"
        @click="clearAll"
      >
        <v-icon name="md-deleteoutline-outlined" scale="1.1" />
      </button>
      <button
        class="p-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        :disabled="!editableText.trim() || generatingPlan"
        :title="t('index.generatePlan')"
        @click="generatePlan"
      >
        <v-icon v-if="!generatingPlan" name="ri-lightbulb-flash-line" scale="1.1" />
        <svg v-else class="w-[1.1rem] h-[1.1rem] animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </button>
      <button
        v-if="editableText.trim()"
        class="p-2 bg-orange-100 dark:bg-orange-900 hover:bg-orange-200 dark:hover:bg-orange-800 disabled:opacity-40 disabled:cursor-not-allowed text-orange-700 dark:text-orange-300 rounded-lg transition-colors"
        :disabled="sendingRefine"
        :title="t('index.refine')"
        @click="refining = !refining"
      >
        <v-icon name="md-autorenew-round" scale="1.1" />
      </button>

      <div class="flex-1" />

      <SplitActionButton
        :actions="sendActions"
        :active-id="config.lastSendAction || 'linear'"
        :disabled="!editableText.trim() || sending"
        :loading="sending"
        @execute="handleSendAction"
        @update:active-id="updateLastSendAction"
      />
    </div>

    <!-- Refine UI -->
    <div
      v-if="refining"
      class="mt-4 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg"
    >
      <div class="flex items-center gap-2 mb-3">
        <button
          v-if="!refineListening"
          class="flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-colors"
          @click="startRefineRecording"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          {{ t('index.refineRecord') }}
        </button>
        <button
          v-else
          class="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          @click="stopRefineRecording"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
          {{ t('index.refineStop') }}
        </button>
        <p v-if="refineInterim" class="text-sm text-gray-500 dark:text-gray-400 italic">
          {{ refineInterim }}
        </p>
      </div>

      <textarea
        v-model="refineTranscript"
        rows="3"
        class="w-full bg-white dark:bg-gray-900 border border-orange-300 dark:border-orange-700 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-y text-sm mb-3"
        :placeholder="t('index.refineFeedback')"
      />

      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          :disabled="!refineTranscript.trim() || sendingRefine"
          @click="submitRefine"
        >
          <svg v-if="!sendingRefine" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ sendingRefine ? t('index.refining') : t('index.refineSend') }}
        </button>
        <button
          class="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition-colors"
          @click="refining = false; refineTranscript = ''"
        >
          {{ t('index.refineCancel') }}
        </button>
      </div>
    </div>

    <!-- Success mini-summary -->
    <div
      v-if="lastCreated"
      class="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-sm text-green-700 dark:text-green-200"
    >
      <span>&#10003;</span>
      <a
        :href="lastCreated.url"
        target="_blank"
        rel="noopener"
        class="font-medium text-green-600 dark:text-green-300 hover:text-green-700 dark:hover:text-green-200 underline"
      >
        {{ lastCreated.identifier }}
      </a>
      <span>{{ t('index.created') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
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
const sttError = computed(() => stt.value.error.value)

function start() { stt.value.start() }
function stop() { stt.value.stop() }
function reset() { stt.value.reset() }

// Refine STT instance
const refineSTT = useGroqSpeechToText(lang, sttEngine, audioDeviceId)
const refineListening = computed(() => refineSTT.isListening.value)
const refineInterim = computed(() => refineSTT.interimText.value)

const editableText = ref('')
const sending = ref(false)
const generatingPlan = ref(false)
const lastCreated = ref<{ identifier: string; url: string } | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const autoStep = ref('')
const refining = ref(false)
const refineTranscript = ref('')
const sendingRefine = ref(false)

// Sync transcript into editable text
watch(transcript, (val) => {
  editableText.value = val
})

onMounted(() => {
  loadConfig()

  const recoverEntry = useState<import('~/types').Entry | null>('recover-entry', () => null)
  if (recoverEntry.value) {
    editableText.value = recoverEntry.value.text
    recoverEntry.value = null
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
    if (config.value.autoMode && isConfigured.value) {
      runAutoFlow()
    }
  } else {
    lastCreated.value = null
    start()
  }
}

async function runAutoFlow() {
  await waitForTranscript()

  const text = editableText.value.trim()
  if (!text) {
    autoStep.value = ''
    return
  }

  try {
    autoStep.value = t('index.generatingPlan')
    await generatePlan()

    autoStep.value = t('index.sendingLinear')
    await handleSendAction(config.value.lastSendAction || 'linear')
  } catch {
    // Errors handled inside each function via toasts
  } finally {
    autoStep.value = ''
  }
}

function waitForTranscript(): Promise<void> {
  return new Promise((resolve) => {
    if (editableText.value.trim()) {
      resolve()
      return
    }
    const unwatch = watch(editableText, (val) => {
      if (val.trim()) {
        unwatch()
        resolve()
      }
    })
    setTimeout(() => { unwatch(); resolve() }, 30000)
  })
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(editableText.value)
    toastSuccess(t('index.copied'))
  } catch {
    toastError('Clipboard error')
  }
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

async function handleSendAction(id: string) {
  if (id === 'linear') await sendToLinear()
  else if (id === 'copy') await copyToClipboard()
  else if (id === 'save') await saveLocally()
}

async function saveLocally() {
  const text = editableText.value.trim()
  if (!text) return

  sending.value = true
  try {
    await $fetch('/api/entries', {
      method: 'POST',
      body: { text },
    })
    toastSuccess(t('index.saved'))
    reset()
    editableText.value = ''
  } catch (err: any) {
    toastError(`${t('index.errorSave')}: ${err.data?.message || err.message || 'Unknown'}`)
  } finally {
    sending.value = false
  }
}

function clearAll() {
  reset()
  editableText.value = ''
  lastCreated.value = null
}

async function generatePlan() {
  const text = editableText.value.trim()
  if (!text) return

  generatingPlan.value = true
  try {
    const result = await $fetch<{ title: string; plan: string }>('/api/ai/action-plan', {
      method: 'POST',
      body: {
        text,
        language: config.value.language?.split('-')[0] || 'es',
        engine: config.value.sttEngine === 'zai' ? 'zai' : 'groq',
        model: config.value.sttEngine === 'zai'
          ? (config.value.zaiModel || 'glm-4-plus')
          : (config.value.groqModel || 'openai/gpt-oss-120b'),
        contextIds: config.value.activeContextIds || [],
      },
    })

    editableText.value = result.title + '\n\n' + result.plan
    toastSuccess(t('index.planGenerated'))
  } catch (err: any) {
    toastError(`${t('index.errorPlan')}: ${err.data?.message || err.message || 'Unknown'}`)
  } finally {
    generatingPlan.value = false
  }
}

// Refine recording
function startRefineRecording() {
  refineSTT.reset()
  refineSTT.start()
}

function stopRefineRecording() {
  refineSTT.stop()
  // Watch for the transcript to arrive
  const unwatch = watch(() => refineSTT.transcript.value, (val) => {
    if (val) {
      refineTranscript.value = val
      unwatch()
    }
  }, { immediate: true })
}

async function submitRefine() {
  const feedback = refineTranscript.value.trim()
  if (!feedback) return

  sendingRefine.value = true
  try {
    const result = await $fetch<{ title: string; plan: string; contextRule: string }>('/api/ai/refine-plan', {
      method: 'POST',
      body: {
        currentPlan: editableText.value,
        feedback,
        language: config.value.language?.split('-')[0] || 'es',
        engine: config.value.sttEngine === 'zai' ? 'zai' : 'groq',
        model: config.value.sttEngine === 'zai'
          ? (config.value.zaiModel || 'glm-4-plus')
          : (config.value.groqModel || 'openai/gpt-oss-120b'),
        contextIds: config.value.activeContextIds || [],
      },
    })

    editableText.value = result.title + '\n\n' + result.plan

    // Auto-save context rule if present
    if (result.contextRule) {
      try {
        const firstWords = feedback.split(/\s+/).slice(0, 5).join(' ')
        const ctx = await $fetch<{ id: number }>('/api/contexts', {
          method: 'POST',
          body: {
            name: `Auto: ${firstWords}`,
            content: result.contextRule,
          },
        })

        if (!config.value.activeContextIds) {
          config.value.activeContextIds = []
        }
        config.value.activeContextIds.push(ctx.id)
        saveConfig()
      } catch {
        // Context save failed silently — plan was still refined
      }
    }

    toastSuccess(t('index.refined'))
    refining.value = false
    refineTranscript.value = ''
  } catch (err: any) {
    toastError(`${t('index.errorPlan')}: ${err.data?.message || err.message || 'Unknown'}`)
  } finally {
    sendingRefine.value = false
  }
}

async function sendToLinear() {
  const text = editableText.value.trim()
  if (!text || !isConfigured.value) return

  sending.value = true
  lastCreated.value = null

  try {
    const entry = await $fetch('/api/entries', {
      method: 'POST',
      body: { text },
    })

    const lines = text.split('\n')
    const title = lines[0].slice(0, 200)
    const description = lines.slice(1).join('\n').trim() || undefined

    try {
      const result = await $fetch('/api/linear/create-issue', {
        method: 'POST',
        body: {
          title,
          description,
          teamId: config.value.teamId,
          assigneeId: config.value.assigneeId,
        },
      })

      await $fetch(`/api/entries/${(entry as any).id}`, {
        method: 'PATCH',
        body: {
          linear_issue_id: result.issue.id,
          linear_issue_key: result.issue.identifier,
          linear_issue_url: result.issue.url,
          status: 'sent',
        },
      })

      lastCreated.value = {
        identifier: result.issue.identifier,
        url: result.issue.url,
      }

      toastSuccess(`${result.issue.identifier} ${t('index.created')}`, {
        url: result.issue.url,
        label: t('index.openLinear'),
      })

      reset()
      editableText.value = ''
    } catch (err: any) {
      toastError(`${t('index.errorCreate')}: ${err.data?.message || err.message || 'Unknown'}`)
    }
  } catch (err: any) {
    toastError(`${t('index.errorSave')}: ${err.data?.message || err.message || 'Unknown'}`)
  } finally {
    sending.value = false
  }
}

onBeforeRouteLeave(() => {
  if (editableText.value.trim()) {
    return confirm(t('index.unsavedWarning'))
  }
})
</script>
