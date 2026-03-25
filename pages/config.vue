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

    <!-- Status summary -->
    <div v-if="isConfigured" class="p-4 bg-green-950 border border-green-800 rounded-lg text-green-200 text-sm flex items-center gap-2">
      <span>&#10003;</span>
      Configurado: {{ config.teamName }} / {{ config.assigneeName }}
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
