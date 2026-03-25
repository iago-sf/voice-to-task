<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-8">Configuracion</h1>

    <!-- Linear connection status -->
    <div class="mb-8">
      <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Linear</h2>

      <div class="space-y-4">
        <!-- Current user -->
        <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-1">Usuario actual (asignado por defecto)</label>
          <div v-if="loadingUser" class="text-sm text-gray-500">Cargando...</div>
          <div v-else-if="user" class="text-sm text-gray-200">
            {{ user.name }} <span class="text-gray-500">({{ user.email }})</span>
          </div>
          <div v-else class="text-sm text-red-400">
            No se pudo conectar. Verifica tu LINEAR_API_KEY en .env
          </div>
        </div>

        <!-- Team select -->
        <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">Equipo</label>
          <div v-if="loadingTeams" class="text-sm text-gray-500">Cargando equipos...</div>
          <select
            v-else-if="teams.length"
            v-model="selectedTeamId"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500"
            @change="onTeamChange"
          >
            <option value="" disabled>Selecciona un equipo</option>
            <option v-for="team in teams" :key="team.id" :value="team.id">
              {{ team.name }} ({{ team.key }})
            </option>
          </select>
          <div v-else class="text-sm text-gray-500">No se encontraron equipos</div>
        </div>

        <!-- Test connection -->
        <button
          class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          :disabled="testing"
          @click="testConnection"
        >
          <svg v-if="!testing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ testing ? 'Probando...' : 'Probar conexion' }}
        </button>
      </div>
    </div>

    <!-- Voice settings -->
    <div class="mb-8">
      <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Reconocimiento de voz</h2>

      <div class="space-y-4">
        <!-- Engine selector -->
        <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">Motor de transcripcion</label>
          <div class="flex gap-3">
            <button
              v-for="engine in engines"
              :key="engine.value"
              class="flex-1 px-3 py-3 rounded-lg border text-sm text-left transition-colors"
              :class="config.sttEngine === engine.value
                ? 'bg-indigo-950 border-indigo-700 text-indigo-200'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'"
              @click="config.sttEngine = engine.value; saveConfig()"
            >
              <div class="font-medium mb-0.5">{{ engine.label }}</div>
              <div class="text-xs opacity-70">{{ engine.description }}</div>
            </button>
          </div>
        </div>

        <!-- Groq info -->
        <div
          v-if="config.sttEngine === 'groq'"
          class="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-400"
        >
          Requiere <code class="text-gray-300 bg-gray-800 px-1 rounded">GROQ_API_KEY</code> en el archivo <code class="text-gray-300 bg-gray-800 px-1 rounded">.env</code>.
          Obtenerla en <a href="https://console.groq.com/keys" target="_blank" rel="noopener" class="text-indigo-400 hover:text-indigo-300 underline">console.groq.com/keys</a>.
        </div>

        <!-- Groq LLM model -->
        <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">Modelo LLM (Groq) para generar planes</label>
          <input
            v-model="config.groqModel"
            type="text"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500 placeholder-gray-600"
            placeholder="ej: OSS-120, llama-3.3-70b-versatile"
            @change="saveConfig"
          />
          <p class="mt-2 text-xs text-gray-600">
            ID del modelo en Groq. Ver modelos disponibles en
            <a href="https://console.groq.com/docs/models" target="_blank" rel="noopener" class="text-indigo-400 hover:text-indigo-300 underline">console.groq.com/docs/models</a>.
          </p>
        </div>

        <!-- Language -->
        <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">Idioma</label>
          <select
            v-model="config.language"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500"
            @change="saveConfig"
          >
            <option v-for="lang in languages" :key="lang.code" :value="lang.code">
              {{ lang.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Automation -->
    <div class="mb-8">
      <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Automatizacion</h2>
      <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <label class="flex items-center justify-between cursor-pointer">
          <div>
            <div class="text-sm text-gray-200 font-medium">Modo automatico</div>
            <div class="text-xs text-gray-500 mt-0.5">Al parar la grabacion: genera plan + envia a Linear</div>
          </div>
          <div
            class="relative w-11 h-6 rounded-full transition-colors"
            :class="config.autoMode ? 'bg-emerald-600' : 'bg-gray-700'"
            @click="config.autoMode = !config.autoMode; saveConfig()"
          >
            <div
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              :class="config.autoMode ? 'translate-x-5' : ''"
            />
          </div>
        </label>
      </div>
    </div>

    <!-- Status summary -->
    <div v-if="isConfigured" class="p-4 bg-green-950 border border-green-800 rounded-lg text-green-200 text-sm flex items-center gap-2">
      <span>&#10003;</span>
      Configurado: {{ config.teamName }} / {{ config.assigneeName }}
      <span v-if="config.autoMode" class="ml-2 px-2 py-0.5 bg-emerald-900 border border-emerald-700 rounded text-xs text-emerald-300">Auto</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LinearTeam, LinearUser } from '~/types'

const { config, isConfigured, loadConfig, saveConfig } = useConfig()
const { success: toastSuccess, error: toastError } = useToast()

const teams = ref<LinearTeam[]>([])
const user = ref<LinearUser | null>(null)
const loadingTeams = ref(true)
const loadingUser = ref(true)
const testing = ref(false)
const selectedTeamId = ref('')

const engines = [
  { value: 'browser' as const, label: 'Web Speech API', description: 'Solo Chrome/Edge. Gratis, tiempo real.' },
  { value: 'groq' as const, label: 'Groq Whisper', description: 'Cualquier navegador. Requiere API key.' },
]

const languages = [
  { code: 'es-ES', label: 'Espanol (Espana)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'pt-BR', label: 'Portugues (Brasil)' },
  { code: 'ca-ES', label: 'Catala' },
  { code: 'gl-ES', label: 'Galego' },
  { code: 'eu-ES', label: 'Euskara' },
]

function onTeamChange() {
  const team = teams.value.find(t => t.id === selectedTeamId.value)
  if (team) {
    config.value.teamId = team.id
    config.value.teamName = team.name
    saveConfig()
  }
}

async function testConnection() {
  testing.value = true
  try {
    const me = await $fetch<LinearUser>('/api/linear/me')
    toastSuccess(`Conectado como ${me.name}`)
  } catch {
    toastError('No se pudo conectar a Linear. Verifica tu API key.')
  } finally {
    testing.value = false
  }
}

onMounted(async () => {
  loadConfig()
  selectedTeamId.value = config.value.teamId

  // Load teams and user in parallel
  const [teamsResult, userResult] = await Promise.allSettled([
    $fetch<LinearTeam[]>('/api/linear/teams'),
    $fetch<LinearUser>('/api/linear/me'),
  ])

  if (teamsResult.status === 'fulfilled') {
    teams.value = teamsResult.value
  }
  loadingTeams.value = false

  if (userResult.status === 'fulfilled') {
    user.value = userResult.value
    config.value.assigneeId = userResult.value.id
    config.value.assigneeName = userResult.value.name
    saveConfig()
  }
  loadingUser.value = false
})
</script>
