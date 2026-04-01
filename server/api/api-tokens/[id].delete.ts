import { deleteApiToken } from '~/server/utils/api-tokens'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const email = await getSessionEmail(event)
  await checkUsage(email)
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid token ID' })
  }

  const deleted = await deleteApiToken(email, id)
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Token not found' })
  }

  return { ok: true }
})
