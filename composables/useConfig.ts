import type { AppConfig } from '~/types'

const defaultConfig: AppConfig = {
  teamId: '',
  teamName: '',
  assigneeId: '',
  assigneeName: '',
  language: 'es-ES',
  sttEngine: 'browser',
  llmEngine: 'groq',
  groqModel: 'openai/gpt-oss-120b',
  zaiModel: 'glm-4-plus',
  minimaxModel: 'MiniMax-M2.7',
  autoMode: false,
  activeContextIds: [],
  favoriteContextIds: [],
  uiLanguage: 'en',
  theme: 'system',
  audioDeviceId: '',
  linearStateMap: { TRIAGE: 'triage', TODO: 'unstarted', IN_PROGRESS: 'started', DONE: 'completed' },
  lastSendAction: 'linear',
  customPrompt: '',
}

export function useConfig() {
  const { user } = useUserSession()
  const configKey = computed(() => {
    const email = user.value?.email || 'anonymous'
    return `voice-to-task-config-${email}`
  })

  const config = useState<AppConfig>('app-config', () => ({ ...defaultConfig }))

  const isConfigured = computed(() => {
    return !!(config.value.teamId && config.value.assigneeId)
  })

  function loadConfig() {
    if (!import.meta.client) return
    const stored = localStorage.getItem(configKey.value)
    if (stored) {
      try {
        Object.assign(config.value, JSON.parse(stored))
        // Migrate: derive llmEngine from sttEngine for existing users
        if (!config.value.llmEngine) {
          config.value.llmEngine = config.value.sttEngine === 'zai' ? 'zai' : 'groq'
        }
      } catch {
        // ignore invalid JSON
      }
    }
  }

  function saveConfig() {
    if (!import.meta.client) return
    localStorage.setItem(configKey.value, JSON.stringify(config.value))
  }

  return {
    config,
    isConfigured,
    loadConfig,
    saveConfig,
  }
}
