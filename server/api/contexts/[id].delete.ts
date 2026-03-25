import { useDB } from '~/server/utils/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const db = useDB()

  const existing = db.prepare('SELECT * FROM contexts WHERE id = ?').get(id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Context not found' })
  }

  db.prepare('DELETE FROM contexts WHERE id = ?').run(id)
  return { success: true }
})
