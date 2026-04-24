# Voice to Task

[![Documentation](https://img.shields.io/badge/docs-zread.ai-blue?style=flat-square&logo=read-the-docs)](https://zread.ai/iago-sf/voice-to-task)

App that captures voice via the browser microphone, transcribes it to text, and creates tasks in [Linear](https://linear.app). Optionally generates an AI-powered action plan before sending. Runs as both a web app and an **Electron desktop app**. All data is stored in a SQLite-compatible database (local file or [Turso](https://turso.tech) for cloud/serverless deployment) with direct links to the created Linear issues.

Built with **Nuxt 4**, **Vue 3**, **@libsql/client** (Turso/libSQL), **Linear SDK**, **Groq API**, **Z.ai API**, **MiniMax API**, **marked**, **DOMPurify**, **nuxt-auth-utils**, and **Electron**.

## Features

- **Google OAuth authentication** — login with your Google account; all data is isolated per user
- **Electron desktop app** — run as a native desktop app with local SQLite, no login required (optional Google OAuth)
- **Auto-update** — desktop app checks for updates on GitHub Releases and prompts to restart
- **Per-user API key management** — each user configures their own Linear, Groq, Z.ai, and MiniMax keys from the Config page (encrypted at rest)
- **Voice-to-text** via Web Speech API (Chrome/Edge), Groq Whisper (any browser)
- **AI action plan generation** — turns raw voice notes into structured task plans with a summary title, questions for the developer when info is missing, and a reusable context document for future tasks (powered by Groq, Z.ai GLM, or MiniMax, model configurable)
- **Independent STT and LLM engine selection** — choose one engine for audio transcription and a different one for text generation (e.g., browser STT + Groq LLM, or Groq Whisper + MiniMax)
- **Chat-based UI** — conversational interface with streaming AI responses, bottom input bar, and right sidebar for contexts/labels/projects
- **Project contexts** — link local project folders; the AI uses MCP-style tools (list files, search code, read files, git log) to explore the codebase and generate context-aware plans
- **Contexts** — create multiple markdown documents (project info, conventions, stack details) that get injected into the LLM prompt for more relevant plans
- **Task status tracking** — entries have a task status (Triage / TODO / In Progress / Done) with colored badges and filters in history
- **Configurable Linear state mapping** — map each task status to a Linear workflow state type (triage, backlog, unstarted, started, completed, canceled) from the config UI
- **Agent Task API** — REST endpoints for AI agents to discover, claim, and update tasks with automatic Linear sync
- **History** in SQLite/Turso with status tracking, Linear issue links, and retry for failed sends
- **Theme support** — system, light, and dark mode
- **Accent color customization** — choose from 6 accent colors (indigo, blue, violet, rose, emerald, amber) that propagate across all interactive elements via CSS custom properties. Developers must use `accent-*` Tailwind classes for any new UI components.
- **i18n** — English and Spanish UI
- **Editable custom prompt** — the default plan generation prompt is shown as editable text, so users can make small tweaks without rewriting from scratch

## Prerequisites

- **Node.js** v22
- A **Google OAuth** client ID and secret (for web authentication, optional for desktop)
- A **Linear API key** (per user, configured in-app)
- A **Groq API key**, **Z.ai coding plan API key**, and/or **MiniMax API key** (per user, configured in-app)

## Setup

### 1. Clone the repository

```bash
git clone git@github.com:iago-sf/voice-to-task.git
cd voice-to-linear-task
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Auth (Google OAuth)
NUXT_SESSION_PASSWORD=at-least-32-characters-long-random-string
NUXT_OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database (optional — defaults to local SQLite file)
# TURSO_DATABASE_URL=libsql://your-db-name-your-org.turso.io
# TURSO_AUTH_TOKEN=your-turso-auth-token
```

- **Session password** — a random string of at least 32 characters used to encrypt session cookies
- **Google OAuth** — create credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Set the authorized redirect URI to `http://localhost:3000/auth/google` for local development.
- **Turso** (optional) — for cloud/serverless deployment. Without these variables, the app uses a local SQLite file at `data/voice-linear.db`.

API keys for Linear, Groq, Z.ai, and MiniMax are no longer set as environment variables — each user configures their own keys from the **Config > API Keys** tab after logging in.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to the login page.

### 5. Initial configuration

After logging in with Google, go to **Config** via the user menu (tap your avatar in the nav bar). Settings are organized in tabs, each accessible by URL (`/config?tab=keys`, `/config?tab=linear`, `/config?tab=ai`, `/config?tab=user`, `/config?tab=tokens`):

**API Keys tab:**
1. Enter your **Linear API key** (optional) — [Linear Settings > API](https://linear.app/settings/api)
2. Enter your **Groq API key** (optional) — [console.groq.com/keys](https://console.groq.com/keys)
3. Enter your **Z.ai API key** (optional) — [z.ai](https://z.ai/manage-apikey/apikey-list)
4. Enter your **MiniMax API key** (optional) — [platform.minimax.io](https://platform.minimax.io)

**Linear tab:**
1. Select your Linear **team**
2. Verify your **user** (auto-detected from the API key)
3. Test the connection
4. Configure **Linear state mapping** — choose which Linear workflow state each task status maps to (defaults: Triage → triage, TODO → unstarted, In Progress → started, Done → completed)

**AI Models tab:**
1. Choose the **transcription engine** (STT):
   - **Web Speech API** — only Chrome/Edge, free, real-time transcription
   - **Groq Whisper** — any browser, requires Groq API key
2. Choose the **text generation engine** (LLM) — independent from STT:
   - **Groq** — inference models via API, defaults to `openai/gpt-oss-120b` (see [available models](https://console.groq.com/docs/models))
   - **Z.ai** — GLM models with coding plan, defaults to `glm-5.1`
   - **MiniMax** — reasoning models, defaults to `MiniMax-M2.7` (see [available models](https://platform.minimax.io/docs/api-reference/text-post))
3. Choose the **speech recognition language** (Spanish, English, Portuguese, Catalan, Galician, Basque)

**User preferences tab:**
1. Enable/disable **auto mode**
2. Choose **UI language** (English / Spanish)
3. Choose **theme** (System / Light / Dark)
4. Choose **accent color** — 6 options: indigo, blue, violet, rose, emerald, amber

## Desktop App (Electron)

The app can also run as an Electron desktop app with local SQLite storage and no login required.

### Development

```bash
npm run dev:electron
```

This builds the Nuxt app with `NUXT_DESKTOP_MODE=true` and launches it in Electron.

### Production Build

```bash
npm run build:electron
```

Produces installers in `dist-electron/`:
- **macOS**: DMG + ZIP
- **Windows**: NSIS installer
- **Linux**: AppImage

### Desktop-specific behavior

- **No login required** — works with `local@desktop` identity by default
- **Local SQLite** — database stored at Electron's `userData` directory
- **Optional Google OAuth** — login link available in navbar to switch to real user identity
- **Auto-update** — checks GitHub Releases for updates on launch
- **Session password** — auto-generated per launch for API key encryption

Configure the GitHub Releases provider in `electron-builder.yml` (`publish.owner` and `publish.repo`).

## Usage

### Basic flow

1. Press the **microphone button** to start recording, or **type directly** in the chat input
2. Speak — the transcript appears in the input field in real time (Web Speech API) or after stopping (Groq/ZAI)
3. **Edit the transcription** if needed, then press **Send** (or Enter)
4. The AI generates a plan automatically — action plans stream as a response with streaming markdown
5. Use **Send to Linear** (or choose copy/save from the dropdown) to create the task
6. The issue is created in Linear with **triage** status and assigned to you

7. Iterate by typing another message to refine the plan

### Auto mode

When enabled, sending a message automatically triggers the full pipeline:

**Send** → **Generate plan** → **Send to Linear**

Toggle it from the main page or from Config.

### Contexts

Contexts are markdown documents that **define your project and take priority** over the LLM's generic knowledge when generating action plans. The LLM will use them to frame the task title, choose the right terminology, and align steps with your stack, tools, and conventions.

1. Go to the **Contexts** page (document icon in nav)
2. Create a new context (e.g., "Project Stack", "Sprint Goals", "Code Conventions")
3. Write markdown content with relevant project information
4. **Activate** the contexts you want to use with the toggle
5. Active contexts are automatically injected into the LLM prompt when generating plans

You can have multiple contexts and activate/deactivate them as needed. Examples:

- **Project definition** — stack, architecture, repo structure, deployment pipeline
- **Sprint context** — current sprint goals, priorities, deadlines
- **Conventions** — naming, commit format, PR process, testing requirements
- **Team** — roles, responsibilities, who owns what

The more specific your contexts are, the better the generated plans will be.

### History

The **History** page shows all entries with:

- Status badges (draft / sent) and task status badges (Triage / TODO / In Progress / Done)
- Direct links to Linear issues
- Filters by send status and task status
- Retry failed sends
- Delete entries

### Agent Task API

REST endpoints at `/api/tasks` allow AI agents to discover, claim, and update tasks. All endpoints require authentication. See the **API** page in the app for full documentation, or copy the docs as Markdown to give to any model.

Task status changes automatically sync to Linear using the configurable state mapping.

### Claude Code MCP Integration

The project includes an MCP (Model Context Protocol) server that lets Claude Code manage tasks directly. Setup:

1. Generate an API token at **Config > Tokens** (`/config?tab=tokens`)
2. Set the environment variable:
   ```bash
   export VOICE_TO_TASK_URL="https://voice-to-task-taupe.vercel.app"
   export VOICE_TO_TASK_TOKEN="vtk_your_token_here"
   ```
3. The `.mcp.json` at the project root auto-configures the MCP server for Claude Code

Available tools: `list_tasks`, `get_task`, `update_task_status`. The workflow is: pick a TODO task → claim it with IN_PROGRESS + your agent name → do the work → mark DONE.

### Data isolation

Each authenticated user sees only their own data:

- **Entries** and **contexts** are scoped by `user_email` in the database
- **Settings** (like Linear state mapping) use a separate `user_settings` table keyed by `(user_email, key)`
- **API keys** are stored encrypted per user in `user_api_keys`
- **Client-side config** in localStorage is keyed by user email

### Keyboard shortcuts

- **Space** (when textarea is not focused) — start/stop recording

## Project structure

```
├── pages/
│   ├── index.vue          # Record + generate plan + send to Linear
│   ├── login.vue          # Google OAuth login page
│   ├── history.vue        # Entry history with filters
│   ├── contexts.vue       # Manage markdown context documents
│   ├── config.vue         # Tabbed settings (Linear, AI Models, API Keys, User prefs)
│   └── api-docs.vue       # Agent Task API documentation
├── electron/
│   ├── main.js            # Electron main process (spawns Nitro, creates BrowserWindow)
│   ├── preload.js         # Context bridge (exposes __electron to renderer)
│   ├── types.ts           # TypeScript interface for ElectronBridge
│   └── compile-main.js    # Build helper (validates files before electron-builder)
├── middleware/
│   └── auth.global.ts     # Redirect unauthenticated users to /login (skipped in desktop mode)
├── server/
│   ├── routes/auth/        # Google OAuth callback + logout
│   ├── api/entries/        # SQLite CRUD for entries (scoped by user)
│   ├── api/contexts/       # SQLite CRUD for context documents (scoped by user)
│   ├── api/tasks/          # Agent Task API (list, get, update status)
│   ├── api/settings/       # Per-user settings (GET, PATCH)
│   ├── api/user-keys/      # Per-user encrypted API key management
│   ├── api/linear/         # Linear SDK endpoints (create-issue, teams, me)
│   ├── api/ai/             # LLM action plan generation (Groq / ZAI / MiniMax)
│   ├── api/transcribe.post.ts  # Audio transcription (Groq Whisper)
│   └── utils/
│       ├── db.ts           # libSQL/Turso connection, schema init, migrations (dual mode)
│       ├── session-email.ts # Helper to extract user email (with desktop fallback)
│       ├── user-keys.ts    # Encrypted API key storage/retrieval
│       └── linear-sync.ts  # Sync task status to Linear workflow states
├── composables/
│   ├── useSpeechToText.ts      # Web Speech API wrapper
│   ├── useGroqSpeechToText.ts  # MediaRecorder + API transcription (Groq/ZAI)
│   ├── useConfig.ts            # App config in localStorage (keyed by user email)
│   ├── useDesktopMode.ts       # Detect Electron desktop mode
│   ├── useTheme.ts             # System/light/dark theme + accent color management
│   ├── useI18n.ts              # i18n (en/es)
│   └── useToast.ts             # Toast notification system
├── components/             # EntryCard, NavBar, SplitActionButton, ToastContainer
└── types/index.ts          # Shared TypeScript interfaces
```

## Tech stack

- **Nuxt 4** — Full-stack Vue framework
- **Electron** — Desktop app packaging with auto-update
- **nuxt-auth-utils** — Google OAuth authentication + session management
- **@libsql/client** — SQLite-compatible database via [Turso](https://turso.tech)/libSQL (local file or remote)
- **@linear/sdk** — Linear GraphQL API client
- **Groq API** — Whisper transcription + LLM plan generation
- **Z.ai API** — GLM reasoning models for plan generation
- **MiniMax API** — MiniMax reasoning models for plan generation
- **Web Speech API** — Browser-native speech recognition (Chromium)
- **marked** + **DOMPurify** — Markdown rendering with XSS sanitization
- **Tailwind CSS** — Utility-first styling via CDN (with dark mode support)

## License

[MIT](LICENSE)
