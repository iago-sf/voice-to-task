import { useDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  const query = getQuery(event)
  const limit = Number(query.limit) || 50
  const status = query.status as string | undefined

  const db = useDB()

  const conditions: string[] = ['user_email = ?']
  const params: any[] = [userEmail]

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }

  const sql = `SELECT * FROM entries WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT ?`
  params.push(limit)

  return db.prepare(sql).all(...params)
})
