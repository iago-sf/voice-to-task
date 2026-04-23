export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  devServer: { port: 3004 },

  modules: ["nuxt-auth-utils"],

  runtimeConfig: {
    desktopMode: process.env.NUXT_DESKTOP_MODE === "true",
    public: {
      desktopMode: process.env.NUXT_DESKTOP_MODE === "true",
    },
    turso: {
      url: process.env.TURSO_DATABASE_URL || "file:data/voice-linear.db",
      authToken: process.env.TURSO_AUTH_TOKEN || "",
    },
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || "",
    },
    oauth: {
      google: {
        clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET || "",
      },
    },
  },

  hooks: {
    ready: () => {
      if (process.env.NUXT_DESKTOP_MODE === "true") return
      const missing: string[] = []
      if (!process.env.NUXT_SESSION_PASSWORD) missing.push("NUXT_SESSION_PASSWORD")
      if (!process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID) missing.push("NUXT_OAUTH_GOOGLE_CLIENT_ID")
      if (!process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET)
        missing.push("NUXT_OAUTH_GOOGLE_CLIENT_SECRET")
      if (missing.length) {
        console.error(
          `\n❌ Missing required environment variables:\n${missing.map((k) => `   - ${k}`).join("\n")}\n`,
        )
        process.exit(1)
      }
    },
  },

  nitro: {
    preset: process.env.NUXT_DESKTOP_MODE === "true" ? "node-server" : undefined,
  },

  app: {
    head: {
      title: "Voice to Task",
      meta: [
        { name: "theme-color", content: "#4f46e5" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "apple-touch-icon", type: "image/svg+xml", href: "/apple-touch-icon.svg" },
      ],
      script: [
        { src: "https://cdn.tailwindcss.com" },
        {
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

  css: ["~/assets/css/main.css"],

  vite: {
    optimizeDeps: {
      include: [
        "oh-vue-icons",
        "oh-vue-icons/icons",
        "@vue/devtools-core",
        "@vue/devtools-kit",
        "marked",
        "dompurify",
        "@vueuse/core",
      ],
    },
  },
})
