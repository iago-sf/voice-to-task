import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const email = await getSessionEmail(event)
  const body = await readBody(event)

  const db = await ensureDB()
  const result = await db.execute({
    sql: `INSERT INTO conversations (user_email, title, messages, conversation_summary, project_context_ids, context_ids, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      email,
      body.title || '',
      JSON.stringify(body.messages || []),
      body.conversation_summary || '',
      JSON.stringify(body.project_context_ids || []),
      JSON.stringify(body.context_ids || []),
      body.status || 'draft',
    ],
  })

  return { id: Number((result as any).insertId) }
})
