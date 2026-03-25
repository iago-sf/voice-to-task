import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.groqApiKey) {
    throw createError({ statusCode: 500, message: 'GROQ_API_KEY not configured' })
  }

  const body = await readBody(event)

  if (!body.text || typeof body.text !== 'string') {
    throw createError({ statusCode: 400, message: 'text is required' })
  }

  const language = body.language || 'es'
  const model = body.model || 'openai/gpt-oss-120b'
  const contextIds: number[] = body.contextIds || []

  // Load active contexts from DB
  let contextBlock = ''
  if (contextIds.length > 0) {
    const db = useDB()
    const placeholders = contextIds.map(() => '?').join(',')
    const rows = db.prepare(
      `SELECT name, content FROM contexts WHERE id IN (${placeholders})`
    ).all(...contextIds) as { name: string; content: string }[]

    if (rows.length > 0) {
      contextBlock = rows
        .map(r => `--- Context: ${r.name} ---\n${r.content}`)
        .join('\n\n')
    }
  }

  const systemPrompt = `You are a task planning assistant. Given a raw task description (often from voice transcription), you must return:

1. A concise summary title for the task (max 100 chars, imperative form)
2. A structured action plan with concrete steps to execute the task

Reply in the same language as the input. Use this exact format:

TITLE: <concise task title>

PLAN:
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3
...

Keep it practical, specific, and actionable. No fluff. Between 3 and 8 steps.${contextBlock ? `

The user has provided the following context documents. Use them to make the plan more specific and relevant:

${contextBlock}` : ''}`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: body.text },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Groq API error: ${response.status} ${err}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content || ''

    // Parse title and plan from response
    const titleMatch = content.match(/TITLE:\s*(.+)/i)
    const planMatch = content.match(/PLAN:\s*\n([\s\S]+)/i)

    const title = titleMatch?.[1]?.trim() || content.split('\n')[0]
    const plan = planMatch?.[1]?.trim() || content

    return { title, plan }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate action plan',
    })
  }
})
