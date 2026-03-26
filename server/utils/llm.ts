export async function callGroq(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 1024 }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Groq API error: ${response.status} ${err}`)
    }

    return await response.json()
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message || 'Failed to call Groq' })
  }
}

export async function callZai(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
) {
  try {
    const response = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 1024 }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`ZAI API error: ${response.status} ${err}`)
    }

    return await response.json()
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message || 'Failed to call ZAI' })
  }
}

export async function callMinimax(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
) {
  try {
    const response = await fetch('https://api.minimax.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 1024 }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`MiniMax API error: ${response.status} ${err}`)
    }

    return await response.json()
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message || 'Failed to call MiniMax' })
  }
}

export function parseResponse(result: any) {
  const content = result.choices?.[0]?.message?.content || ''
  const titleMatch = content.match(/TITLE:\s*(.+)/i)
  const planMatch = content.match(/PLAN:\s*\n([\s\S]+)/i)
  const title = titleMatch?.[1]?.trim() || content.split('\n')[0]
  const plan = planMatch?.[1]?.trim() || content
  return { title, plan }
}
