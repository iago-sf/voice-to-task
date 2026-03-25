import { useDB } from '~/server/utils/db'
import type { Task } from '~/types'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const db = useDB()

  const conditions: string[] = []
  const params: any[] = []

  if (query.task_status) {
    conditions.push('task_status = ?')
    params.push(query.task_status)
  }

  if (query.assigned_to) {
    conditions.push('assigned_to = ?')
    params.push(query.assigned_to)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = query.limit ? `LIMIT ?` : ''
  if (query.limit) {
    params.push(Number(query.limit))
  }

  const rows = db.prepare(
    `SELECT id, text, task_status, assigned_to, linear_issue_key, linear_issue_url, created_at, updated_at
     FROM entries ${where} ORDER BY created_at DESC ${limit}`
  ).all(...params) as Task[]

  return rows
})
