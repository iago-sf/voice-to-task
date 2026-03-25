import { LinearClient } from '@linear/sdk'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  if (!config.linearApiKey) {
    throw createError({ statusCode: 500, message: 'LINEAR_API_KEY not configured' })
  }

  const client = new LinearClient({ apiKey: config.linearApiKey })
  const teams = await client.teams()

  return teams.nodes.map((t: any) => ({
    id: t.id,
    name: t.name,
    key: t.key,
  }))
})
