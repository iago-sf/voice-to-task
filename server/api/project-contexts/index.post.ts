import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'

export default defineEventHandler(async (event) => {
  const email = await getSessionEmail(event)
  const body = await readBody(event)

  if (!body.name || !body.folder_path) {
    throw createError({ statusCode: 400, message: 'name and folder_path are required' })
  }

  const db = await ensureDB()
  const result = await db.execute({
    sql: 'INSERT INTO project_contexts (user_email, name, folder_path) VALUES (?, ?, ?)',
    args: [email, body.name, body.folder_path],
  })

  return { id: Number((result as any).insertId), name: body.name, folder_path: body.folder_path }
})
