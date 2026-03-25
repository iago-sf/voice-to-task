export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, string>>(event)

  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Body must be a JSON object of key-value pairs' })
  }

  const db = useDB()
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')

  const transaction = db.transaction((entries: [string, string][]) => {
    for (const [key, value] of entries) {
      upsert.run(key, value)
    }
  })

  transaction(Object.entries(body))

  return { ok: true }
})
