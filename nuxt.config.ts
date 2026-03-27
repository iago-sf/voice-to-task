export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  runtimeConfig: {
    turso: {
      url: process.env.TURSO_DATABASE_URL || 'file:data/voice-linear.db',
      authToken: process.env.TURSO_AUTH_TOKEN || '',
    },
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || '',
    },
    oauth: {
      google: {
        clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET || '',
      },
    },
  },

  app: {
    head: {
      script: [
        {
          src: 'https://cdn.tailwindcss.com',
          innerHTML: `tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                colors: {
                  accent: {
                    50: 'var(--accent-50)',
                    100: 'var(--accent-100)',
                    200: 'var(--accent-200)',
                    300: 'var(--accent-300)',
                    400: 'var(--accent-400)',
                    500: 'var(--accent-500)',
                    600: 'var(--accent-600)',
                    700: 'var(--accent-700)',
                    800: 'var(--accent-800)',
                    900: 'var(--accent-900)',
                    950: 'var(--accent-950)'
                  }
                }
              }
            }
          }`,
        },
      ],
    },
  },

  css: ['~/assets/css/main.css'],
  modules: ['nuxt-auth-utils'],
})
