import { listApiTokens } from '~/server/utils/api-tokens'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const email = await getSessionEmail(event)
  await checkUsage(email)
  return await listApiTokens(email)
})
