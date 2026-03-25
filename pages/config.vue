<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">{{ t('config.title') }}</h1>

    <!-- Tabs -->
    <div class="flex border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap"
        :class="activeTab === tab.value
          ? 'text-indigo-600 dark:text-indigo-400'
          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <div
          v-if="activeTab === tab.value"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
        />
      </button>
    </div>

    <!-- ═══════ API KEYS TAB ═══════ -->
    <div v-if="activeTab === 'keys'">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{{ t('config.apiKeysDesc') }}</p>

      <div class="space-y-4">
        <div
          v-for="keyDef in apiKeyDefs"
          :key="keyDef.name"
          class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
        >
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ keyDef.label }}</label>
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              :class="keyStatus[keyDef.name]
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'"
            >
              {{ keyStatus[keyDef.name] ? t('config.keyConfigured') : t('config.keyNotSet') }}
            </span>
          </div>

          <div class="flex gap-2">
            <input
              v-model="keyInputs[keyDef.name]"
              type="password"
              class="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500 placeholder-gray-400 dark:placeholder-gray-600"
              :placeholder="t('config.keyPlaceholder')"
            />
            <button
              class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
              :disabled="!keyInputs[keyDef.name] || savingKey === keyDef.name"
              @click="saveKey(keyDef.name)"
            >
              {{ t('config.keySave') }}
            </button>
            <button
              v-if="keyStatus[keyDef.name]"
              class="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
              :disabled="savingKey === keyDef.name"
              @click="clearKey(keyDef.name)"
            >
              {{ t('config.keyClear') }}
            </button>
          </div>

          <p class="mt-2 text-xs text-gray-400 dark:text-gray-600">
            {{ keyDef.hint }}
            <a v-if="keyDef.url" :href="keyDef.url" target="_blank" rel="noopener" class="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 underline">{{ keyDef.urlLabel }}</a>
          </p>
        </div>
      </div>
    </div>

    <!-- ═══════ LINEAR TAB ═══════ -->
    <div v-if="activeTab === 'linear'">
      <div class="space-y-4">
        <!-- Current user -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-1">{{ t('config.currentUser') }}</label>
          <div v-if="loadingUser" class="text-sm text-gray-500">{{ t('config.loading') }}</div>
          <div v-else-if="linearUser" class="text-sm text-gray-800 dark:text-gray-200">
            {{ linearUser.name }} <span class="text-gray-500">({{ linearUser.email }})</span>
          </div>
          <div v-else class="text-sm text-red-500 dark:text-red-400">
            {{ t('config.noConnect') }}
          </div>
        </div>

        <!-- Team select -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.team') }}</label>
          <div v-if="loadingTeams" class="text-sm text-gray-500">{{ t('config.loadingTeams') }}</div>
          <select
            v-else-if="teams.length"
            v-model="selectedTeamId"
            class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500"
            @change="onTeamChange"
          >
            <option value="" disabled>{{ t('config.selectTeam') }}</option>
            <option v-for="team in teams" :key="team.id" :value="team.id">
              {{ team.name }} ({{ team.key }})
            </option>
          </select>
          <div v-else class="text-sm text-gray-500">{{ t('config.noTeams') }}</div>
        </div>

        <!-- Test connection -->
        <button
          class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
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
          {{ testing ? t('config.testing') : t('config.testConnection') }}
        </button>

        <!-- Linear state mapping -->
        <div class="pt-4">
          <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">{{ t('config.linearStateMap') }}</h3>
          <p class="text-xs text-gray-500 mb-3">{{ t('config.linearStateMapDesc') }}</p>

          <div class="space-y-3">
            <div
              v-for="status in taskStatuses"
              :key="status"
              class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex items-center justify-between gap-4"
            >
              <span class="text-sm text-gray-800 dark:text-gray-200 font-medium min-w-[110px]">{{ t(`taskStatus.${status}`) }}</span>
              <select
                :value="config.linearStateMap[status]"
                class="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500"
                @change="onStateMapChange(status, ($event.target as HTMLSelectElement).value as LinearStateType)"
              >
                <option v-for="st in linearStateTypes" :key="st" :value="st">
                  {{ t(`linearState.${st}`) }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Status summary -->
      <div v-if="isConfigured" class="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-200 text-sm flex items-center gap-2">
        <span>&#10003;</span>
        {{ t('config.configured') }}: {{ config.teamName }} / {{ config.assigneeName }}
        <span v-if="config.autoMode" class="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 rounded text-xs text-emerald-700 dark:text-emerald-300">{{ t('config.auto') }}</span>
      </div>
    </div>

    <!-- ═══════ AI MODELS TAB ═══════ -->
    <div v-if="activeTab === 'ai'">
      <div class="space-y-4">
        <!-- Engine selector -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.engine') }}</label>
          <div class="flex gap-3">
            <button
              v-for="engine in engines"
              :key="engine.value"
              class="flex-1 px-3 py-3 rounded-lg border text-sm text-left transition-colors"
              :class="config.sttEngine === engine.value
                ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-400 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'"
              @click="config.sttEngine = engine.value; saveConfig()"
            >
              <div class="font-medium mb-0.5">{{ engine.label }}</div>
              <div class="text-xs opacity-70">{{ engine.description }}</div>
            </button>
          </div>
        </div>

        <!-- API key needed info -->
        <div
          v-if="config.sttEngine === 'groq' && !keyStatus.groq_api_key"
          class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-400"
        >
          {{ t('config.needKey') }}
          <button class="underline ml-1" @click="activeTab = 'keys'">API Keys</button>
        </div>
        <div
          v-if="config.sttEngine === 'zai' && !keyStatus.zai_api_key"
          class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-400"
        >
          {{ t('config.needKey') }}
          <button class="underline ml-1" @click="activeTab = 'keys'">API Keys</button>
        </div>

        <!-- Groq LLM model -->
        <div v-if="config.sttEngine === 'groq'" class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.llmModel') }}</label>
          <input
            v-model="config.groqModel"
            type="text"
            class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500 placeholder-gray-400 dark:placeholder-gray-600"
            :placeholder="t('config.llmModelPlaceholder')"
            @change="saveConfig"
          />
          <p class="mt-2 text-xs text-gray-400 dark:text-gray-600">
            {{ t('config.llmModelHint') }}
            <a href="https://console.groq.com/docs/models" target="_blank" rel="noopener" class="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 underline">console.groq.com/docs/models</a>.
          </p>
        </div>

        <!-- ZAI LLM model -->
        <div v-if="config.sttEngine === 'zai'" class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.zaiLlmModel') }}</label>
          <input
            v-model="config.zaiModel"
            type="text"
            class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500 placeholder-gray-400 dark:placeholder-gray-600"
            :placeholder="t('config.zaiModelPlaceholder')"
            @change="saveConfig"
          />
          <p class="mt-2 text-xs text-gray-400 dark:text-gray-600">
            {{ t('config.zaiModelHint') }}
          </p>
        </div>

        <!-- Language -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.language') }}</label>
          <select
            v-model="config.language"
            class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500"
            @change="saveConfig"
          >
            <option v-for="lang in languages" :key="lang.code" :value="lang.code">
              {{ lang.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- ═══════ USER CONFIG TAB ═══════ -->
    <div v-if="activeTab === 'user'">
      <div class="space-y-4">
        <!-- Automation -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="flex items-center justify-between cursor-pointer">
            <div>
              <div class="text-sm text-gray-800 dark:text-gray-200 font-medium">{{ t('config.autoMode') }}</div>
              <div class="text-xs text-gray-500 mt-0.5">{{ t('config.autoModeDesc') }}</div>
            </div>
            <div
              class="relative w-11 h-6 rounded-full transition-colors"
              :class="config.autoMode ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-700'"
              @click="config.autoMode = !config.autoMode; saveConfig()"
            >
              <div
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                :class="config.autoMode ? 'translate-x-5' : ''"
              />
            </div>
          </label>
        </div>

        <!-- UI Language -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.uiLanguage') }}</label>
          <div class="flex gap-3">
            <button
              v-for="uiLang in uiLanguages"
              :key="uiLang.value"
              class="flex-1 px-3 py-3 rounded-lg border text-sm text-center transition-colors"
              :class="config.uiLanguage === uiLang.value
                ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-400 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'"
              @click="config.uiLanguage = uiLang.value; saveConfig()"
            >
              {{ uiLang.label }}
            </button>
          </div>
        </div>

        <!-- Theme -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.theme') }}</label>
          <div class="flex gap-3">
            <button
              v-for="th in themes"
              :key="th.value"
              class="flex-1 px-3 py-3 rounded-lg border text-sm text-center transition-colors"
              :class="config.theme === th.value
                ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-400 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'"
              @click="config.theme = th.value; saveConfig(); applyTheme()"
            >
              {{ th.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LinearTeam, LinearUser, TaskStatus, LinearStateType } from '~/types'

const { config, isConfigured, loadConfig, saveConfig } = useConfig()
const { success: toastSuccess, error: toastError } = useToast()
const { t } = useI18n()
const { applyTheme } = useTheme()

const activeTab = ref<'keys' | 'linear' | 'ai' | 'user'>('keys')

const tabs = computed(() => [
  { value: 'keys' as const, label: t('config.apiKeys') },
  { value: 'linear' as const, label: t('config.linear') },
  { value: 'ai' as const, label: t('config.aiModels') },
  { value: 'user' as const, label: t('config.userConfig') },
])

// ── API Keys ──
const keyStatus = ref<Record<string, boolean>>({
  linear_api_key: false,
  groq_api_key: false,
  zai_api_key: false,
})
const keyInputs = ref<Record<string, string>>({
  linear_api_key: '',
  groq_api_key: '',
  zai_api_key: '',
})
const savingKey = ref<string | null>(null)

const apiKeyDefs = computed(() => [
  { name: 'linear_api_key', label: t('config.linearApiKey'), hint: t('config.keyHintLinear'), url: 'https://linear.app/settings/api', urlLabel: 'linear.app/settings/api' },
  { name: 'groq_api_key', label: t('config.groqApiKey'), hint: t('config.keyHintGroq'), url: 'https://console.groq.com/keys', urlLabel: 'console.groq.com/keys' },
  { name: 'zai_api_key', label: t('config.zaiApiKey'), hint: t('config.keyHintZai'), url: 'https://z.ai', urlLabel: 'z.ai' },
])

async function loadKeyStatus() {
  try {
    const data = await $fetch<Record<string, boolean>>('/api/user-keys')
    keyStatus.value = data
  } catch {
    // not logged in or error
  }
}

async function saveKey(keyName: string) {
  savingKey.value = keyName
  try {
    await $fetch('/api/user-keys', {
      method: 'PUT',
      body: { [keyName]: keyInputs.value[keyName] },
    })
    keyInputs.value[keyName] = ''
    keyStatus.value[keyName] = true
    toastSuccess(t('config.keySaved'))
  } catch {
    toastError(t('config.keyError'))
  } finally {
    savingKey.value = null
  }
}

async function clearKey(keyName: string) {
  savingKey.value = keyName
  try {
    await $fetch('/api/user-keys', {
      method: 'PUT',
      body: { [keyName]: '' },
    })
    keyStatus.value[keyName] = false
    toastSuccess(t('config.keyCleared'))
  } catch {
    toastError(t('config.keyError'))
  } finally {
    savingKey.value = null
  }
}

// ── Linear ──
const teams = ref<LinearTeam[]>([])
const linearUser = ref<LinearUser | null>(null)
const loadingTeams = ref(true)
const loadingUser = ref(true)
const testing = ref(false)
const selectedTeamId = ref('')

const taskStatuses: TaskStatus[] = ['TRIAGE', 'TODO', 'IN_PROGRESS', 'DONE']
const linearStateTypes: LinearStateType[] = ['triage', 'backlog', 'unstarted', 'started', 'completed', 'canceled']

const themes = computed(() => [
  { value: 'system' as const, label: t('config.themeSystem') },
  { value: 'light' as const, label: t('config.themeLight') },
  { value: 'dark' as const, label: t('config.themeDark') },
])

async function onStateMapChange(status: TaskStatus, stateType: LinearStateType) {
  config.value.linearStateMap[status] = stateType
  saveConfig()
  try {
    await $fetch('/api/settings', {
      method: 'PATCH',
      body: { linearStateMap: JSON.stringify(config.value.linearStateMap) },
    })
  } catch {
    toastError('Error saving state mapping')
  }
}

const engines = computed(() => [
  { value: 'browser' as const, label: t('config.engineBrowser'), description: t('config.engineBrowserDesc') },
  { value: 'groq' as const, label: t('config.engineGroq'), description: t('config.engineGroqDesc') },
  { value: 'zai' as const, label: t('config.engineZai'), description: t('config.engineZaiDesc') },
])

const uiLanguages = [
  { value: 'en' as const, label: 'English' },
  { value: 'es' as const, label: 'Espanol' },
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
    toastSuccess(`${t('config.connectedAs')} ${me.name}`)
  } catch {
    toastError(t('config.connectError'))
  } finally {
    testing.value = false
  }
}

onMounted(async () => {
  loadConfig()
  selectedTeamId.value = config.value.teamId

  // Load key status
  await loadKeyStatus()

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
    linearUser.value = userResult.value
    config.value.assigneeId = userResult.value.id
    config.value.assigneeName = userResult.value.name
    saveConfig()
  }
  loadingUser.value = false
})
</script>
