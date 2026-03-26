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
- **Dev server port:** 3004

---

## Directory Structure

```
voice-to-task/
├── assets/css/main.css             # Body colors, dark mode, pulse-ring animation
├── components/
│   ├── EntryCard.vue               # Single entry row (text, badges, Linear link)
│   ├── NavBar.vue                  # Bottom/top nav with user avatar + logout
│   └── ToastContainer.vue          # Fixed top-right toast notifications
├── composables/
│   ├── useConfig.ts                # AppConfig in localStorage (keyed by user email)
│   ├── useGroqSpeechToText.ts      # MediaRecorder → POST /api/transcribe (Groq/ZAI)
│   ├── useI18n.ts                  # t(key, params?) with en/es dictionaries
│   ├── useSpeechToText.ts          # Browser Web Speech API wrapper
│   ├── useTheme.ts                 # system/light/dark theme management
│   └── useToast.ts                 # Global toast state (success/error/info)
├── middleware/
│   └── auth.global.ts              # Redirects unauthenticated users to /login
├── pages/
│   ├── index.vue                   # Main: record → transcribe → plan → send to Linear
│   ├── login.vue                   # Google OAuth login (layout: false)
│   ├── history.vue                 # Entry list with status/task_status filters
│   ├── contexts.vue                # CRUD for markdown context documents
│   ├── config.vue                  # 4-tab settings (API Keys, Linear, AI Models, Prefs)
│   └── api-docs.vue                # Agent Task API docs + copy as Markdown
├── server/
│   ├── auth.d.ts                   # Type augmentation: User { name, email, avatar }
│   ├── routes/auth/
│   │   ├── google.get.ts           # Google OAuth callback → sets session
│   │   └── logout.post.ts          # Clears session → redirects /login
│   ├── api/
│   │   ├── ai/
│   │   │   └── action-plan.post.ts # LLM plan generation (Groq or ZAI)
│   │   ├── contexts/               # CRUD, scoped by user_email
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].patch.ts
│   │   │   └── [id].delete.ts
│   │   ├── entries/                # CRUD, scoped by user_email
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].patch.ts
│   │   │   └── [id].delete.ts
│   │   ├── linear/                 # Linear SDK integration
│   │   │   ├── create-issue.post.ts
│   │   │   ├── me.get.ts
│   │   │   └── teams.get.ts
│   │   ├── settings/               # Per-user settings (user_settings table)
│   │   │   ├── index.get.ts
│   │   │   └── index.patch.ts
│   │   ├── tasks/                  # Agent Task API (read + status update)
│   │   │   ├── index.get.ts
│   │   │   ├── [id].get.ts
│   │   │   └── [id]/status.patch.ts
│   │   ├── transcribe.post.ts      # Audio transcription (Groq Whisper / ZAI GLM-ASR)
│   │   └── user-keys/              # Per-user encrypted API key management
│   │       ├── index.get.ts
│   │       └── index.put.ts
│   └── utils/
│       ├── db.ts                   # libSQL/Turso client singleton + async schema init
│       ├── linear-sync.ts          # Sync task_status → Linear workflow state
│       ├── session-email.ts        # getSessionEmail(event) helper
│       └── user-keys.ts            # AES-256-GCM encrypt/decrypt for API keys
├── types/index.ts                  # Shared TS interfaces (Entry, Task, AppConfig, etc.)
├── nuxt.config.ts
├── package.json
├── CONTEXT.md                      # ← This file
└── README.md
```

---

## Database Schema

All tables live in `data/voice-linear.db`. Migrations run idempotently in `server/utils/db.ts` on first `useDB()` call.

### `entries`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK AUTOINCREMENT | |
| text | TEXT NOT NULL | Voice transcript or edited text |
| linear_issue_id | TEXT | Linear issue UUID |
| linear_issue_key | TEXT | e.g. `TEAM-123` |
| linear_issue_url | TEXT | Full Linear URL |
| status | TEXT DEFAULT 'draft' | `'draft'` or `'sent'` |
| task_status | TEXT DEFAULT 'TRIAGE' | `'TRIAGE'`, `'TODO'`, `'IN_PROGRESS'`, `'DONE'` |
| assigned_to | TEXT | Free-text (agent name, user name) |
| user_email | TEXT DEFAULT '' | Owner's email for data isolation |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### `contexts`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK AUTOINCREMENT | |
| name | TEXT NOT NULL | Display name |
| content | TEXT DEFAULT '' | Markdown content |
| user_email | TEXT DEFAULT '' | Owner's email |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### `settings` (legacy — global)
| Column | Type | Notes |
|--------|------|-------|
| key | TEXT PK | Setting key |
| value | TEXT | Setting value |

