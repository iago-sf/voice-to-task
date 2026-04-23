import type { H3Event } from 'h3'
import { getHeader, createError } from 'h3'
import { validateApiToken } from './api-tokens'

const DESKTOP_FALLBACK = 'local@desktop'

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

  const isDesktop = process.env.NUXT_DESKTOP_MODE === 'true'

  try {
    const session = await getUserSession(event)
    if (session?.user?.email) return session.user.email
  } catch {
    // no session
  }

  if (isDesktop) {
    return DESKTOP_FALLBACK
  }

  throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
}
