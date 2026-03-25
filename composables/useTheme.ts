export function useTheme() {
  const { config } = useConfig()

  function applyTheme() {
    if (!import.meta.client) return

    const preference = config.value.theme || 'system'
    const isDark =
      preference === 'dark' ||
      (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    document.documentElement.classList.toggle('dark', isDark)
  }

  if (import.meta.client) {
    watch(() => config.value.theme, applyTheme)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', applyTheme)

    onUnmounted(() => {
      mq.removeEventListener('change', applyTheme)
    })
  }

  return { applyTheme }
}
