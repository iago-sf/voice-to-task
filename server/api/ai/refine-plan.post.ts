import { ensureDB } from '~/server/utils/db'
import { callGroq, callZai, callMinimax } from '~/server/utils/llm'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  await checkUsage(userEmail)
  const body = await readBody(event)

  if (!body.currentPlan || typeof body.currentPlan !== 'string') {
    throw createError({ statusCode: 400, message: 'currentPlan is required' })
  }
  if (!body.feedback || typeof body.feedback !== 'string') {
    throw createError({ statusCode: 400, message: 'feedback is required' })
  }

  const language = body.language || 'es'
  const model = body.model || 'openai/gpt-oss-120b'
  const engine = body.engine || 'groq'
  const contextIds: number[] = body.contextIds || []
  const customPrompt: string = body.customPrompt || ''

  // Load active contexts from DB
  let contextBlock = ''
  if (contextIds.length > 0) {
    const db = await ensureDB()
    const placeholders = contextIds.map(() => '?').join(',')
    const { rows } = await db.execute({
      sql: `SELECT name, content FROM contexts WHERE id IN (${placeholders})`,
      args: contextIds,
    })

    if (rows.length > 0) {
      contextBlock = (rows as any[])
        .map(r => `--- Context: ${r.name} ---\n${r.content}`)
        .join('\n\n')
    }
  }

  const defaultRefinePrompt = `You are a task planning assistant. The user previously generated an action plan but it has problems. They are providing feedback explaining what's wrong and what they actually meant.

Your job is to:
1. Regenerate a corrected plan incorporating their feedback
2. Extract a reusable rule from the feedback that can help future plan generation

Reply in the same language as the input. Use this exact format:

TITLE: <concise task title, max 100 chars, imperative form>

PLAN:
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3
...

CONTEXT_RULE: <A concise, reusable directive (1-3 sentences) that captures the user's preference or correction so future plans don't make the same mistake. Write it as an instruction for a plan-generation AI.>

Keep the plan practical, specific, and actionable. Between 3 and 8 steps.`

  const basePrompt = customPrompt
    ? `${customPrompt}

Additionally, the user is REFINING an existing plan. Your job is also to extract a reusable rule from the feedback. Append this at the end:

CONTEXT_RULE: <A concise, reusable directive (1-3 sentences) that captures the user's preference or correction so future plans don't make the same mistake. Write it as an instruction for a plan-generation AI.>`
    : defaultRefinePrompt

  const systemPrompt = contextBlock
    ? `${basePrompt}

IMPORTANT — The user has provided context documents. Use them to frame the plan:

${contextBlock}`
    : basePrompt

  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `CURRENT PLAN:\n${body.currentPlan}\n\nFEEDBACK:\n${body.feedback}`,
    },
  ]

  let raw
  if (engine === 'zai') {
    const apiKey = await requireUserApiKey(event, 'zai_api_key')
    raw = await callZai(apiKey, model, messages)
  } else if (engine === 'minimax') {
    const apiKey = await requireUserApiKey(event, 'minimax_api_key')
    raw = await callMinimax(apiKey, model, messages)
  } else {
    const apiKey = await requireUserApiKey(event, 'groq_api_key')
    raw = await callGroq(apiKey, model, messages)
  }

  return parseRefineResponse(raw)
})

function parseRefineResponse(result: any) {
  const content = result.choices?.[0]?.message?.content || ''

  const titleMatch = content.match(/TITLE:\s*(.+)/i)
  const planMatch = content.match(/PLAN:\s*\n([\s\S]+?)(?=\nCONTEXT_RULE:)/i)
  const contextRuleMatch = content.match(/CONTEXT_RULE:\s*([\s\S]+)/i)

  const title = titleMatch?.[1]?.trim() || content.split('\n')[0]
  const plan = planMatch?.[1]?.trim() || content.replace(/TITLE:.*\n?/, '').replace(/CONTEXT_RULE:[\s\S]*/, '').trim()
  const contextRule = contextRuleMatch?.[1]?.trim() || ''

  return { title, plan, contextRule }
}
