import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  await checkUsage(userEmail)
  const body = await readBody<Record<string, string>>(event)

  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Body must be a JSON object of key-value pairs' })
  }

  const db = await ensureDB()
  const statements = Object.entries(body).map(([key, value]) => ({
    sql: 'INSERT INTO user_settings (user_email, key, value) VALUES (?, ?, ?) ON CONFLICT(user_email, key) DO UPDATE SET value = excluded.value',
    args: [userEmail, key, value],
  }))

  await db.batch(statements, 'deferred')

  return { ok: true }
})
