import { useDB } from '~/server/utils/db'

export default defineEventHandler(() => {
  const db = useDB()
  return db.prepare('SELECT * FROM contexts ORDER BY name ASC').all()
})
