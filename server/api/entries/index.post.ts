import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  await checkUsage(userEmail)
  const body = await readBody(event)

  if (!body.text || typeof body.text !== 'string') {
    throw createError({ statusCode: 400, message: 'text is required' })
  }

  const conversationSummary = body.conversation_summary || ''

  const db = await ensureDB()
  const result = await db.execute({
    sql: 'INSERT INTO entries (text, status, task_status, user_email, conversation_summary) VALUES (?, ?, ?, ?, ?)',
    args: [body.text.trim(), 'draft', 'TRIAGE', userEmail, conversationSummary],
  })

  const { rows: [created] } = await db.execute({
    sql: 'SELECT * FROM entries WHERE id = ?',
    args: [Number(result.lastInsertRowid)],
  })
  return created
})
