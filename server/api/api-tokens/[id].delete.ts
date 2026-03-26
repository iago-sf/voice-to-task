import { deleteApiToken } from '~/server/utils/api-tokens'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const email = session.user.email
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
