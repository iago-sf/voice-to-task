import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  await checkUsage(session.user.email)
  return await getUserApiKeys(session.user.email)
})
