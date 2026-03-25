import { useDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  const id = getRouterParam(event, 'id')

  const db = useDB()

  const existing = db.prepare('SELECT * FROM entries WHERE id = ? AND user_email = ?').get(id, userEmail)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Entry not found' })
  }

  db.prepare('DELETE FROM entries WHERE id = ? AND user_email = ?').run(id, userEmail)

  return { success: true }
})
