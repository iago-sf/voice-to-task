import { ensureDB } from '~/server/utils/db'
import { streamGroq, streamZai, streamMinimax } from '~/server/utils/llm'
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

  let contextBlock = ''
  if (contextIds.length > 0) {
    const db = await ensureDB()
    const placeholders = contextIds.map(() => '?').join(',')
    const { rows } = await db.execute({
      sql: `SELECT name, content FROM contexts WHERE id IN (${placeholders}) AND user_email = ?`,
      args: [...contextIds, userEmail],
    })

    if (rows.length > 0) {
      contextBlock = (rows as any[])
        .map(r => `--- Context: ${r.name} ---\n${r.content}`)
        .join('\n\n')
    }
  }

  const defaultBasePrompt = `You are a senior task planning assistant. Given a raw task description (often from voice transcription), produce a thorough, actionable plan.

Reply in the same language as the input. Use this exact format:

TITLE: <concise task title, max 100 chars, imperative form>

CONTEXT NEEDED:
Before writing the plan, assess whether the task description has enough detail. If information is missing or ambiguous, list specific questions for the developer. Examples of useful questions:
- Which files or modules should be touched?
- What is the expected behavior in edge case X?
- Are there existing patterns or utilities to reuse?
- What is the acceptance criteria?
- Should this be behind a feature flag?
If the task is fully clear, skip this section entirely.

PLAN:
- [ ] Step 1 — be specific: mention file paths, function names, API endpoints, or component names when possible
- [ ] Step 2 — each step should be independently verifiable
- [ ] Step 3 — include testing or validation steps when relevant
...

Rules for the plan:
- Be specific, not generic. Mention concrete files, functions, endpoints, or components when context allows it.
- Each step must be independently actionable — a developer should know exactly what to do without guessing.
- Include edge cases, error handling, or validation steps when relevant.
- If the task involves multiple areas (backend + frontend, or multiple modules), group steps logically.
- Between 4 and 12 steps. More complex tasks get more steps.
- When a step involves creating or modifying something, describe WHAT changes and WHY, not just "do it".

QUESTIONS:
If the task description lacks critical information, list 1-5 concrete questions for the developer here. Formulate them as specific, answerable questions — not vague requests for "more details". If the task is clear enough, write "None — task is clear."

GENERATED CONTEXT:
After completing the plan, generate a brief context document (2-10 lines of bullet points) summarizing the key domain knowledge, patterns, or decisions involved in this task. This context can be uploaded to the app and reused for future tasks in the same area. Write it in third person, as a reference document. Example format:
- Area: <area/module name>
- Key files: <list>
- Patterns used: <brief description>
- Dependencies: <libraries, APIs, services>
- Notes: <any non-obvious decisions or constraints>

If the task is too trivial to warrant a context, write "None."`

  const basePrompt = customPrompt && customPrompt !== '__DEFAULT__' ? customPrompt : defaultBasePrompt

  const systemPrompt = contextBlock
    ? `${basePrompt}

IMPORTANT — The user has provided context documents that define the project, its conventions, technologies, and constraints. These documents take PRIORITY over any generic assumptions. You MUST use them to:
- Frame the task title using the project's domain and terminology
- Define steps that align with the project's stack, tools, and workflows
- Follow any conventions or guidelines specified in the context (naming, testing, deployment, etc.)
- Reference specific technologies, libraries, or patterns mentioned in the context
- Skip QUESTIONS that are already answered by the context documents
- Enrich the GENERATED CONTEXT with knowledge from the provided context documents

Context documents:

${contextBlock}`
    : basePrompt

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: body.text },
  ]

  let stream: AsyncGenerator<string>
  if (engine === 'zai') {
    const apiKey = await requireUserApiKey(event, 'zai_api_key')
    stream = streamZai(apiKey, model, messages)
  } else if (engine === 'minimax') {
    const apiKey = await requireUserApiKey(event, 'minimax_api_key')
    stream = streamMinimax(apiKey, model, messages)
  } else {
    const apiKey = await requireUserApiKey(event, 'groq_api_key')
    stream = streamGroq(apiKey, model, messages)
  }

  event.node.res.statusCode = 200
  event.node.res.setHeader('Content-Type', 'text/event-stream')
  event.node.res.setHeader('Cache-Control', 'no-cache')
  event.node.res.setHeader('Connection', 'keep-alive')
  event.node.res.setHeader('X-Accel-Buffering', 'no')
  event.node.res.flushHeaders()

  const send = (data: string) => {
    event.node.res.write(`data: ${data}\n\n`)
  }

  try {
    for await (const chunk of stream) {
      send(JSON.stringify({ chunk }))
    }
    send('[DONE]')
  } catch (err: any) {
    send(JSON.stringify({ error: err.message || 'Stream error' }))
  } finally {
    event.node.res.end()
  }
})
