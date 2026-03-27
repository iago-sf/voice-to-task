import { LinearClient } from '@linear/sdk'

export default defineEventHandler(async (event) => {
  const linearApiKey = await requireUserApiKey(event, 'linear_api_key')
  const { teamId } = getQuery(event) as { teamId?: string }

  if (!teamId) {
    throw createError({ statusCode: 400, message: 'teamId is required' })
  }

  const client = new LinearClient({ apiKey: linearApiKey })
  const team = await client.team(teamId)
  const projects = await team.projects()

  return projects.nodes
    .filter((p: any) => p.state !== 'completed' && p.state !== 'canceled')
    .map((p: any) => ({
      id: p.id,
      name: p.name,
      color: p.color,
    }))
})
