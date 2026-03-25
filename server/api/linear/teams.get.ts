import { LinearClient } from '@linear/sdk'

export default defineEventHandler(async (event) => {
  const linearApiKey = await requireUserApiKey(event, 'linear_api_key')

  const client = new LinearClient({ apiKey: linearApiKey })
  const teams = await client.teams()

  return teams.nodes.map((t: any) => ({
    id: t.id,
    name: t.name,
    key: t.key,
  }))
})
