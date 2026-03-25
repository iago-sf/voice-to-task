import { useDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  const body = await readBody(event)

  if (!body.name || typeof body.name !== 'string') {
    throw createError({ statusCode: 400, message: 'name is required' })
  }

  const db = useDB()
  const result = db.prepare(
    'INSERT INTO contexts (name, content, user_email) VALUES (?, ?, ?)'
  ).run(body.name.trim(), (body.content || '').trim(), userEmail)

  return db.prepare('SELECT * FROM contexts WHERE id = ?').get(result.lastInsertRowid)
})
