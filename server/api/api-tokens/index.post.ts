import { generateApiToken } from '~/server/utils/api-tokens'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const email = session.user.email
  await checkUsage(email)
  const body = await readBody<{ name?: string }>(event)
  const name = (body?.name || '').trim()

  const token = await generateApiToken(email, name)
  return { token }
})
