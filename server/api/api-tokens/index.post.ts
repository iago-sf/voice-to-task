import { generateApiToken } from '~/server/utils/api-tokens'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const email = await getSessionEmail(event)
  await checkUsage(email)
  const body = await readBody<{ name?: string }>(event)
  const name = (body?.name || '').trim()

  const token = await generateApiToken(email, name)
  return { token }
})
