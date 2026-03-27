import { ensureDB } from '~/server/utils/db'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'
import { callGroq, callZai, callMinimax } from '~/server/utils/llm'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  await checkUsage(userEmail)
  const body = await readBody<{
    contextIds: number[]
    engine?: string
    model?: string
  }>(event)

  const { contextIds } = body
  const engine = body.engine || 'groq'
  const model = body.model || 'openai/gpt-oss-120b'

  if (!Array.isArray(contextIds) || contextIds.length < 2) {
    throw createError({ statusCode: 400, message: 'At least 2 context IDs required' })
  }

  const db = await ensureDB()

  // Load contexts owned by this user
  const placeholders = contextIds.map(() => '?').join(', ')
  const { rows } = await db.execute({
    sql: `SELECT * FROM contexts WHERE id IN (${placeholders}) AND user_email = ? ORDER BY name ASC`,
    args: [...contextIds, userEmail],
  })

  if (rows.length < 2) {
    throw createError({ statusCode: 400, message: 'Not enough valid contexts to compact' })
  }

  // Build input for the LLM
  const contextDump = (rows as any[])
    .map(r => `--- Context: ${r.name} ---\n${r.content || '(empty)'}`)
    .join('\n\n')

  const systemPrompt = `You are a context-merging assistant. The user has multiple small context documents used to guide an AI task planner. Your job is to merge them into a single, well-organized markdown document.

Rules:
- Deduplicate redundant or overlapping information
- Group related content under clear markdown headings
- Preserve all unique rules, conventions, preferences, and constraints — do not drop anything meaningful
- Use concise language; remove filler but keep specifics
- Output ONLY the merged markdown content, no preamble or explanation
- Keep the same language as the input contexts`

  const userMessage = `Merge the following ${rows.length} context documents into one:\n\n${contextDump}`

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]

  // Call the LLM
  let mergedContent: string
  try {
    let result
    if (engine === 'zai') {
      const apiKey = await requireUserApiKey(event, 'zai_api_key')
      result = await callZai(apiKey, model, messages)
    } else if (engine === 'minimax') {
      const apiKey = await requireUserApiKey(event, 'minimax_api_key')
      result = await callMinimax(apiKey, model, messages)
    } else {
      const apiKey = await requireUserApiKey(event, 'groq_api_key')
      result = await callGroq(apiKey, model, messages)
    }
    mergedContent = result.choices?.[0]?.message?.content || ''
  } catch (err: any) {
    throw createError({ statusCode: 500, message: `LLM merge failed: ${err.message || 'Unknown error'}` })
  }

  if (!mergedContent.trim()) {
    throw createError({ statusCode: 500, message: 'LLM returned empty merge result' })
  }

  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const name = `Compactado (${dateStr})`

  // Create the merged context
  const { rows: [created] } = await db.execute({
    sql: 'INSERT INTO contexts (name, content, user_email) VALUES (?, ?, ?) RETURNING *',
    args: [name, mergedContent, userEmail],
  })

  // Delete originals
  await db.execute({
    sql: `DELETE FROM contexts WHERE id IN (${placeholders}) AND user_email = ?`,
    args: [...contextIds, userEmail],
  })

  return created
})
