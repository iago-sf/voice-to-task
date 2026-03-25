import type { H3Event } from 'h3'

export async function getSessionEmail(event: H3Event): Promise<string> {
  const session = await requireUserSession(event)
  return session.user.email
}
