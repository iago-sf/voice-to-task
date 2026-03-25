import type { AppConfig } from '~/types'

const CONFIG_KEY = 'voice-to-linear-config'

const defaultConfig: AppConfig = {
  teamId: '',
  teamName: '',
  assigneeId: '',
  assigneeName: '',
  language: 'es-ES',
  sttEngine: 'browser',
  groqModel: 'openai/gpt-oss-120b',
  autoMode: false,
  activeContextIds: [],
}

export function useConfig() {
  const config = useState<AppConfig>('app-config', () => ({ ...defaultConfig }))

  const isConfigured = computed(() => {
    return !!(config.value.teamId && config.value.assigneeId)
  })

  function loadConfig() {
    if (!import.meta.client) return
    const stored = localStorage.getItem(CONFIG_KEY)
    if (stored) {
      try {
        Object.assign(config.value, JSON.parse(stored))
      } catch {
        // ignore invalid JSON
      }
    }
  }

  function saveConfig() {
    if (!import.meta.client) return
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config.value))
  }

  return {
    config,
    isConfigured,
    loadConfig,
    saveConfig,
  }
}
