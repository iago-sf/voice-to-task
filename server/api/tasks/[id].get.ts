import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'
import type { Task } from '~/types'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  await checkUsage(userEmail)
  const id = getRouterParam(event, 'id')!
  const db = await ensureDB()

  const { rows: [task] } = await db.execute({
    sql: `SELECT id, text, task_status, assigned_to, linear_issue_key, linear_issue_url, created_at, updated_at
     FROM entries WHERE id = ? AND user_email = ?`,
    args: [id, userEmail],
  })

  if (!task) {
    throw createError({ statusCode: 404, message: 'Task not found' })
  }

  return task as unknown as Task
})
