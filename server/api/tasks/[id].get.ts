import { useDB } from '~/server/utils/db'
import type { Task } from '~/types'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const db = useDB()

  const task = db.prepare(
    `SELECT id, text, task_status, assigned_to, linear_issue_key, linear_issue_url, created_at, updated_at
     FROM entries WHERE id = ?`
  ).get(id) as Task | undefined

  if (!task) {
    throw createError({ statusCode: 404, message: 'Task not found' })
  }

  return task
})
