export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  return await getUserApiKeys(session.user.email)
})
