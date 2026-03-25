import { useDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  const db = useDB()
  return db.prepare('SELECT * FROM contexts WHERE user_email = ? ORDER BY name ASC').all(userEmail)
})
