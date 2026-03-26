import { listApiTokens } from '~/server/utils/api-tokens'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const email = session.user.email
  return await listApiTokens(email)
})
