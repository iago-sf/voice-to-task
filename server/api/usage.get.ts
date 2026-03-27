import { getSessionEmail } from '~/server/utils/session-email'
import { getUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const email = await getSessionEmail(event)
  return await getUsage(email)
})
