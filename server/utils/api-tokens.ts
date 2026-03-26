import { randomBytes, createHash } from 'crypto'
import { ensureDB } from './db'

const TOKEN_PREFIX = 'vtk_'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function generateApiToken(userEmail: string, name: string): Promise<string> {
  const db = await ensureDB()

  for (let attempt = 0; attempt < 5; attempt++) {
    const raw = randomBytes(32).toString('hex')
    const token = TOKEN_PREFIX + raw
    const tokenHash = hashToken(token)

    try {
      await db.execute({
        sql: 'INSERT INTO api_tokens (user_email, name, token_hash) VALUES (?, ?, ?)',
        args: [userEmail, name, tokenHash],
      })
      return token
    } catch (err: any) {
      // UNIQUE constraint violation — retry with new random bytes
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message?.includes('UNIQUE')) continue
      throw err
    }
  }

  throw new Error('Failed to generate a unique API token')
}

export async function validateApiToken(token: string): Promise<string | null> {
  if (!token.startsWith(TOKEN_PREFIX)) return null

  const db = await ensureDB()
  const tokenHash = hashToken(token)

  const { rows } = await db.execute({
    sql: 'SELECT id, user_email FROM api_tokens WHERE token_hash = ?',
    args: [tokenHash],
  })

  const row = rows[0] as unknown as { id: number; user_email: string } | undefined
  if (!row) return null

  await db.execute({
    sql: 'UPDATE api_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [row.id],
  })

  return row.user_email
}

export interface ApiTokenInfo {
  id: number
  name: string
  created_at: string
  last_used_at: string | null
}

export async function listApiTokens(userEmail: string): Promise<ApiTokenInfo[]> {
  const db = await ensureDB()
  const { rows } = await db.execute({
    sql: 'SELECT id, name, created_at, last_used_at FROM api_tokens WHERE user_email = ? ORDER BY created_at DESC',
    args: [userEmail],
  })
  return rows as unknown as ApiTokenInfo[]
}

export async function deleteApiToken(userEmail: string, id: number): Promise<boolean> {
  const db = await ensureDB()
  const result = await db.execute({
    sql: 'DELETE FROM api_tokens WHERE id = ? AND user_email = ?',
    args: [id, userEmail],
  })
  return result.rowsAffected > 0
}
