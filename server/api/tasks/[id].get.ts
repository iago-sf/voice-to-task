import { useDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'
import type { Task } from '~/types'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  const id = getRouterParam(event, 'id')
  const db = useDB()

  const task = db.prepare(
    `SELECT id, text, task_status, assigned_to, linear_issue_key, linear_issue_url, created_at, updated_at
     FROM entries WHERE id = ? AND user_email = ?`
  ).get(id, userEmail) as Task | undefined

  if (!task) {
    throw createError({ statusCode: 404, message: 'Task not found' })
  }

  return task
})
