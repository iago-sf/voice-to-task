export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  runtimeConfig: {
    linearApiKey: process.env.LINEAR_API_KEY || '',
    groqApiKey: process.env.GROQ_API_KEY || '',
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
