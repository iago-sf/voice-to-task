import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  await checkUsage(userEmail)
  const query = getQuery(event)
  const limit = Number(query.limit) || 50
  const status = query.status as string | undefined

  const db = await ensureDB()

  const conditions: string[] = ['user_email = ?']
  const params: any[] = [userEmail]

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }

  const sql = `SELECT * FROM entries WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT ?`
  params.push(limit)

  const { rows } = await db.execute({ sql, args: params })
  return rows
})
