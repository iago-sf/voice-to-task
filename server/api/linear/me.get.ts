import { LinearClient } from '@linear/sdk'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  if (!config.linearApiKey) {
    throw createError({ statusCode: 500, message: 'LINEAR_API_KEY not configured' })
  }

  const client = new LinearClient({ apiKey: config.linearApiKey })
  const viewer = await client.viewer

  return {
    id: viewer.id,
    name: viewer.name,
    email: viewer.email,
  }
})
