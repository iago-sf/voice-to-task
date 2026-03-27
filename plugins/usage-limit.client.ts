export default defineNuxtPlugin(() => {
  const { error: toastError } = useToast()
  const { t } = useI18n()

  let shown429 = false

  const originalFetch = globalThis.$fetch

  // Wrap $fetch to intercept 429 responses globally
  globalThis.$fetch = ((...args: any[]) => {
    return (originalFetch as any)(...args).catch((err: any) => {
      if ((err?.status === 429 || err?.statusCode === 429) && !shown429) {
        shown429 = true
        toastError(t('error.rateLimited'))
        setTimeout(() => { shown429 = false }, 10000)
      }
      throw err
    })
  }) as typeof originalFetch

  // Preserve .raw, .native, .create etc.
  for (const key of Object.keys(originalFetch) as (keyof typeof originalFetch)[]) {
    (globalThis.$fetch as any)[key] = (originalFetch as any)[key]
  }
})
