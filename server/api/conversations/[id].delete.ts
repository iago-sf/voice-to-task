import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const email = await getSessionEmail(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'id is required' })

  const db = await ensureDB()
  await db.execute({
    sql: 'DELETE FROM conversations WHERE id = ? AND user_email = ?',
    args: [Number(id), email],
  })

  return { success: true }
})
