import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  await checkUsage(userEmail)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const db = await ensureDB()

  const { rows: [existing] } = await db.execute({
    sql: 'SELECT * FROM entries WHERE id = ? AND user_email = ?',
    args: [id, userEmail],
  })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Entry not found' })
  }

  const fields: string[] = []
  const values: any[] = []

  for (const key of ['text', 'linear_issue_id', 'linear_issue_key', 'linear_issue_url', 'status', 'task_status', 'assigned_to', 'conversation_summary']) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(body[key])
    }
  }

  if (fields.length === 0) {
    throw createError({ statusCode: 400, message: 'No fields to update' })
  }

  fields.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id, userEmail)

  await db.execute({
    sql: `UPDATE entries SET ${fields.join(', ')} WHERE id = ? AND user_email = ?`,
    args: values,
  })

  const { rows: [updated] } = await db.execute({
    sql: 'SELECT * FROM entries WHERE id = ?',
    args: [id],
  })
  return updated
})