### `user_settings`
| Column | Type | Notes |
|--------|------|-------|
| user_email | TEXT NOT NULL | PK part 1 |
| key | TEXT NOT NULL | PK part 2 (e.g. `linearStateMap`) |
| value | TEXT | JSON string or plain value |

### `user_api_keys`
| Column | Type | Notes |
|--------|------|-------|
| user_email | TEXT NOT NULL | PK part 1 |
| key_name | TEXT NOT NULL | PK part 2: `linear_api_key`, `groq_api_key`, `zai_api_key` |
| encrypted_value | TEXT NOT NULL | AES-256-GCM encrypted |
| updated_at | DATETIME | |

---

## Authentication & Per-User Isolation

- **Google OAuth** via `nuxt-auth-utils`. Session contains `{ user: { name, email, avatar } }`.
- **Global middleware** (`middleware/auth.global.ts`) redirects unauthenticated users to `/login`.
- **All server API handlers** call `getSessionEmail(event)` (from `server/utils/session-email.ts`) which calls `requireUserSession(event)` and returns the email.
- **All DB queries** include `WHERE user_email = ?` to scope data.
- **API keys** are AES-256-GCM encrypted using a key derived from `NUXT_SESSION_PASSWORD` via `scrypt`. The client never sees plaintext keys — only booleans for "configured or not".
- **Client-side config** in localStorage is keyed as `voice-to-task-config-${email}`.

---

## Server API Reference

All endpoints require an authenticated session unless otherwise noted.

### Auth Routes (`server/routes/auth/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/google` | Google OAuth initiation/callback |
| POST | `/auth/logout` | Clear session, redirect to /login |

### User API Keys (`server/api/user-keys/`)
| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/user-keys` | — | `{ linear_api_key: bool, groq_api_key: bool, zai_api_key: bool }` |
| PUT | `/api/user-keys` | `{ [keyName]: string }` | `{ ok: true }` |

Empty string value = delete the key.

### Entries (`server/api/entries/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/entries?status=&limit=50` | List user's entries, newest first |
| POST | `/api/entries` | Create entry `{ text }` → `status=draft, task_status=TRIAGE` |
| PATCH | `/api/entries/:id` | Update: `text, linear_issue_id, linear_issue_key, linear_issue_url, status, task_status, assigned_to` |
| DELETE | `/api/entries/:id` | Delete entry (ownership verified) |

### Tasks — Agent API (`server/api/tasks/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tasks?task_status=&assigned_to=&limit=` | List tasks (simplified entry fields) |
| GET | `/api/tasks/:id` | Get single task |
| PATCH | `/api/tasks/:id/status` | Update `{ task_status, assigned_to? }` — triggers Linear sync |

Task fields returned: `id, text, task_status, assigned_to, linear_issue_key, linear_issue_url, created_at, updated_at`.

### Contexts (`server/api/contexts/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/contexts` | List user's contexts, ordered by name |
| POST | `/api/contexts` | Create `{ name, content? }` |
| PATCH | `/api/contexts/:id` | Update `name` and/or `content` |
| DELETE | `/api/contexts/:id` | Delete (ownership verified) |

### Settings (`server/api/settings/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/settings` | All user settings as `Record<string, string>` |
| PATCH | `/api/settings` | Upsert key-value pairs for the user |

Reads/writes from `user_settings` table.

### Linear (`server/api/linear/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/linear/me` | Current Linear user `{ id, name, email }` |
| GET | `/api/linear/teams` | List teams `[{ id, name, key }]` |
| POST | `/api/linear/create-issue` | Create issue `{ title, teamId, assigneeId, description? }` |

All require the user's `linear_api_key` to be configured.

### AI Plan Generation (`server/api/ai/`)
| Method | Path | Body |
|--------|------|------|
| POST | `/api/ai/action-plan` | `{ text, language, model, engine, contextIds[] }` |

Returns `{ title, plan }`. Supports engines `groq` and `zai`. Injects active context documents into the LLM prompt.

### Transcription
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/transcribe?engine=groq\|zai` | Multipart `file` + `language` |

- Groq: `whisper-large-v3-turbo`
- ZAI: `glm-asr-2512`

Returns `{ text }`.

---

## TypeScript Types (`types/index.ts`)

