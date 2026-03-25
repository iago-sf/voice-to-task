import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const db = useDB()

  const existing = db.prepare('SELECT * FROM entries WHERE id = ?').get(id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Entry not found' })
  }

  const fields: string[] = []
  const values: any[] = []

  for (const key of ['text', 'linear_issue_id', 'linear_issue_key', 'linear_issue_url', 'status', 'task_status', 'assigned_to']) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(body[key])
    }
  }

  if (fields.length === 0) {
    throw createError({ statusCode: 400, message: 'No fields to update' })
  }

  fields.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id)

  db.prepare(`UPDATE entries SET ${fields.join(', ')} WHERE id = ?`).run(...values)

  return db.prepare('SELECT * FROM entries WHERE id = ?').get(id)
})
