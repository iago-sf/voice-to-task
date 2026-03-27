import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'
import type { Task } from '~/types'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  await checkUsage(userEmail)
  const query = getQuery(event)
  const db = await ensureDB()

  const conditions: string[] = ['user_email = ?']
  const params: any[] = [userEmail]

  if (query.task_status) {
    conditions.push('task_status = ?')
    params.push(query.task_status)
  }

  if (query.assigned_to) {
    conditions.push('assigned_to = ?')
    params.push(query.assigned_to)
  }

  const where = `WHERE ${conditions.join(' AND ')}`
  const limit = query.limit ? `LIMIT ?` : ''
  if (query.limit) {
    params.push(Number(query.limit))
  }

  const { rows } = await db.execute({
    sql: `SELECT id, text, task_status, assigned_to, linear_issue_key, linear_issue_url, created_at, updated_at
     FROM entries ${where} ORDER BY created_at DESC ${limit}`,
    args: params,
  })

  return rows as unknown as Task[]
})
