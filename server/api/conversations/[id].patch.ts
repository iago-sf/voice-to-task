import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const email = await getSessionEmail(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'id is required' })
  const body = await readBody(event)
  const db = await ensureDB()

  const sets: string[] = []
  const args: any[] = []

  if (body.title !== undefined) { sets.push('title = ?'); args.push(body.title) }
  if (body.messages !== undefined) { sets.push('messages = ?'); args.push(JSON.stringify(body.messages)) }
  if (body.conversation_summary !== undefined) { sets.push('conversation_summary = ?'); args.push(body.conversation_summary) }
  if (body.status !== undefined) { sets.push('status = ?'); args.push(body.status) }
  if (body.linear_issue_id !== undefined) { sets.push('linear_issue_id = ?'); args.push(body.linear_issue_id) }
  if (body.linear_issue_key !== undefined) { sets.push('linear_issue_key = ?'); args.push(body.linear_issue_key) }
  if (body.linear_issue_url !== undefined) { sets.push('linear_issue_url = ?'); args.push(body.linear_issue_url) }

  if (sets.length === 0) return { success: true }

  sets.push('updated_at = CURRENT_TIMESTAMP')
  args.push(Number(id), email)

  await db.execute({
    sql: `UPDATE conversations SET ${sets.join(', ')} WHERE id = ? AND user_email = ?`,
    args,
  })

  return { success: true }
})
