import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  await checkUsage(userEmail)
  const db = await ensureDB()
  const { rows } = await db.execute({
    sql: 'SELECT key, value FROM user_settings WHERE user_email = ?',
    args: [userEmail],
  })
  const result: Record<string, string> = {}
  for (const row of rows as any[]) {
    result[row.key] = row.value
  }
  return result
})
