import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const email = await getSessionEmail(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'id is required' })

  const db = await ensureDB()
  const { rows } = await db.execute({
    sql: `SELECT * FROM conversations WHERE id = ? AND user_email = ?`,
    args: [Number(id), email],
  })

  if (!rows.length) throw createError({ statusCode: 404, message: 'Not found' })

  const row = rows[0] as any
  return {
    ...row,
    messages: JSON.parse(row.messages || '[]'),
    project_context_ids: JSON.parse(row.project_context_ids || '[]'),
    context_ids: JSON.parse(row.context_ids || '[]'),
  }
})
