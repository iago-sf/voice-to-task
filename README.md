# Voice to Linear

Local app that captures voice via the browser microphone, transcribes it to text using the Web Speech API, and creates tasks in [Linear](https://linear.app) with triage status. All transcriptions are saved locally in SQLite with direct links to the created Linear issues.

Built with **Nuxt 3**, **Vue 3**, **better-sqlite3**, and the **Linear SDK**.

## Prerequisites

- **Node.js** >= 18
- **Chromium-based browser** (Chrome, Edge) — required for Web Speech API
- A **Linear API key**

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

Edit `.env` and add your Linear API key:

```env
LINEAR_API_KEY=lin_api_XXXXXXXXXXXXXXXXXXXXXXXXX
```

To get your API key, go to [Linear Settings > API](https://linear.app/settings/api) and create a new personal key.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome or Edge.

### 5. Initial configuration

On first launch, go to the **Config** page (gear icon) to:

1. Select your Linear **team**
2. Verify your **user** (auto-detected from the API key)
3. Choose the **speech recognition language** (defaults to Spanish)

## Usage

1. Press the **microphone button** to start recording
2. Speak — the transcript appears in real time
3. **Edit** the text if needed (first line becomes the issue title, rest becomes the description)
4. Press **Enviar a Linear** to create the task
5. The issue is created in Linear with **triage** status and assigned to you
6. Check the **History** page to see all entries with direct links to Linear

## Project structure

```
├── pages/
│   ├── index.vue          # Record + send to Linear
│   ├── history.vue        # Entry history with filters
│   └── config.vue         # Linear team/user/language settings
├── server/
│   ├── api/entries/        # SQLite CRUD (GET, POST, PATCH, DELETE)
│   ├── api/linear/         # Linear SDK endpoints (create-issue, teams, me)
│   └── utils/db.ts         # SQLite connection (better-sqlite3)
├── composables/
│   ├── useSpeechToText.ts  # Web Speech API wrapper
│   ├── useConfig.ts        # App config in localStorage
│   └── useToast.ts         # Toast notification system
├── components/             # EntryCard, NavBar, ToastContainer
└── types/index.ts          # Shared TypeScript interfaces
```

## Tech stack

- **Nuxt 3** — Full-stack Vue framework
- **better-sqlite3** — Local SQLite database (stored in `data/voice-linear.db`)
- **@linear/sdk** — Linear GraphQL API client
- **Web Speech API** — Browser-native speech recognition
- **Tailwind CSS** — Utility-first styling

## License

[MIT](LICENSE)
