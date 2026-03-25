import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  const db = useDB()
  const rows = db.prepare('SELECT key, value FROM user_settings WHERE user_email = ?').all(userEmail) as { key: string; value: string }[]
  const result: Record<string, string> = {}
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
})
