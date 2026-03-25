import { useDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'
import { syncTaskStatusToLinear } from '~/server/utils/linear-sync'
import { getUserApiKey } from '~/server/utils/user-keys'
import type { Task, TaskStatus } from '~/types'

const VALID_STATUSES: TaskStatus[] = ['TRIAGE', 'TODO', 'IN_PROGRESS', 'DONE']

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!body.task_status || !VALID_STATUSES.includes(body.task_status)) {
    throw createError({ statusCode: 400, message: 'task_status must be one of: TRIAGE, TODO, IN_PROGRESS, DONE' })
  }

  const db = useDB()

  const existing = db.prepare('SELECT * FROM entries WHERE id = ? AND user_email = ?').get(id, userEmail) as any
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Task not found' })
  }

  const fields = ['task_status = ?', 'updated_at = CURRENT_TIMESTAMP']
  const values: any[] = [body.task_status]

  if (body.assigned_to !== undefined) {
    fields.push('assigned_to = ?')
    values.push(body.assigned_to)
  }

  values.push(id, userEmail)

  db.prepare(`UPDATE entries SET ${fields.join(', ')} WHERE id = ? AND user_email = ?`).run(...values)

  // Best-effort sync to Linear (non-blocking, errors logged)
  if (existing.linear_issue_id) {
    const linearApiKey = getUserApiKey(userEmail, 'linear_api_key')
    if (linearApiKey) {
      syncTaskStatusToLinear(linearApiKey, existing.linear_issue_id, body.task_status, userEmail).catch(() => {})
    }
  }

  const task = db.prepare(
    `SELECT id, text, task_status, assigned_to, linear_issue_key, linear_issue_url, created_at, updated_at
     FROM entries WHERE id = ?`
  ).get(id) as Task

  return task
})
