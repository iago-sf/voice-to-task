# Voice to Task — AI Agent Context

> **This document is the single source of truth for AI agents working on this project.**
> If you modify the project structure, APIs, database schema, features, or architecture, **you must update this file and `README.md`** before finishing your task.

---

## Project Overview

A Nuxt 3 full-stack app that captures voice via the browser microphone, transcribes it to text, optionally generates an AI action plan, and creates tasks in [Linear](https://linear.app). All data is scoped per authenticated user (Google OAuth). The database is SQLite-compatible via libSQL (local file or Turso for cloud/serverless).

- **Framework:** Nuxt 3 (Vue 3) — full-stack, file-based routing
- **Database:** libSQL via `@libsql/client` — local file (`file:data/voice-linear.db`) or remote Turso
- **Auth:** Google OAuth via `nuxt-auth-utils`
- **Styling:** Tailwind CSS (loaded from CDN) + `assets/css/main.css`
- **i18n:** Custom composable with inline dictionaries (English + Spanish)
- **Tailwind CSS via CDN** — loaded as CDN script (`cdn.tailwindcss.com`), NOT as PostCSS plugin. This means `@apply` directives do external CSS files. All custom CSS must `assets/css/main.css` must use plain CSS properties.
- **Client-only imports for DOM-dependent libraries** — libraries like `dompurify` require dynamic `import()` guarded by `import.meta.client`. Use `oh-vue-icons` component (`v-icon`) registered as `.client.ts` plugin.
- **Nuxt auto-imports** — Vue APIs (`ref`, `computed`, `watch`), composables from `composables/`, server utilities from `server/utils/`, and Nuxt helpers (`defineEventHandler`, `createError`, etc.)

## App Icon

- **Files:** `public/favicon.svg` (512x512), `public/apple-touch-icon.svg` (180x180)
- **Design:** Microphone capsule in bottom-left corner + 3 curved sound waves (each: circle + bezier curve)
- **Note:** See `.claude/memory.md` for design history and important lessons learned

## Environment Variables

```env
NUXT_SESSION_PASSWORD=at-least-32-characters-long-random-string
NUXT_OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

API keys (Linear, Groq, ZAI) are per-user and managed through the Config > API Keys UI, not env vars.

---

## Maintenance Rules for AI Agents

> **When you make changes to this project, you MUST:**

1. **Update `CONTEXT.md`** (this file) if you:
   - Add, remove, or rename files or directories
   - Change the database schema (new tables, columns, migrations)
   - Add, modify, or remove API endpoints
   - Change TypeScript types/interfaces
   - Add new composables or components
   - Change authentication or authorization logic
   - Modify architecture patterns or conventions
   - Add new environment variables
   - Add new dependencies

2. **Update `README.md`** if you:
   - Add user-facing features
   - Change setup instructions or prerequisites
   - Change the project structure section
   - Add new configuration options
   - Modify the tech stack

3. **Keep both files in sync** — `CONTEXT.md` is the detailed technical reference, `README.md` is the user-facing documentation. They should not contradict each other.

4. **RESPECT USER INSTRUCTIONS** — If the user says "don't touch X", "stop", or provides a file to use exactly, DO NOT modify it. Listen to feedback and stop if something is wrong after 3 attempts.
