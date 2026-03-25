import { useDB } from '~/server/utils/db'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const limit = Number(query.limit) || 50
  const status = query.status as string | undefined

  const db = useDB()

  let sql = 'SELECT * FROM entries'
  const params: any[] = []

  if (status) {
    sql += ' WHERE status = ?'
    params.push(status)
  }

  sql += ' ORDER BY created_at DESC LIMIT ?'
  params.push(limit)

  return db.prepare(sql).all(...params)
})
