import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const email = await getSessionEmail(event)
  const db = await ensureDB()
  const { rows } = await db.execute({
    sql: `SELECT id, title, status, conversation_summary, linear_issue_key, linear_issue_url, created_at, updated_at FROM conversations WHERE user_email = ? ORDER BY updated_at DESC`,
    args: [email],
  })
  return rows
})
