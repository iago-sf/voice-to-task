import crypto from 'node:crypto'
import type { H3Event } from 'h3'

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
  const [ivB64, tagB64, dataB64] = ciphertext.split(':')
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(tagB64, 'base64')
  const encrypted = Buffer.from(dataB64, 'base64')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted) + decipher.final('utf8')
}

export function getUserApiKey(userEmail: string, keyName: string): string | null {
  const db = useDB()
  const row = db.prepare(
    'SELECT encrypted_value FROM user_api_keys WHERE user_email = ? AND key_name = ?'
  ).get(userEmail, keyName) as { encrypted_value: string } | undefined

  if (!row) return null

  try {
    return decrypt(row.encrypted_value)
  } catch {
    return null
  }
}

export function setUserApiKey(userEmail: string, keyName: string, plaintext: string): void {
  const db = useDB()
  const encrypted = encrypt(plaintext)
  db.prepare(
    `INSERT INTO user_api_keys (user_email, key_name, encrypted_value, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_email, key_name) DO UPDATE SET encrypted_value = ?, updated_at = CURRENT_TIMESTAMP`
  ).run(userEmail, keyName, encrypted, encrypted)
}

export function deleteUserApiKey(userEmail: string, keyName: string): void {
  const db = useDB()
  db.prepare('DELETE FROM user_api_keys WHERE user_email = ? AND key_name = ?').run(userEmail, keyName)
}

export function getUserApiKeys(userEmail: string): Record<string, boolean> {
  const db = useDB()
  const rows = db.prepare(
    'SELECT key_name FROM user_api_keys WHERE user_email = ?'
  ).all(userEmail) as { key_name: string }[]

  return {
    linear_api_key: rows.some(r => r.key_name === 'linear_api_key'),
    groq_api_key: rows.some(r => r.key_name === 'groq_api_key'),
    zai_api_key: rows.some(r => r.key_name === 'zai_api_key'),
  }
}

export async function requireUserApiKey(event: H3Event, keyName: string): Promise<string> {
  const session = await requireUserSession(event)
  const email = session.user.email
  const key = getUserApiKey(email, keyName)

  if (!key) {
    const label = keyName.replace(/_/g, ' ').toUpperCase()
    throw createError({
      statusCode: 400,
      message: `${label} not configured. Add it in Config > API Keys.`,
    })
  }

  return key
}
