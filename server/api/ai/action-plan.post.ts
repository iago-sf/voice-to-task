import { ensureDB } from '~/server/utils/db'
import { callGroq, callZai, callMinimax, parseResponse } from '~/server/utils/llm'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  await checkUsage(userEmail)
  const body = await readBody(event)

  if (!body.text || typeof body.text !== 'string') {
    throw createError({ statusCode: 400, message: 'text is required' })
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

  const defaultBasePrompt = `You are a task planning assistant. Given a raw task description (often from voice transcription), you must return:

1. A concise summary title for the task (max 100 chars, imperative form)
2. A structured action plan with concrete steps to execute the task

Reply in the same language as the input. Use this exact format:

TITLE: <concise task title>

PLAN:
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3
...

Keep it practical, specific, and actionable. No fluff. Between 3 and 8 steps.`

  const basePrompt = customPrompt || defaultBasePrompt

  const systemPrompt = contextBlock
    ? `${basePrompt}

IMPORTANT — The user has provided context documents that define the project, its conventions, technologies, and constraints. These documents take PRIORITY over any generic assumptions. You MUST use them to:
- Frame the task title using the project's domain and terminology
- Define steps that align with the project's stack, tools, and workflows
- Follow any conventions or guidelines specified in the context (naming, testing, deployment, etc.)
- Reference specific technologies, libraries, or patterns mentioned in the context

Context documents:

${contextBlock}`
    : basePrompt

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: body.text },
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
  return parseResponse(raw)
})
