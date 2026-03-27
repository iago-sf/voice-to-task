export type AccentColor = 'indigo' | 'blue' | 'violet' | 'rose' | 'emerald' | 'amber'

const accentPalettes: Record<AccentColor, Record<string, string>> = {
  indigo: {
    50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
    400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
    800: '#3730a3', 900: '#312e81', 950: '#1e1b4b',
  },
  blue: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
    400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
    800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
  },
  violet: {
    50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
    400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
    800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065',
  },
  rose: {
    50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
    400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
    800: '#9f1239', 900: '#881337', 950: '#4c0519',
  },
  emerald: {
    50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
    400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
    800: '#065f46', 900: '#064e3b', 950: '#022c22',
  },
  amber: {
    50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
    400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
    800: '#92400e', 900: '#78350f', 950: '#451a03',
  },
}

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

  function applyAccentColor() {
    if (!import.meta.client) return

    const color = (config.value.accentColor || 'indigo') as AccentColor
    const palette = accentPalettes[color] || accentPalettes.indigo
    const root = document.documentElement

    for (const [shade, value] of Object.entries(palette)) {
      root.style.setProperty(`--accent-${shade}`, value)
    }
  }

  if (import.meta.client) {
    watch(() => config.value.theme, applyTheme)
    watch(() => config.value.accentColor, applyAccentColor)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', applyTheme)

    onUnmounted(() => {
      mq.removeEventListener('change', applyTheme)
    })
  }

  return { applyTheme, applyAccentColor, accentPalettes }
}
