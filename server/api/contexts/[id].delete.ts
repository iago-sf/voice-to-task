import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  await checkUsage(userEmail)
  const id = getRouterParam(event, 'id')!
  const db = await ensureDB()

  const { rows: [existing] } = await db.execute({
    sql: 'SELECT * FROM contexts WHERE id = ? AND user_email = ?',
    args: [id, userEmail],
  })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Context not found' })
  }

  await db.execute({
    sql: 'DELETE FROM contexts WHERE id = ? AND user_email = ?',
    args: [id, userEmail],
  })
  return { success: true }
})
