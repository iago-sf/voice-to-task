<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold">{{ t('apiDocs.title') }}</h1>
      <button
        class="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
        @click="copyMarkdown"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
        {{ copied ? t('apiDocs.copied') : t('apiDocs.copyMd') }}
      </button>
    </div>

    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">{{ t('apiDocs.description') }}</p>

    <!-- Authentication -->
    <section class="mb-6">
      <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{{ t('apiDocs.authTitle') }}</h2>
      <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">{{ t('apiDocs.authDesc') }}</p>
        <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{{ t('apiDocs.authHeader') }}</h4>
        <pre class="bg-gray-100 dark:bg-gray-950 rounded p-3 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">Authorization: Bearer vtk_&lt;your-token&gt;</pre>
      </div>
    </section>

    <!-- GET /api/tasks -->
    <section class="mb-6">
      <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <span class="px-2 py-0.5 bg-emerald-900 text-emerald-300 text-xs font-mono font-bold rounded">GET</span>
          <code class="text-sm text-gray-800 dark:text-gray-200">/api/tasks</code>
        </div>
        <div class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          <p class="mb-3">{{ t('apiDocs.listDesc') }}</p>
          <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Query params</h4>
          <div class="space-y-1 mb-3">
            <div class="flex gap-2">
              <code class="text-accent-400 text-xs">task_status</code>
              <span class="text-xs text-gray-500">— TRIAGE | TODO | IN_PROGRESS | DONE</span>
            </div>
            <div class="flex gap-2">
              <code class="text-accent-400 text-xs">assigned_to</code>
              <span class="text-xs text-gray-500">— {{ t('apiDocs.filterAgent') }}</span>
            </div>
            <div class="flex gap-2">
              <code class="text-accent-400 text-xs">limit</code>
              <span class="text-xs text-gray-500">— {{ t('apiDocs.maxResults') }}</span>
            </div>
          </div>
          <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{{ t('apiDocs.example') }}</h4>
          <pre class="bg-gray-100 dark:bg-gray-950 rounded p-3 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">curl -H "Authorization: Bearer $TOKEN" \
  {{ baseUrl }}/api/tasks?task_status=TODO&amp;limit=5</pre>
        </div>
      </div>
    </section>

    <!-- GET /api/tasks/:id -->
    <section class="mb-6">
      <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <span class="px-2 py-0.5 bg-emerald-900 text-emerald-300 text-xs font-mono font-bold rounded">GET</span>
          <code class="text-sm text-gray-800 dark:text-gray-200">/api/tasks/:id</code>
        </div>
        <div class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          <p class="mb-3">{{ t('apiDocs.detailDesc') }}</p>
          <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{{ t('apiDocs.example') }}</h4>
          <pre class="bg-gray-100 dark:bg-gray-950 rounded p-3 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">curl -H "Authorization: Bearer $TOKEN" \
  {{ baseUrl }}/api/tasks/7</pre>
        </div>
      </div>
    </section>

    <!-- PATCH /api/tasks/:id/status -->
    <section class="mb-6">
      <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <span class="px-2 py-0.5 bg-amber-900 text-amber-300 text-xs font-mono font-bold rounded">PATCH</span>
          <code class="text-sm text-gray-800 dark:text-gray-200">/api/tasks/:id/status</code>
        </div>
        <div class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          <p class="mb-3">{{ t('apiDocs.statusDesc') }}</p>
          <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Body (JSON)</h4>
          <div class="space-y-1 mb-3">
            <div class="flex gap-2">
              <code class="text-accent-400 text-xs">task_status</code>
              <span class="text-xs text-red-400">({{ t('apiDocs.required') }})</span>
              <span class="text-xs text-gray-500">— TRIAGE | TODO | IN_PROGRESS | DONE</span>
            </div>
            <div class="flex gap-2">
              <code class="text-accent-400 text-xs">assigned_to</code>
              <span class="text-xs text-gray-500">— {{ t('apiDocs.agentId') }}</span>
            </div>
          </div>
          <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{{ t('apiDocs.example') }}</h4>
          <pre class="bg-gray-100 dark:bg-gray-950 rounded p-3 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">curl -X PATCH {{ baseUrl }}/api/tasks/7/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"task_status": "IN_PROGRESS", "assigned_to": "claude-code"}'</pre>
        </div>
      </div>
    </section>

    <!-- Response shape -->
    <section class="mb-6">
      <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{{ t('apiDocs.responseShape') }}</h2>
      <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div class="px-4 py-3">
          <pre class="bg-gray-100 dark:bg-gray-950 rounded p-3 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">{
  "id": 7,
  "text": "Implement auth flow for the mobile app",
  "task_status": "IN_PROGRESS",
  "assigned_to": "claude-code",
  "linear_issue_key": "PROJ-42",
  "linear_issue_url": "https://linear.app/team/issue/PROJ-42",
  "created_at": "2026-03-25T10:00:00.000Z",
  "updated_at": "2026-03-25T10:05:00.000Z"
}</pre>
        </div>
      </div>
    </section>

    <!-- Workflow -->
    <section class="mb-6">
      <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{{ t('apiDocs.workflow') }}</h2>
      <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <div class="space-y-3 text-sm font-mono">
          <div class="flex items-start gap-3">
            <span class="text-gray-600 select-none">1.</span>
            <div>
              <span class="text-emerald-400">GET</span>
              <span class="text-gray-700 dark:text-gray-300"> /api/tasks?task_status=TODO</span>
              <span class="text-gray-600 ml-2"># {{ t('apiDocs.step1') }}</span>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-gray-600 select-none">2.</span>
            <div>
              <span class="text-amber-400">PATCH</span>
              <span class="text-gray-700 dark:text-gray-300"> /api/tasks/7/status</span>
              <span class="text-gray-600 ml-2"># {"task_status":"IN_PROGRESS","assigned_to":"..."}</span>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-gray-600 select-none">3.</span>
            <div>
              <span class="text-gray-500 italic">{{ t('apiDocs.step3') }}</span>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-gray-600 select-none">4.</span>
            <div>
              <span class="text-amber-400">PATCH</span>
              <span class="text-gray-700 dark:text-gray-300"> /api/tasks/7/status</span>
              <span class="text-gray-600 ml-2"># {"task_status":"DONE"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Linear sync note -->
    <section class="mb-6">
      <div class="bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 rounded-lg p-4 text-sm text-accent-700 dark:text-accent-200">
        <p><strong>Linear sync:</strong> {{ t('apiDocs.linearNote') }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const copied = ref(false)

const baseUrl = computed(() => {
  if (import.meta.client) {
    return window.location.origin
  }
  return 'http://localhost:3000'
})

const markdownContent = computed(() => `# Voice to Task — Agent Task API

Base URL: \`${baseUrl.value}\`

## Authentication

All endpoints require a Bearer token in the \`Authorization\` header. Generate one in Config > API Tokens.

\`\`\`
Authorization: Bearer vtk_<your-token>
\`\`\`

## Endpoints

### GET /api/tasks

List tasks with optional filters.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| \`task_status\` | \`TRIAGE \\| TODO \\| IN_PROGRESS \\| DONE\` | Filter by status |
| \`assigned_to\` | \`string\` | Filter by agent identifier |
| \`limit\` | \`number\` | Max results to return |

**Example:**
\`\`\`bash
curl -H "Authorization: Bearer $TOKEN" \\
  ${baseUrl.value}/api/tasks?task_status=TODO&limit=5
\`\`\`

---

### GET /api/tasks/:id

Get a single task by ID.

**Example:**
\`\`\`bash
curl -H "Authorization: Bearer $TOKEN" \\
  ${baseUrl.value}/api/tasks/7
\`\`\`

---

### PATCH /api/tasks/:id/status

Update task status and optionally claim it. If the task is linked to a Linear issue, the status change syncs automatically using the configurable state mapping (default: TRIAGE → Triage, TODO → Unstarted, IN_PROGRESS → Started, DONE → Completed). You can change the mapping in Config.

**Body (JSON):**
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| \`task_status\` | Yes | \`TRIAGE \\| TODO \\| IN_PROGRESS \\| DONE\` | New status |
| \`assigned_to\` | No | \`string\` | Agent identifier (e.g. "claude-code") |

**Example:**
\`\`\`bash
curl -X PATCH ${baseUrl.value}/api/tasks/7/status \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"task_status": "IN_PROGRESS", "assigned_to": "claude-code"}'
\`\`\`

---

## Response shape (Task)

All endpoints return objects with this shape:

\`\`\`json
{
  "id": 7,
  "text": "Implement auth flow for the mobile app",
  "task_status": "IN_PROGRESS",
  "assigned_to": "claude-code",
  "linear_issue_key": "PROJ-42",
  "linear_issue_url": "https://linear.app/team/issue/PROJ-42",
  "created_at": "2026-03-25T10:00:00.000Z",
  "updated_at": "2026-03-25T10:05:00.000Z"
}
\`\`\`

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| \`id\` | \`number\` | Unique task ID |
| \`text\` | \`string\` | Task description (may include markdown action plan) |
| \`task_status\` | \`string\` | Current status: TRIAGE, TODO, IN_PROGRESS, or DONE |
| \`assigned_to\` | \`string \\| null\` | Agent identifier that claimed the task |
| \`linear_issue_key\` | \`string \\| null\` | Linear issue key (e.g. "PROJ-42") if linked |
| \`linear_issue_url\` | \`string \\| null\` | Linear issue URL if linked |
| \`created_at\` | \`string\` | ISO 8601 timestamp |
| \`updated_at\` | \`string\` | ISO 8601 timestamp |

---

## Agent workflow

\`\`\`
1. GET  /api/tasks?task_status=TODO            → pick a task
2. PATCH /api/tasks/7/status                   → {"task_status":"IN_PROGRESS","assigned_to":"claude-code"}
3. (agent works on the task)
4. PATCH /api/tasks/7/status                   → {"task_status":"DONE"}
\`\`\`

---

## Notes

- Tasks are created via the Voice to Task UI or \`POST /api/entries\`. New entries start with \`task_status: "TODO"\`.
- Linear sync is best-effort: if the API key is not set or the issue is not linked, status updates still succeed locally.
- The Linear state mapping is configurable via the Config page. Default: TRIAGE → Triage, TODO → Unstarted, IN_PROGRESS → Started, DONE → Completed.
- The \`GET /api/tasks\` endpoint returns results ordered by \`created_at DESC\`.
- Authentication is required. Use a Bearer token generated in Config > API Tokens.
`)

function copyMarkdown() {
  navigator.clipboard.writeText(markdownContent.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>
