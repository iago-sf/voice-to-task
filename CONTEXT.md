# Voice to Task — AI Agent Context

> **This document is the single source of truth for AI agents working on this project.**
> If you modify the project structure, APIs, database schema, features, or architecture, **you must update this file and `README.md`** before finishing your task.

---

## Project Overview

A Nuxt 4 full-stack app that captures voice via the browser microphone, transcribes it to text, optionally generates an AI action plan, and creates tasks in [Linear](https://linear.app). Runs as both a web app and an Electron desktop app. All data is scoped per authenticated user (Google OAuth). The database is SQLite-compatible via libSQL (local file or Turso for cloud/serverless).

- **Framework:** Nuxt 4 (Vue 3) — full-stack, file-based routing
- **Desktop:** Electron (packaged via `electron-builder` with auto-update via `electron-updater`)
- **Node.js:** v22 required (see `.nvmrc`)
- **Database:** libSQL via `@libsql/client` — local file (`file:data/voice-linear.db`) or remote Turso (web), `file:<userData>/voice-linear.db` (desktop)
- **Auth:** Google OAuth via `nuxt-auth-utils` (web) or local mode fallback `local@desktop` (desktop)
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

### Web mode (required)
```env
NUXT_SESSION_PASSWORD=at-least-32-characters-long-random-string
NUXT_OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Desktop mode
No environment variables required. The Electron main process auto-generates `NUXT_SESSION_PASSWORD` and sets `NUXT_DESKTOP_MODE=true`, `DESKTOP_DB_PATH`, and `PORT` when spawning the Nitro server.

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

### Electron Desktop App
- **Main process** (`electron/main.js`): Detects `app.getPath('userData')` for DB path, uses `portfinder` to find a free local port, spawns Nitro standalone as child process with env `NUXT_DESKTOP_MODE=true`, `DESKTOP_DB_PATH`, `PORT`, auto-generated `NUXT_SESSION_PASSWORD`. Creates `BrowserWindow` pointing to `http://localhost:PORT`.
- **Preload** (`electron/preload.js`): Exposes `window.__electron` with `{ isDesktop: true, platform }` via `contextBridge`.
- **Types** (`electron/types.ts`): TypeScript `ElectronBridge` interface for `window.__electron`.
- **Build flow**: `nuxt build` (with `NUXT_DESKTOP_MODE=true`, Nitro preset `node-server`) → `.output/server/index.mjs` → `electron-builder` packages `.output` as `extraResources` alongside Electron binary.
- **Auto-update**: `electron-updater` configured with GitHub Releases provider in `electron-builder.yml`. Shows restart dialog when update downloaded.
- **Composable** (`composables/useDesktopMode.ts`): Returns `{ isDesktop, platform }` computed from `window.__electron`.
- **Runtime config**: `NUXT_PUBLIC_DESKTOP_MODE` exposed to frontend via `useRuntimeConfig().public.desktopMode`.

### Dual Mode (Web vs Desktop)
- **`NUXT_DESKTOP_MODE=true`** env flag branches all behavior:
  - `nuxt.config.ts`: Skips env var validation, sets Nitro preset to `node-server`
  - `server/utils/db.ts`: Uses `file:` connection with `DESKTOP_DB_PATH` instead of Turso
  - `server/utils/session-email.ts`: Falls back to `local@desktop` when no session exists
  - `middleware/auth.global.ts`: Allows unauthenticated access (no redirect to `/login`)
  - `components/NavBar.vue`: Shows "Desktop" badge, shows Login link when not authenticated
- **Google OAuth in desktop**: Still works via redirect to `localhost:PORT/auth/google`. When user logs in, their email overrides `local@desktop`.
- **Web mode unchanged**: Without `NUXT_DESKTOP_MODE`, all behavior is identical to before.

### Chat UI (main page)
- **Center (chat timeline)**: User messages right-aligned (accent bubble), system messages left-aligned (gray bubble). Markdown rendered in system messages via `marked` + DOMPurify. Auto-scroll to bottom. Streaming content visible during generation with a "Generating..." footer spinner.
- **Right sidebar (`components/ChatSidebar.vue`, desktop only)**: Shows auto-mode toggle, active tags (contexts, labels, projects) as `rounded-full` pills with X to remove, `+ Add` button opens picker for inactive items.
- **Bottom input bar**: Centered (`max-w-xl mx-auto`), compact, with mic button + auto-expanding textarea + send button.
- **NavBar**: `h-14`, fixed `bottom-0` on mobile, `top-0` on desktop. `app.vue` adds `pb-16 sm:pb-0 sm:pt-14` padding to compensate.

### Streaming (SSE)
- `server/utils/llm.ts` has `streamGroq`, `streamZai`, `streamMinimax` with SSE/JSON fallback (ZAI does not support `stream: true` — detects Content-Type and parses full JSON response as single chunk).
- `server/api/ai/action-plan.post.ts` — SSE endpoint with `flushHeaders()`, `X-Accel-Buffering: no`, 5-min timeout via `AbortController`.
- Frontend `streamPlan()` uses `fetch` + `ReadableStream` reader, mutates `messages.value[index]` for reactivity.

### Voice input flow
- **Recording stops → transcript goes to input field** (not auto-sent to chat). User edits and presses Send.
- `pendingVoiceInput` ref handles async Groq transcription: API response arrives after `stop()`, so the `watch(transcript)` catches it via this flag.
- Browser STT updates `inputText` in real-time while recording (`watch(transcript)` + `isListening`). Groq STT updates after stop via `pendingVoiceInput`.

### Reactivity gotchas
- **Never pass message objects directly** to mutation functions — always use `messages.value[index]` to stay reactive.
- **DOMPurify is async** — `purifyReady` flag gates `v-html` rendering; shows plain text as fallback to avoid hydration mismatch.
- **Multi-line `:class` with ternaries** break the Vue macro parser — keep them single-line.

### Authentication & Authorization
- **Dual auth**: All API endpoints support both Google OAuth sessions (`requireUserSession`) and Bearer API tokens (`Bearer vtk_...`). The `getSessionEmail()` utility abstracts both.
- **Desktop fallback**: In desktop mode (`NUXT_DESKTOP_MODE=true`), `getSessionEmail()` returns `local@desktop` when no session or token is present.
- **`requireUserApiKey()`** uses `getSessionEmail()` internally, so API token auth works for all LLM/Linear endpoints too.
- **All data is scoped by `user_email`** — every query filters by the authenticated user's email. Context queries in `action-plan.post.ts` and `refine-plan.post.ts` also enforce `user_email` ownership.
- **External API errors are sanitized** — raw error bodies from Groq/ZAI/MiniMax/Linear are logged server-side only (`console.error`) and never exposed to the client.
- **API keys are encrypted at rest** with AES-256-GCM using a key derived from `NUXT_SESSION_PASSWORD`.
- **API tokens are stored as SHA-256 hashes** — the raw token is only shown once at creation.

### Conversation Summary (Context Continuity)
- **Problem**: Long conversations lose LLM context because each call only sends `[system prompt, user message]`.
- **Solution**: After each LLM response, a background summary request condenses the conversation history into a persistent summary that is injected as context on subsequent calls.
- **Flow**:
  1. User sends message → action-plan endpoint receives `conversationSummary` alongside `text`
  2. Summary is injected as a system message before the user message: `"CONVERSATION HISTORY SUMMARY: ..."`
  3. LLM responds with full conversation context
  4. After streaming completes, frontend calls `/api/ai/summarize` in the background
  5. The summary updates `conversationSummary` ref in memory
  6. Frontend blocks new messages (`isBusy = generatingPlan || summarizing`) until summary completes
  7. When saving/sending to Linear, `conversation_summary` is persisted in the `entries` table
  8. When recovering an entry from history, `conversation_summary` is restored to allow continuing the conversation
- **Endpoint**: `server/api/ai/summarize.post.ts` — non-streaming, accepts `messages[]`, `existingSummary`, `engine`, `model`; returns `{ summary }`
- **Database**: `entries.conversation_summary TEXT DEFAULT ''` column (idempotent migration in `db.ts`)
- **Entry type**: `conversation_summary: string` field on `Entry` interface
