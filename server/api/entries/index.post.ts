import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  const body = await readBody(event)

  if (!body.text || typeof body.text !== 'string') {
    throw createError({ statusCode: 400, message: 'text is required' })
  }

  const db = await ensureDB()
  const result = await db.execute({
    sql: 'INSERT INTO entries (text, status, task_status, user_email) VALUES (?, ?, ?, ?)',
    args: [body.text.trim(), 'draft', 'TRIAGE', userEmail],
  })

  const { rows: [created] } = await db.execute({
    sql: 'SELECT * FROM entries WHERE id = ?',
    args: [Number(result.lastInsertRowid)],
  })
  return created
})
