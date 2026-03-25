import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.text || typeof body.text !== 'string') {
    throw createError({ statusCode: 400, message: 'text is required' })
  }

  const db = useDB()
  const result = db.prepare(
    'INSERT INTO entries (text, status, task_status) VALUES (?, ?, ?)'
  ).run(body.text.trim(), 'draft', 'TRIAGE')

  return db.prepare('SELECT * FROM entries WHERE id = ?').get(result.lastInsertRowid)
})
