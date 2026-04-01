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
      console.error(`Groq API error: ${response.status}`, err)
      throw new Error(`Groq API error: ${response.status}`)
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
    const response = await fetch('https://api.z.ai/api/coding/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 4096 }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error(`ZAI API error: ${response.status}`, err)
      throw new Error(`ZAI API error: ${response.status}`)
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
      console.error(`MiniMax API error: ${response.status}`, err)
      throw new Error(`MiniMax API error: ${response.status}`)
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

async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<string> {
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) {
        if (trimmed && !trimmed.startsWith(':')) {
          fullText += trimmed + '\n'
        }
        continue
      }
      const data = trimmed.slice(6)
      if (data === '[DONE]') {
        if (fullText.trim()) {
          try {
            const json = JSON.parse(fullText.trim())
            const content = json.choices?.[0]?.message?.content
            if (content) yield content
          } catch {}
        }
        return
      }
      try {
        const json = JSON.parse(data)
        const content = json.choices?.[0]?.delta?.content
        if (content) yield content
      } catch {}
    }
  }

  if (fullText.trim()) {
    try {
      const json = JSON.parse(fullText.trim())
      const content = json.choices?.[0]?.message?.content
      if (content) yield content
    } catch {}
  }
}

function getStreamOrFallback(
  url: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 300000)

  const request = fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: maxTokens, stream: true }),
    signal: controller.signal,
  })

  return { request, clearTimeout: () => clearTimeout(timeout) }
}

export async function* streamGroq(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
): AsyncGenerator<string> {
  const { request, clearTimeout } = getStreamOrFallback(
    'https://api.groq.com/openai/v1/chat/completions',
    apiKey, model, messages, 2048,
  )

  try {
    const response = await request

    if (!response.ok) {
      const err = await response.text()
      console.error(`Groq stream error: ${response.status}`, err)
      throw createError({ statusCode: 500, message: `Groq API error: ${response.status}` })
    }

    const reader = response.body?.getReader()
    if (!reader) throw createError({ statusCode: 500, message: 'No response body' })

    yield* parseSSEStream(reader)
  } finally {
    clearTimeout()
  }
}

export async function* streamZai(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
): AsyncGenerator<string> {
  const { request, clearTimeout } = getStreamOrFallback(
    'https://api.z.ai/api/coding/paas/v4/chat/completions',
    apiKey, model, messages, 4096,
  )

  try {
    const response = await request

    if (!response.ok) {
      const err = await response.text()
      console.error(`ZAI stream error: ${response.status}`, err)
      throw createError({ statusCode: 500, message: `ZAI API error: ${response.status}` })
    }

    const isStreaming = response.headers.get('content-type')?.includes('text/event-stream')

    if (!isStreaming) {
      const json = await response.json()
      const content = json.choices?.[0]?.message?.content || ''
      if (content) yield content
      return
    }

    const reader = response.body?.getReader()
    if (!reader) throw createError({ statusCode: 500, message: 'No response body' })

    yield* parseSSEStream(reader)
  } finally {
    clearTimeout()
  }
}

export async function* streamMinimax(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
): AsyncGenerator<string> {
  const { request, clearTimeout } = getStreamOrFallback(
    'https://api.minimax.io/v1/chat/completions',
    apiKey, model, messages, 2048,
  )

  try {
    const response = await request

    if (!response.ok) {
      const err = await response.text()
      console.error(`MiniMax stream error: ${response.status}`, err)
      throw createError({ statusCode: 500, message: `MiniMax API error: ${response.status}` })
    }

    const isStreaming = response.headers.get('content-type')?.includes('text/event-stream')

    if (!isStreaming) {
      const json = await response.json()
      const content = json.choices?.[0]?.message?.content || ''
      if (content) yield content
      return
    }

    const reader = response.body?.getReader()
    if (!reader) throw createError({ statusCode: 500, message: 'No response body' })

    yield* parseSSEStream(reader)
  } finally {
    clearTimeout()
  }
}
