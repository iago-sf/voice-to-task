import crypto from 'node:crypto'
import type { H3Event } from 'h3'
import { ensureDB } from './db'

const SALT = 'voice-to-task-user-keys'
const ALGORITHM = 'aes-256-gcm'

function getDerivedKey(): Buffer {
  const password = useRuntimeConfig().session?.password || ''
  if (!password) {
    throw createError({ statusCode: 500, message: 'NUXT_SESSION_PASSWORD is required for key encryption' })
  }
  return crypto.scryptSync(password, SALT, 32)
}

function encrypt(plaintext: string): string {
  const key = getDerivedKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

function decrypt(ciphertext: string): string {
  const key = getDerivedKey()
  const parts = ciphertext.split(':')
  if (parts.length !== 3) throw new Error('Invalid ciphertext format')
  const iv = Buffer.from(parts[0]!, 'base64')
  const authTag = Buffer.from(parts[1]!, 'base64')
  const encrypted = Buffer.from(parts[2]!, 'base64')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted) + decipher.final('utf8')
}

export async function getUserApiKey(userEmail: string, keyName: string): Promise<string | null> {
  const db = await ensureDB()
  const { rows } = await db.execute({
    sql: 'SELECT encrypted_value FROM user_api_keys WHERE user_email = ? AND key_name = ?',
    args: [userEmail, keyName],
  })

  const row = rows[0] as unknown as { encrypted_value: string } | undefined
  if (!row) return null

  try {
    return decrypt(row.encrypted_value)
  } catch {
    return null
  }
}

export async function setUserApiKey(userEmail: string, keyName: string, plaintext: string): Promise<void> {
  const db = await ensureDB()
  const encrypted = encrypt(plaintext)
  await db.execute({
    sql: `INSERT INTO user_api_keys (user_email, key_name, encrypted_value, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_email, key_name) DO UPDATE SET encrypted_value = ?, updated_at = CURRENT_TIMESTAMP`,
    args: [userEmail, keyName, encrypted, encrypted],
  })
}

export async function deleteUserApiKey(userEmail: string, keyName: string): Promise<void> {
  const db = await ensureDB()
  await db.execute({
    sql: 'DELETE FROM user_api_keys WHERE user_email = ? AND key_name = ?',
    args: [userEmail, keyName],
  })
}

export async function getUserApiKeys(userEmail: string): Promise<Record<string, boolean>> {
  const db = await ensureDB()
  const { rows } = await db.execute({
    sql: 'SELECT key_name FROM user_api_keys WHERE user_email = ?',
    args: [userEmail],
  })

  const keyNames = rows.map((r: any) => r.key_name)
  return {
    linear_api_key: keyNames.includes('linear_api_key'),
    groq_api_key: keyNames.includes('groq_api_key'),
    zai_api_key: keyNames.includes('zai_api_key'),
    minimax_api_key: keyNames.includes('minimax_api_key'),
  }
}

export async function requireUserApiKey(event: H3Event, keyName: string): Promise<string> {
  const session = await requireUserSession(event)
  const email = session.user.email
  const key = await getUserApiKey(email, keyName)

  if (!key) {
    const label = keyName.replace(/_/g, ' ').toUpperCase()
    throw createError({
      statusCode: 400,
      message: `${label} not configured. Add it in Config > API Keys.`,
    })
  }

  return key
}
