import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  const body = await readBody<Record<string, string>>(event)

  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Body must be a JSON object of key-value pairs' })
  }

  const db = useDB()
  const upsert = db.prepare('INSERT INTO user_settings (user_email, key, value) VALUES (?, ?, ?) ON CONFLICT(user_email, key) DO UPDATE SET value = excluded.value')

  const transaction = db.transaction((entries: [string, string][]) => {
    for (const [key, value] of entries) {
      upsert.run(userEmail, key, value)
    }
  })

  transaction(Object.entries(body))

  return { ok: true }
})
