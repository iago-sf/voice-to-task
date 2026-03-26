import type { H3Event } from 'h3'
import { getHeader, createError } from 'h3'
import { validateApiToken } from './api-tokens'

export async function getSessionEmail(event: H3Event): Promise<string> {
  const authHeader = getHeader(event, 'authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const email = await validateApiToken(token)
    if (!email) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid API token' })
    }
    return email
  }

  const session = await requireUserSession(event)
  return session.user.email
}
