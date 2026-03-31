# Voice to Task — AI Agent Context

> **This document is the single source of truth for AI agents working on this project.**
> If you modify the project structure, APIs, database schema, features, or architecture, **you must update this file and `README.md`** before finishing your task.

---

## Project Overview

A Nuxt 4 full-stack app that captures voice via the browser microphone, transcribes it to text, optionally generates an AI action plan, and creates tasks in [Linear](https://linear.app). All data is scoped per authenticated user (Google OAuth). The database is SQLite-compatible via libSQL (local file or Turso for cloud/serverless).

- **Framework:** Nuxt 4 (Vue 3) — full-stack, file-based routing
- **Node.js:** v22 required (see `.nvmrc`)
- **Database:** libSQL via `@libsql/client` — local file (`file:data/voice-linear.db`) or remote Turso
- **Auth:** Google OAuth via `nuxt-auth-utils`
- **Styling:** Tailwind CSS (loaded from CDN) + `assets/css/main.css`
- **i18n:** Custom composable with inline dictionaries (English + Spanish)
- **Tailwind CSS via CDN** — loaded as CDN script (`cdn.tailwindcss.com`), NOT as PostCSS plugin. This means `@apply` directives do external CSS files. All custom CSS must `assets/css/main.css` must use plain CSS properties.
- **Client-only imports for DOM-dependent libraries** — libraries like `dompurify` require dynamic `import()` guarded by `import.meta.client`. Use `oh-vue-icons` component (`v-icon`) registered as `.client.ts` plugin.
- **Nuxt auto-imports** — Vue APIs (`ref`, `computed`, `watch`), composables from `composables/`, server utilities from `server/utils/`, and Nuxt helpers (`defineEventHandler`, `createError`, etc.)
- **Chat UI** — Main page (`pages/index.vue`) uses a chat metaphor with streaming LLM responses, bottom input bar, and right sidebar (`components/ChatSidebar.vue`). Messages flow: type/record → send to chat → auto-generate plan (streaming) → Send to Linear/Copy/Save. Recovery from history entries populates input text for the input bar for

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

---

## Architecture

### Chat UI (main page)
- **Center (chat timeline)**: User messages right-aligned (accent bubble), system messages left-aligned (gray bubble). Markdown rendered in system messages via `marked` + DOMPurify. Auto-scroll to bottom. Streaming content visible during generation with a "Generating..." footer spinner.
- **Right sidebar (`components/ChatSidebar.vue`, desktop only)**: Shows auto-mode toggle, active tags (contexts, labels, projects) as `rounded-full` pills with X to remove, `+ Add` button opens picker for inactive items.
- **Bottom input bar**: Centered (`max-w-xl mx-auto`), compact, with mic button + auto-expanding textarea + send button.
- **NavBar**: `h-14`, fixed `bottom-0` on mobile, `top-0` on desktop. `app.vue` adds `pb-16 sm:pb-0 sm:pt-14` padding to compensate.

### Streaming (SSE)
- `server/utils/llm.ts` has `streamGroq`, `streamZai`, `streamMinimax` with SSE/JSON fallback (ZAI does not support `stream: true` — detects Content-Type and parses full JSON response as single chunk).
- `server/api/ai/action-plan.post.ts` — SSE endpoint with `flushHeaders()`, `X-Accel-Buffering: no`, 5-min timeout via `AbortController`.
- Frontend `streamPlan()` uses `fetch` + `ReadableStream` reader, mutates `messages.value[index]` for reactivity.

### Reactivity gotchas
- **Never pass message objects directly** to mutation functions — always use `messages.value[index]` to stay reactive.
- **DOMPurify is async** — `purifyReady` flag gates `v-html` rendering; shows plain text as fallback to avoid hydration mismatch.
- **Multi-line `:class` with ternaries** break the Vue macro parser — keep them single-line.
