import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  const db = await ensureDB()
  const { rows } = await db.execute({
    sql: 'SELECT * FROM contexts WHERE user_email = ? ORDER BY name ASC',
    args: [userEmail],
  })
  return rows
})
