<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-center mb-8">Voice to Linear</h1>

    <!-- Config banner -->
    <div
      v-if="!isConfigured"
      class="mb-6 p-4 bg-yellow-950 border border-yellow-800 rounded-lg text-yellow-200 text-sm flex items-center gap-3"
    >
      <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <span>Configura tu equipo de Linear antes de empezar.</span>
      <NuxtLink to="/config" class="ml-auto text-yellow-400 hover:text-yellow-300 underline text-sm whitespace-nowrap">
        Ir a Config
      </NuxtLink>
    </div>

    <!-- Browser support warning -->
    <div
      v-if="!isSupported"
      class="mb-6 p-4 bg-red-950 border border-red-800 rounded-lg text-red-200 text-sm"
    >
      Tu navegador no soporta la Web Speech API. Usa Chrome o Edge.
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
        {{ isListening ? 'Escuchando... pulsa para detener' : 'Pulsa para grabar' }}
      </p>
      <p v-if="interimText" class="mt-2 text-sm text-gray-600 italic text-center max-w-md">
        {{ interimText }}
      </p>
    </div>

    <!-- Text area -->
    <div class="relative mb-4">
      <textarea
        ref="textareaRef"
        v-model="editableText"
        rows="6"
        class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-y text-sm leading-relaxed"
        placeholder="El texto transcrito aparecera aqui. Tambien puedes escribir directamente..."
      />
      <span class="absolute bottom-2 right-3 text-xs text-gray-600">
        {{ editableText.length }} caracteres
      </span>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3">
      <button
        class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
        :disabled="!editableText && !isListening"
        @click="clearAll"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Limpiar
      </button>
      <button
        class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        :disabled="!editableText.trim() || !isConfigured || sending"
        @click="sendToLinear"
      >
        <svg v-if="!sending" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ sending ? 'Enviando...' : 'Enviar a Linear' }}
      </button>
    </div>

    <!-- Success mini-summary -->
    <div
      v-if="lastCreated"
      class="mt-4 p-3 bg-green-950 border border-green-800 rounded-lg flex items-center gap-2 text-sm text-green-200"
    >
      <span>&#10003;</span>
      <a
        :href="lastCreated.url"
        target="_blank"
        rel="noopener"
        class="font-medium text-green-300 hover:text-green-200 underline"
      >
        {{ lastCreated.identifier }}
      </a>
      <span>creada</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const { config, isConfigured, loadConfig } = useConfig()
const { transcript, interimText, isListening, isSupported, start, stop, reset } = useSpeechToText(
  computed(() => config.value.language || 'es-ES')
)
const { success: toastSuccess, error: toastError } = useToast()

const editableText = ref('')
const sending = ref(false)
const lastCreated = ref<{ identifier: string; url: string } | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Sync transcript into editable text
watch(transcript, (val) => {
  editableText.value = val
})

onMounted(() => {
  loadConfig()
})

function toggleRecording() {
  if (isListening.value) {
    stop()
  } else {
    lastCreated.value = null
    start()
  }
}

function clearAll() {
  reset()
  editableText.value = ''
  lastCreated.value = null
}

async function sendToLinear() {
  const text = editableText.value.trim()
  if (!text || !isConfigured.value) return

  sending.value = true
  lastCreated.value = null

  try {
    // 1. Create draft entry
    const entry = await $fetch('/api/entries', {
      method: 'POST',
      body: { text },
    })

    // 2. Parse title/description
    const lines = text.split('\n')
    const title = lines[0].slice(0, 200)
    const description = lines.slice(1).join('\n').trim() || undefined

    // 3. Send to Linear
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

      // 4. Update entry with Linear data
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

      toastSuccess(`${result.issue.identifier} creada`, {
        url: result.issue.url,
        label: 'Abrir en Linear',
      })

      // 5. Clear form
      reset()
      editableText.value = ''
    } catch (err: any) {
      toastError(`Error al crear tarea: ${err.data?.message || err.message || 'Error desconocido'}`)
    }
  } catch (err: any) {
    toastError(`Error al guardar: ${err.data?.message || err.message || 'Error desconocido'}`)
  } finally {
    sending.value = false
  }
}

// Keyboard shortcut: space to toggle recording when textarea not focused
if (import.meta.client) {
  useEventListener(document, 'keydown', (e: KeyboardEvent) => {
    if (e.code === 'Space' && document.activeElement !== textareaRef.value) {
      e.preventDefault()
      toggleRecording()
    }
  })
}

// Warn before leaving with unsaved text
onBeforeRouteLeave(() => {
  if (editableText.value.trim()) {
    return confirm('Tienes texto sin enviar. ¿Seguro que quieres salir?')
  }
})
</script>
