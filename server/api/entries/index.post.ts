import { useDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  const body = await readBody(event)

  if (!body.text || typeof body.text !== 'string') {
    throw createError({ statusCode: 400, message: 'text is required' })
  }

  const db = useDB()
  const result = db.prepare(
    'INSERT INTO entries (text, status, task_status, user_email) VALUES (?, ?, ?, ?)'
  ).run(body.text.trim(), 'draft', 'TRIAGE', userEmail)

  return db.prepare('SELECT * FROM entries WHERE id = ?').get(result.lastInsertRowid)
})
