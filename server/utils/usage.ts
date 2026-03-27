import { ensureDB } from './db'

const DEFAULT_MONTHLY_LIMIT = 50

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

async function getUserLimit(email: string): Promise<number> {
  const db = await ensureDB()
  const { rows } = await db.execute({
    sql: `SELECT value FROM user_settings WHERE user_email = ? AND key = 'monthly_limit'`,
    args: [email],
  })
  if (rows.length > 0 && rows[0].value) {
    const parsed = Number(rows[0].value)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  // Create default limit for this user
  await db.execute({
    sql: `INSERT INTO user_settings (user_email, key, value) VALUES (?, 'monthly_limit', ?)
          ON CONFLICT (user_email, key) DO NOTHING`,
    args: [email, String(DEFAULT_MONTHLY_LIMIT)],
  })
  return DEFAULT_MONTHLY_LIMIT
}

export async function checkUsage(email: string): Promise<void> {
  const db = await ensureDB()
  const month = currentMonth()
  const limit = await getUserLimit(email)

  // Increment count
  await db.execute({
    sql: `INSERT INTO usage_counts (user_email, month, count) VALUES (?, ?, 1)
          ON CONFLICT (user_email, month) DO UPDATE SET count = count + 1`,
    args: [email, month],
  })

  // Read current count
  const { rows } = await db.execute({
    sql: `SELECT count FROM usage_counts WHERE user_email = ? AND month = ?`,
    args: [email, month],
  })

  const count = Number(rows[0]?.count ?? 0)

  if (count > limit) {
    // Rollback the increment
    await db.execute({
      sql: `UPDATE usage_counts SET count = count - 1 WHERE user_email = ? AND month = ?`,
      args: [email, month],
    })
    throw createError({
      statusCode: 429,
      statusMessage: 'Monthly usage limit reached',
    })
  }
}

export async function getUsage(email: string): Promise<{ used: number; limit: number; month: string }> {
  const db = await ensureDB()
  const month = currentMonth()
  const limit = await getUserLimit(email)

  const { rows } = await db.execute({
    sql: `SELECT count FROM usage_counts WHERE user_email = ? AND month = ?`,
    args: [email, month],
  })

  return {
    used: Number(rows[0]?.count ?? 0),
    limit,
    month,
  }
}
