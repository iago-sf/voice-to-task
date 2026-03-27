# Voice to Task

App that captures voice via the browser microphone, transcribes it to text, and creates tasks in [Linear](https://linear.app). Optionally generates an AI-powered action plan before sending. All data is stored in a SQLite-compatible database (local file or [Turso](https://turso.tech) for cloud/serverless deployment) with direct links to the created Linear issues.

Built with **Nuxt 3**, **Vue 3**, **@libsql/client** (Turso/libSQL), **Linear SDK**, **Groq API**, **Z.ai API**, **MiniMax API**, **marked**, **DOMPurify**, and **nuxt-auth-utils**.

## Features

- **Google OAuth authentication** — login with your Google account; all data is isolated per user
- **Per-user API key management** — each user configures their own Linear, Groq, Z.ai, and MiniMax keys from the Config page (encrypted at rest)
- **Voice-to-text** via Web Speech API (Chrome/Edge), Groq Whisper, or Z.ai GLM-ASR (any browser)
- **AI action plan generation** — turns raw voice notes into structured task plans with a summary title, questions for the developer when info is missing, and a reusable context document for future tasks (powered by Groq, Z.ai GLM, or MiniMax, model configurable)
- **Independent STT and LLM engine selection** — choose one engine for audio transcription and a different one for text generation (e.g., browser STT + Groq LLM, or Groq Whisper + MiniMax)
- **Mobile-first UI** — responsive layout with hero/compact record button, toolbar with action icons, horizontal-scrolling pills, and smooth transitions
- **Markdown preview** — toggle between editing and rendered markdown preview for generated plans
- **Auto mode** — record, generate plan, and send to Linear in one step
- **Contexts** — create multiple markdown documents (project info, conventions, stack details) that get injected into the LLM prompt for more relevant plans
- **Task status tracking** — entries have a task status (Triage / TODO / In Progress / Done) with colored badges and filters in history
- **Configurable Linear state mapping** — map each task status to a Linear workflow state type (triage, backlog, unstarted, started, completed, canceled) from the config UI
- **Agent Task API** — REST endpoints for AI agents to discover, claim, and update tasks with automatic Linear sync
- **History** in SQLite/Turso with status tracking, Linear issue links, and retry for failed sends
- **Theme support** — system, light, and dark mode
- **i18n** — English and Spanish UI
- **Editable custom prompt** — the default plan generation prompt is shown as editable text, so users can make small tweaks without rewriting from scratch

## Prerequisites

- **Node.js** >= 18
- A **Google OAuth** client ID and secret (for authentication)
- A **Linear API key** (per user, configured in-app)
- A **Groq API key**, **Z.ai API key**, and/or **MiniMax API key** (per user, configured in-app)

## Setup

### 1. Clone the repository

```bash
git clone git@github.com:iago-sf/voice-to-linear-task.git
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
1. Enter your **Linear API key** — [Linear Settings > API](https://linear.app/settings/api)
2. Enter your **Groq API key** (optional) — [console.groq.com/keys](https://console.groq.com/keys)
3. Enter your **Z.ai API key** (optional) — [z.ai](https://z.ai)
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
   - **Z.ai GLM** — any browser, requires Z.ai API key, uses GLM-ASR-2512
2. Choose the **text generation engine** (LLM) — independent from STT:
   - **Groq** — inference models via API, defaults to `openai/gpt-oss-120b` (see [available models](https://console.groq.com/docs/models))
   - **Z.ai** — GLM models, defaults to `glm-4-plus`
   - **MiniMax** — reasoning models, defaults to `MiniMax-M2.7` (see [available models](https://platform.minimax.io/docs/api-reference/text-post))
3. Choose the **speech recognition language** (Spanish, English, Portuguese, Catalan, Galician, Basque)

**User preferences tab:**
1. Enable/disable **auto mode**
2. Choose **UI language** (English / Spanish)
3. Choose **theme** (System / Light / Dark)

## Usage

### Basic flow

1. Press the **microphone button** to start recording, or **type directly** in the textarea
2. Speak — the transcript appears in real time (Web Speech API) or after stopping (Groq/ZAI)
3. **Edit** the text if needed — once there's text, a compact toolbar appears with all actions
4. Press **Generate plan** (lightbulb icon) to generate an AI action plan with a summary title
5. Toggle the **eye icon** to preview the rendered markdown
6. Press **Send to Linear** (or choose copy/save from the dropdown) to create the task
7. The issue is created in Linear with **triage** status and assigned to you

### Auto mode

When enabled, stopping the recording automatically triggers the full pipeline:

**Record** → **Generate plan** → **Send to Linear**

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
├── middleware/
│   └── auth.global.ts     # Redirect unauthenticated users to /login
├── server/
│   ├── routes/auth/        # Google OAuth callback + logout
│   ├── api/entries/        # SQLite CRUD for entries (scoped by user)
│   ├── api/contexts/       # SQLite CRUD for context documents (scoped by user)
│   ├── api/tasks/          # Agent Task API (list, get, update status)
│   ├── api/settings/       # Per-user settings (GET, PATCH)
│   ├── api/user-keys/      # Per-user encrypted API key management
│   ├── api/linear/         # Linear SDK endpoints (create-issue, teams, me)
│   ├── api/ai/             # LLM action plan generation (Groq / ZAI / MiniMax)
│   ├── api/transcribe.post.ts  # Audio transcription (Groq Whisper / ZAI GLM-ASR)
│   └── utils/
│       ├── db.ts           # libSQL/Turso connection, schema init, migrations
│       ├── session-email.ts # Helper to extract user email from session
│       ├── user-keys.ts    # Encrypted API key storage/retrieval
│       └── linear-sync.ts  # Sync task status to Linear workflow states
├── composables/
│   ├── useSpeechToText.ts      # Web Speech API wrapper
│   ├── useGroqSpeechToText.ts  # MediaRecorder + API transcription (Groq/ZAI)
│   ├── useConfig.ts            # App config in localStorage (keyed by user email)
│   ├── useTheme.ts             # System/light/dark theme management
│   ├── useI18n.ts              # i18n (en/es)
│   └── useToast.ts             # Toast notification system
├── components/             # EntryCard, NavBar, SplitActionButton, ToastContainer
└── types/index.ts          # Shared TypeScript interfaces
```

## Tech stack

- **Nuxt 3** — Full-stack Vue framework
- **nuxt-auth-utils** — Google OAuth authentication + session management
- **@libsql/client** — SQLite-compatible database via [Turso](https://turso.tech)/libSQL (local file or remote)
- **@linear/sdk** — Linear GraphQL API client
- **Groq API** — Whisper transcription + LLM plan generation
- **Z.ai API** — GLM-ASR transcription + GLM chat models
- **MiniMax API** — MiniMax reasoning models for plan generation
- **Web Speech API** — Browser-native speech recognition (Chromium)
- **marked** + **DOMPurify** — Markdown rendering with XSS sanitization
- **Tailwind CSS** — Utility-first styling via CDN (with dark mode support)

## License

[MIT](LICENSE)
