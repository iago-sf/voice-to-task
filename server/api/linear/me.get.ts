import { LinearClient } from '@linear/sdk'

export default defineEventHandler(async (event) => {
  const linearApiKey = await requireUserApiKey(event, 'linear_api_key')

  const client = new LinearClient({ apiKey: linearApiKey })
  const viewer = await client.viewer

  return {
    id: viewer.id,
    name: viewer.name,
    email: viewer.email,
  }
})
