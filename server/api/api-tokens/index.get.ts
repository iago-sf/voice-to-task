import { listApiTokens } from '~/server/utils/api-tokens'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const email = session.user.email
  await checkUsage(email)
  return await listApiTokens(email)
})
