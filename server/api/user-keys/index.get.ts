import { getUserApiKeys } from '~/server/utils/user-keys'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const email = await getSessionEmail(event)
  await checkUsage(email)
  return await getUserApiKeys(email)
})