```ts
type TaskStatus = 'TRIAGE' | 'TODO' | 'IN_PROGRESS' | 'DONE'
type LinearStateType = 'triage' | 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled'

interface Entry {
  id: number; text: string; linear_issue_id/key/url: string | null
  status: 'draft' | 'sent'; task_status: TaskStatus; assigned_to: string | null
  created_at: string; updated_at: string
}

interface Task {
  id: number; text: string; task_status: TaskStatus; assigned_to: string | null
  linear_issue_key/url: string | null; created_at: string; updated_at: string
}

interface AppConfig {
  teamId, teamName, assigneeId, assigneeName: string
  language: string; sttEngine: 'browser' | 'groq' | 'zai'
  groqModel, zaiModel: string; autoMode: boolean
  activeContextIds: number[]; uiLanguage: 'en' | 'es'
  theme: 'system' | 'light' | 'dark'
  linearStateMap: Record<TaskStatus, LinearStateType>
}

interface Context { id: number; name: string; content: string; created_at; updated_at }
interface LinearTeam { id: string; name: string; key: string }
interface LinearUser { id: string; name: string; email: string }
interface Toast { id: number; type: 'success'|'error'|'info'; message: string; link?; duration? }
```

---

## Key Architecture Patterns

### 1. Per-user data isolation
Every DB query filters by `user_email` extracted from the session. The `getSessionEmail(event)` helper in `server/utils/session-email.ts` is the standard way to get the authenticated user's email in any API handler.

### 2. Encrypted API key storage
User API keys (Linear, Groq, ZAI) are AES-256-GCM encrypted at rest. The encryption key is derived from `NUXT_SESSION_PASSWORD` via `scrypt`. The client only sees booleans indicating whether each key is configured.

### 3. Idempotent DB migrations
All schema changes run in `server/utils/db.ts` via `useDB()`. Use `pragma('table_info(table)')` to check if columns exist before `ALTER TABLE`. Use `CREATE TABLE IF NOT EXISTS` for new tables. Never drop or rename existing tables — add new ones.

### 4. Dual STT engines
Browser Web Speech API (real-time, Chrome/Edge only) and server-side transcription via Groq Whisper or ZAI GLM-ASR (any browser). Both composables (`useSpeechToText`, `useGroqSpeechToText`) expose the same interface: `{ transcript, interimText, isListening, isSupported, error, start, stop, reset }`.

### 5. Dual LLM engines
Groq (OpenAI-compatible API) and ZAI (GLM models). The engine choice determines which API key is used for both transcription and AI plan generation.

### 6. Linear sync
`syncTaskStatusToLinear()` maps `TaskStatus` to Linear workflow state types using a per-user configurable `linearStateMap` (stored in `user_settings`). It's fire-and-forget — errors are logged, never propagated.

### 7. Config storage
`AppConfig` is stored in `localStorage` (keyed by user email) for client-side settings. The `linearStateMap` is also persisted server-side in `user_settings` so that `linear-sync.ts` can read it during server-side status updates.

### 8. Auto mode pipeline
When enabled: stop recording → `generatePlan()` → `sendToLinear()` — fully automated voice-to-Linear-issue flow.

### 9. Nuxt auto-imports
Nuxt auto-imports Vue APIs (`ref`, `computed`, `watch`, etc.), composables from `composables/`, server utilities from `server/utils/`, and Nuxt helpers (`defineEventHandler`, `createError`, `getQuery`, `readBody`, `getRouterParam`, `navigateTo`, `useState`, `useUserSession`, `requireUserSession`, `getUserSession`). You don't need explicit imports for these.

---

## Environment Variables

```env
# Required for auth
NUXT_SESSION_PASSWORD=at-least-32-characters-long-random-string
NUXT_OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

API keys (Linear, Groq, ZAI) are per-user and managed through the Config > API Keys UI, not env vars.

---

## Conventions

- **Language:** TypeScript everywhere. Vue 3 `<script setup>` + Composition API.
- **API handlers:** Use `defineEventHandler`, always call `getSessionEmail(event)` first for auth + email.
- **DB access:** Always use `useDB()` to get the singleton connection.
- **Error handling:** Use `createError({ statusCode, message })` for HTTP errors.
- **Ownership checks:** Always verify `WHERE id = ? AND user_email = ?` before update/delete.
- **New DB columns:** Add via idempotent `ALTER TABLE` with column existence check.
- **New DB tables:** Use `CREATE TABLE IF NOT EXISTS`.
- **Composable interface:** STT composables must return `{ transcript, interimText, isListening, isSupported, error, start, stop, reset }`.
- **i18n:** Add translations to both `en` and `es` dictionaries in `composables/useI18n.ts`.
- **Commit messages:** Concise, imperative, focused on "why". End with `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` if AI-generated.

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
