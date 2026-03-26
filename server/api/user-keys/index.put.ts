const ALLOWED_KEYS = ['linear_api_key', 'groq_api_key', 'zai_api_key', 'minimax_api_key']

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const email = session.user.email
  const body = await readBody(event)

  for (const [keyName, value] of Object.entries(body)) {
    if (!ALLOWED_KEYS.includes(keyName)) continue
    if (typeof value !== 'string') continue

    if (value === '') {
      await deleteUserApiKey(email, keyName)
    } else {
      await setUserApiKey(email, keyName, value)
    }
  }

  return { ok: true }
})
