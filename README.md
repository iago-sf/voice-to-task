# Voice to Linear

Local app that captures voice via the browser microphone, transcribes it to text, and creates tasks in [Linear](https://linear.app) with triage status. Optionally generates an AI-powered action plan before sending. All transcriptions are saved locally in SQLite with direct links to the created Linear issues.

Built with **Nuxt 3**, **Vue 3**, **better-sqlite3**, **Linear SDK**, and **Groq API**.

## Features

- **Voice-to-text** via Web Speech API (Chrome/Edge) or Groq Whisper (any browser)
- **AI action plan generation** — turns raw voice notes into structured task plans with a summary title (powered by Groq LLM, model configurable)
- **Auto mode** — record, generate plan, and send to Linear in one step
- **Contexts** — create multiple markdown documents (project info, conventions, stack details) that get injected into the LLM prompt for more relevant plans
- **Local history** in SQLite with status tracking, Linear issue links, and retry for failed sends
- **Dark mode** UI, responsive, keyboard shortcuts

## Prerequisites

- **Node.js** >= 18
- A **Linear API key**
- A **Groq API key** (for Whisper transcription and/or AI plan generation)

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
```

- **Linear API key** — [Linear Settings > API](https://linear.app/settings/api), create a new personal key
- **Groq API key** — [console.groq.com/keys](https://console.groq.com/keys), free tier available

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Initial configuration

Go to the **Config** page (gear icon) to:

1. Select your Linear **team**
2. Verify your **user** (auto-detected from the API key)
3. Choose the **speech recognition engine**:
   - **Web Speech API** — only Chrome/Edge, free, real-time transcription
   - **Groq Whisper** — any browser (including Firefox), requires Groq API key
4. Choose the **speech recognition language** (Spanish, English, Portuguese, Catalan, Galician, Basque)
5. Set the **LLM model** for plan generation (defaults to `openai/gpt-oss-120b`, see [available models](https://console.groq.com/docs/models))
6. Enable/disable **auto mode**

## Usage

### Basic flow

1. Press the **microphone button** to start recording
2. Speak — the transcript appears in real time (Web Speech API) or after stopping (Groq Whisper)
3. **Edit** the text if needed
4. Press **Generar plan** to generate an AI action plan with a summary title
5. Press **Enviar a Linear** to create the task (first line = title, rest = description)
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

The more specific your contexts are, the better the generated plans will be. For example, if your context says "Backend in Go with Chi router, deployed on Fly.io", a task like "add user authentication" will produce steps referencing Go, Chi middleware, and Fly.io deploy — not generic advice.

### History

The **History** page shows all entries with:

- Status badges (draft / sent)
- Direct links to Linear issues
- Filters by status
- Retry failed sends
- Delete entries

### Keyboard shortcuts

- **Space** (when textarea is not focused) — start/stop recording

## Project structure

```
├── pages/
│   ├── index.vue          # Record + generate plan + send to Linear
│   ├── history.vue        # Entry history with filters
│   ├── contexts.vue       # Manage markdown context documents
│   └── config.vue         # All settings (Linear, STT engine, LLM model, auto mode)
├── server/
│   ├── api/entries/        # SQLite CRUD for entries
│   ├── api/contexts/       # SQLite CRUD for context documents
│   ├── api/linear/         # Linear SDK endpoints (create-issue, teams, me)
│   ├── api/ai/             # LLM action plan generation (Groq)
│   ├── api/transcribe.post.ts  # Audio transcription via Groq Whisper
│   └── utils/db.ts         # SQLite connection and migrations
├── composables/
│   ├── useSpeechToText.ts      # Web Speech API wrapper
│   ├── useGroqSpeechToText.ts  # MediaRecorder + Groq Whisper wrapper
│   ├── useConfig.ts            # App config in localStorage
│   └── useToast.ts             # Toast notification system
├── components/             # EntryCard, NavBar, ToastContainer
└── types/index.ts          # Shared TypeScript interfaces
```

## Tech stack

- **Nuxt 3** — Full-stack Vue framework
- **better-sqlite3** — Local SQLite database (`data/voice-linear.db`)
- **@linear/sdk** — Linear GraphQL API client
- **Groq API** — Whisper transcription + LLM plan generation
- **Web Speech API** — Browser-native speech recognition (Chromium)
- **Tailwind CSS** — Utility-first styling

## License

[MIT](LICENSE)
