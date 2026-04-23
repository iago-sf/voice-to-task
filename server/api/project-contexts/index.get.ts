import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const email = await getSessionEmail(event)
  const db = await ensureDB()
  const { rows } = await db.execute({
    sql: 'SELECT id, name, folder_path, created_at, updated_at FROM project_contexts WHERE user_email = ? ORDER BY name',
    args: [email],
  })
  return rows
})
