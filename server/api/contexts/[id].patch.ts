import { useDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const db = useDB()

  const existing = db.prepare('SELECT * FROM contexts WHERE id = ? AND user_email = ?').get(id, userEmail)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Context not found' })
  }

  const fields: string[] = []
  const values: any[] = []

  for (const key of ['name', 'content']) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(body[key])
    }
  }

  if (fields.length === 0) {
    throw createError({ statusCode: 400, message: 'No fields to update' })
  }

  fields.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id, userEmail)

  db.prepare(`UPDATE contexts SET ${fields.join(', ')} WHERE id = ? AND user_email = ?`).run(...values)

  return db.prepare('SELECT * FROM contexts WHERE id = ?').get(id)
})
