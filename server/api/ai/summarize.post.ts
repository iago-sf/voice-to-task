import { callGroq, callZai, callMinimax } from '~/server/utils/llm'
import { getSessionEmail } from '~/server/utils/session-email'
import { checkUsage } from '~/server/utils/usage'

export default defineEventHandler(async (event) => {
  const userEmail = await getSessionEmail(event)
  await checkUsage(userEmail)
  const body = await readBody(event)

  if (!body.messages || !Array.isArray(body.messages)) {
    throw createError({ statusCode: 400, message: 'messages array is required' })
  }

  const model = body.model || 'openai/gpt-oss-120b'
  const engine = body.engine || 'groq'
  const existingSummary: string = body.existingSummary || ''

  const systemPrompt = `Summarize conversation. Dense bullet points, no filler, no limit. Preserve ALL: task goal, tech details (files, functions, libs, APIs, endpoints, DB schemas), user corrections (corrected version only), decisions, preferences, plan state, constraints, edge cases. Every technical detail matters. Omit pleasantries. Same language as input.`

  const conversationText = body.messages
    .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'USER' : 'AI'}: ${m.content}`)
    .join('\n\n')

  const userContent = existingSummary
    ? `PREV:\n${existingSummary}\n\nNEW:\n${conversationText}\n\nUPDATED SUMMARY:`
    : `${conversationText}\n\nSUMMARY:`

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ]

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

  const summary = result.choices?.[0]?.message?.content || ''
  const usage = result.usage
    ? { prompt: result.usage.prompt_tokens || 0, completion: result.usage.completion_tokens || 0, total: result.usage.total_tokens || 0 }
    : null

  return { summary, usage }
})
