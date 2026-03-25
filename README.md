# Voice to Task

Local app that captures voice via the browser microphone, transcribes it to text, and creates tasks in [Linear](https://linear.app). Optionally generates an AI-powered action plan before sending. All transcriptions are saved locally in SQLite with direct links to the created Linear issues.

Built with **Nuxt 3**, **Vue 3**, **better-sqlite3**, **Linear SDK**, **Groq API**, and **Z.ai API**.

## Features

- **Voice-to-text** via Web Speech API (Chrome/Edge), Groq Whisper, or Z.ai GLM-ASR (any browser)
- **AI action plan generation** — turns raw voice notes into structured task plans with a summary title (powered by Groq LLM or Z.ai GLM, model configurable)
- **Auto mode** — record, generate plan, and send to Linear in one step
- **Contexts** — create multiple markdown documents (project info, conventions, stack details) that get injected into the LLM prompt for more relevant plans
- **Task status tracking** — entries have a task status (Triage / TODO / In Progress / Done) with colored badges and filters in history
- **Configurable Linear state mapping** — map each task status to a Linear workflow state type (triage, backlog, unstarted, started, completed, canceled) from the config UI
- **Agent Task API** — REST endpoints for AI agents to discover, claim, and update tasks with automatic Linear sync
- **Local history** in SQLite with status tracking, Linear issue links, and retry for failed sends
- **Theme support** — system, light, and dark mode
- **i18n** — English and Spanish UI
- **Tabbed config** — settings organized into Linear, AI Models, and User preferences tabs

## Prerequisites

- **Node.js** >= 18
- A **Linear API key**
- A **Groq API key** and/or a **Z.ai API key** (for transcription and AI plan generation)

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
LINEAR_API_KEY=lin_api_XXXXXXXXXXXXXXXXXXXXXXXXX
GROQ_API_KEY=gsk_XXXXXXXXXXXXXXXXXXXXXXXXX
ZAI_API_KEY=your_zai_api_key_here
```

- **Linear API key** — [Linear Settings > API](https://linear.app/settings/api), create a new personal key
- **Groq API key** — [console.groq.com/keys](https://console.groq.com/keys), free tier available
- **Z.ai API key** — [z.ai](https://z.ai), provides GLM-ASR (speech-to-text) and GLM chat models

You only need one of Groq or Z.ai — configure whichever you prefer.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Initial configuration

Go to the **Config** page (gear icon). Settings are organized in three tabs:

**Linear tab:**
1. Select your Linear **team**
2. Verify your **user** (auto-detected from the API key)
3. Test the connection
4. Configure **Linear state mapping** — choose which Linear workflow state each task status maps to (defaults: Triage → triage, TODO → unstarted, In Progress → started, Done → completed)

**AI Models tab:**
1. Choose the **speech recognition engine**:
   - **Web Speech API** — only Chrome/Edge, free, real-time transcription
   - **Groq Whisper** — any browser, requires Groq API key
   - **Z.ai GLM** — any browser, requires Z.ai API key, uses GLM-ASR-2512 for STT and GLM models for plan generation
2. Set the **LLM model** for plan generation:
   - Groq: defaults to `openai/gpt-oss-120b` (see [available models](https://console.groq.com/docs/models))
   - Z.ai: defaults to `glm-4-plus`
3. Choose the **speech recognition language** (Spanish, English, Portuguese, Catalan, Galician, Basque)

**User preferences tab:**
1. Enable/disable **auto mode**
2. Choose **UI language** (English / Spanish)
3. Choose **theme** (System / Light / Dark)

## Usage

### Basic flow

1. Press the **microphone button** to start recording
2. Speak — the transcript appears in real time (Web Speech API) or after stopping (Groq/ZAI)
3. **Edit** the text if needed
4. Press **Generate plan** to generate an AI action plan with a summary title
5. Press **Send to Linear** to create the task (first line = title, rest = description)
6. The issue is created in Linear with **triage** status and assigned to you

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

REST endpoints at `/api/tasks` allow AI agents to discover, claim, and update tasks. See the **API** page in the app for full documentation, or copy the docs as Markdown to give to any model.

Task status changes automatically sync to Linear using the configurable state mapping.

### Keyboard shortcuts

- **Space** (when textarea is not focused) — start/stop recording

## Project structure

```
├── pages/
│   ├── index.vue          # Record + generate plan + send to Linear
│   ├── history.vue        # Entry history with filters
│   ├── contexts.vue       # Manage markdown context documents
│   ├── config.vue         # Tabbed settings (Linear, AI Models, User prefs)
│   └── api-docs.vue       # Agent Task API documentation
├── server/
│   ├── api/entries/        # SQLite CRUD for entries
│   ├── api/contexts/       # SQLite CRUD for context documents
│   ├── api/tasks/          # Agent Task API (list, get, update status)
│   ├── api/settings/       # Server-side settings (GET, PATCH)
│   ├── api/linear/         # Linear SDK endpoints (create-issue, teams, me)
│   ├── api/ai/             # LLM action plan generation (Groq / ZAI)
│   ├── api/transcribe.post.ts  # Audio transcription (Groq Whisper / ZAI GLM-ASR)
│   └── utils/
│       ├── db.ts           # SQLite connection, migrations, settings table
│       └── linear-sync.ts  # Sync task status to Linear workflow states
├── composables/
│   ├── useSpeechToText.ts      # Web Speech API wrapper
│   ├── useGroqSpeechToText.ts  # MediaRecorder + API transcription (Groq/ZAI)
│   ├── useConfig.ts            # App config in localStorage
│   ├── useTheme.ts             # System/light/dark theme management
│   ├── useI18n.ts              # i18n (en/es)
│   └── useToast.ts             # Toast notification system
├── components/             # EntryCard, NavBar, ToastContainer
└── types/index.ts          # Shared TypeScript interfaces
```

## Tech stack

- **Nuxt 3** — Full-stack Vue framework
- **better-sqlite3** — Local SQLite database (`data/voice-linear.db`)
- **@linear/sdk** — Linear GraphQL API client
- **Groq API** — Whisper transcription + LLM plan generation
- **Z.ai API** — GLM-ASR transcription + GLM chat models
- **Web Speech API** — Browser-native speech recognition (Chromium)
- **Tailwind CSS** — Utility-first styling (with dark mode support)

## License

[MIT](LICENSE)
