export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  devServer: { port: 3004 },

  modules: ['nuxt-auth-utils'],

  runtimeConfig: {
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
        { src: 'https://cdn.tailwindcss.com' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],
})
