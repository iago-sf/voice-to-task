#!/usr/bin/env npx tsx
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API_BASE = process.env.VOICE_TO_TASK_URL || 'https://voice-to-task-taupe.vercel.app'
const API_TOKEN = process.env.VOICE_TO_TASK_TOKEN

if (!API_TOKEN) {
  console.error('ERROR: VOICE_TO_TASK_TOKEN environment variable is required.')
  console.error('Generate a token at https://voice-to-task-taupe.vercel.app/config?tab=tokens')
  process.exit(1)
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    throw new Error('Authentication failed. Check your VOICE_TO_TASK_TOKEN — it may be invalid or revoked.')
  }
  if (res.status === 404) {
    throw new Error('Task not found. It may have been deleted or the ID is incorrect.')
  }
  if (res.status === 429) {
    throw new Error('Usage limit reached. Monthly API request limit exceeded.')
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API error ${res.status}: ${body || res.statusText}`)
  }

  return res.json() as Promise<T>
}

const server = new McpServer({
  name: 'voice-to-task',
  version: '1.0.0',
})

server.tool(
  'list_tasks',
  `List tasks from Voice to Task. Returns an array of tasks with id, text, task_status (TRIAGE|TODO|IN_PROGRESS|DONE), assigned_to, linear_issue_key, linear_issue_url, created_at, updated_at.

WORKFLOW: Pick a TODO task, claim it with update_task_status (set IN_PROGRESS + assigned_to), do the work, then mark DONE.`,
  {
    task_status: z.enum(['TRIAGE', 'TODO', 'IN_PROGRESS', 'DONE']).optional()
      .describe('Filter by task status. Use "TODO" to find available tasks to pick up.'),
    assigned_to: z.string().optional()
      .describe('Filter by assignee name. Use "null" for unassigned tasks.'),
    limit: z.number().min(1).max(100).default(20).optional()
      .describe('Max tasks to return (default 20).'),
  },
  async (params) => {
    const query = new URLSearchParams()
    if (params.task_status) query.set('task_status', params.task_status)
    if (params.assigned_to) query.set('assigned_to', params.assigned_to)
    if (params.limit) query.set('limit', String(params.limit))
    const qs = query.toString()
    const tasks = await apiFetch<any[]>(`/api/tasks${qs ? '?' + qs : ''}`)
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(tasks, null, 2),
      }],
    }
  },
)

server.tool(
  'get_task',
  'Get full details of a specific task by ID.',
  {
    id: z.number().int().positive().describe('Task ID'),
  },
  async ({ id }) => {
    const task = await apiFetch<any>(`/api/tasks/${id}`)
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(task, null, 2),
      }],
    }
  },
)

server.tool(
  'update_task_status',
  `Update a task's status and optionally assign it. This triggers a sync to Linear if the task has a linked issue.

WORKFLOW:
1. Pick a TODO task → update to IN_PROGRESS with assigned_to = "claude" (or your agent name)
2. Do the work
3. Mark DONE when finished`,
  {
    id: z.number().int().positive().describe('Task ID'),
    task_status: z.enum(['TRIAGE', 'TODO', 'IN_PROGRESS', 'DONE'])
      .describe('New status. Valid values: TRIAGE, TODO, IN_PROGRESS, DONE.'),
    assigned_to: z.string().optional()
      .describe('Assignee name. Set when claiming a task (e.g. "claude", "copilot").'),
  },
  async ({ id, task_status, assigned_to }) => {
    const body: Record<string, any> = { task_status }
    if (assigned_to !== undefined) body.assigned_to = assigned_to

    const task = await apiFetch<any>(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(task, null, 2),
      }],
    }
  },
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error('MCP server error:', err)
  process.exit(1)
})
