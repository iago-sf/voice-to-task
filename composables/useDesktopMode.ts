export function useDesktopMode() {
  const isDesktop = computed(() => {
    if (!import.meta.client) return false
    return !!(window as any).__electron?.isDesktop
  })

  const platform = computed(() => {
    if (!import.meta.client) return 'web'
    return (window as any).__electron?.platform ?? 'web'
  })

  return { isDesktop, platform }
}
