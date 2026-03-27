import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  await checkUsage(userEmail)
  const body = await readBody(event)

  if (!body.name || typeof body.name !== 'string') {
    throw createError({ statusCode: 400, message: 'name is required' })
  }

  const db = await ensureDB()
  const result = await db.execute({
    sql: 'INSERT INTO contexts (name, content, user_email) VALUES (?, ?, ?)',
    args: [body.name.trim(), (body.content || '').trim(), userEmail],
  })

  const { rows } = await db.execute({
    sql: 'SELECT * FROM contexts WHERE id = ?',
    args: [Number(result.lastInsertRowid)],
  })
  return rows[0]
})
