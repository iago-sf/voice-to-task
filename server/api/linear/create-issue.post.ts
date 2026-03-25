import { LinearClient } from '@linear/sdk'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!config.linearApiKey) {
    throw createError({ statusCode: 500, message: 'LINEAR_API_KEY not configured' })
  }

  if (!body.title || !body.teamId || !body.assigneeId) {
    throw createError({ statusCode: 400, message: 'title, teamId, and assigneeId are required' })
  }

  try {
    const client = new LinearClient({ apiKey: config.linearApiKey })

    const team = await client.team(body.teamId)
    const states = await team.states()
    const triageState = states.nodes.find((s: any) => s.type === 'triage')

    const issuePayload: any = {
      title: body.title,
      teamId: body.teamId,
      assigneeId: body.assigneeId,
    }

    if (body.description) {
      issuePayload.description = body.description
    }

    if (triageState) {
      issuePayload.stateId = triageState.id
    }

    const result = await client.createIssue(issuePayload)
    const issue = await result.issue

    if (!issue) {
      throw new Error('Failed to retrieve created issue')
    }

    return {
      success: true,
      issue: {
        id: issue.id,
        identifier: issue.identifier,
        url: issue.url,
        title: issue.title,
      },
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create Linear issue',
    })
  }
})
