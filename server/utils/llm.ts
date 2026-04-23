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
      throw new Error(response.status === 401 ? 'Groq API key is invalid or missing. Go to Config > API Keys to set it.' : response.status === 429 ? 'Groq rate limit reached. Wait a moment or try a different model.' : `Groq API error: ${response.status}`)
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
      throw new Error(response.status === 401 ? 'ZAI API key is invalid or missing. Go to Config > API Keys to set it.' : response.status === 429 ? 'ZAI rate limit reached. Wait a moment or try a different model.' : `ZAI API error: ${response.status}`)
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
      throw new Error(response.status === 401 ? 'MiniMax API key is invalid or missing. Go to Config > API Keys to set it.' : response.status === 429 ? 'MiniMax rate limit reached. Wait a moment or try a different model.' : `MiniMax API error: ${response.status}`)
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

export interface TokenUsage {
  prompt: number
  completion: number
  total: number
}

export interface StreamChunk {
  type: 'content' | 'usage'
  content?: string
  usage?: TokenUsage
}

async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<StreamChunk> {
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
            if (content) yield { type: 'content', content }
            if (json.usage) yield { type: 'usage', usage: { prompt: json.usage.prompt_tokens || 0, completion: json.usage.completion_tokens || 0, total: json.usage.total_tokens || 0 } }
          } catch {}
        }
        return
      }
      try {
        const json = JSON.parse(data)
        const content = json.choices?.[0]?.delta?.content
        if (content) yield { type: 'content', content }
        if (json.usage) yield { type: 'usage', usage: { prompt: json.usage.prompt_tokens || 0, completion: json.usage.completion_tokens || 0, total: json.usage.total_tokens || 0 } }
      } catch {}
    }
  }

  if (fullText.trim()) {
    try {
      const json = JSON.parse(fullText.trim())
      const content = json.choices?.[0]?.message?.content
      if (content) yield { type: 'content', content }
      if (json.usage) yield { type: 'usage', usage: { prompt: json.usage.prompt_tokens || 0, completion: json.usage.completion_tokens || 0, total: json.usage.total_tokens || 0 } }
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
): AsyncGenerator<StreamChunk> {
  const { request, clearTimeout } = getStreamOrFallback(
    'https://api.groq.com/openai/v1/chat/completions',
    apiKey, model, messages, 2048,
  )

  try {
    const response = await request

    if (!response.ok) {
      const err = await response.text()
      console.error(`Groq stream error: ${response.status}`, err)
      throw createError({ statusCode: 500, message: response.status === 401 ? 'Groq API key is invalid or missing. Go to Config > API Keys to set it.' : response.status === 429 ? 'Groq rate limit reached. Wait a moment or try a different model.' : response.status === 402 ? 'Groq quota exceeded. Check your plan at console.groq.com' : `Groq API error: ${response.status}` })
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
): AsyncGenerator<StreamChunk> {
  const { request, clearTimeout } = getStreamOrFallback(
    'https://api.z.ai/api/coding/paas/v4/chat/completions',
    apiKey, model, messages, 4096,
  )

  try {
    const response = await request

    if (!response.ok) {
      const err = await response.text()
      console.error(`ZAI stream error: ${response.status}`, err)
      throw createError({ statusCode: 500, message: response.status === 401 ? 'ZAI API key is invalid or missing. Go to Config > API Keys to set it.' : response.status === 429 ? 'ZAI rate limit reached. Wait a moment or try a different model.' : `ZAI API error: ${response.status}` })
    }

    const isStreaming = response.headers.get('content-type')?.includes('text/event-stream')

    if (!isStreaming) {
      const json = await response.json()
      const content = json.choices?.[0]?.message?.content || ''
      if (content) yield { type: 'content', content }
      if (json.usage) yield { type: 'usage', usage: { prompt: json.usage.prompt_tokens || 0, completion: json.usage.completion_tokens || 0, total: json.usage.total_tokens || 0 } }
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
): AsyncGenerator<StreamChunk> {
  const { request, clearTimeout } = getStreamOrFallback(
    'https://api.minimax.io/v1/chat/completions',
    apiKey, model, messages, 2048,
  )

  try {
    const response = await request

    if (!response.ok) {
      const err = await response.text()
      console.error(`MiniMax stream error: ${response.status}`, err)
      throw createError({ statusCode: 500, message: response.status === 401 ? 'MiniMax API key is invalid or missing. Go to Config > API Keys to set it.' : response.status === 429 ? 'MiniMax rate limit reached. Wait a moment or try a different model.' : `MiniMax API error: ${response.status}` })
    }

    const isStreaming = response.headers.get('content-type')?.includes('text/event-stream')

    if (!isStreaming) {
      const json = await response.json()
      const content = json.choices?.[0]?.message?.content || ''
      if (content) yield { type: 'content', content }
      if (json.usage) yield { type: 'usage', usage: { prompt: json.usage.prompt_tokens || 0, completion: json.usage.completion_tokens || 0, total: json.usage.total_tokens || 0 } }
      return
    }

    const reader = response.body?.getReader()
    if (!reader) throw createError({ statusCode: 500, message: 'No response body' })

    yield* parseSSEStream(reader)
  } finally {
    clearTimeout()
  }
}


export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface ToolUseResponse {
  content: string
  toolCalls: ToolCall[]
  usage: TokenUsage | null
}

export async function callGroqWithTools(
  apiKey: string,
  model: string,
  messages: { role: string; content: string | null }[],
  tools: any[],
): Promise<ToolUseResponse> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, tools, tool_choice: 'auto', temperature: 0.3, max_tokens: 4096 }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error(`Groq tool-use error: ${response.status}`, err)
    throw createError({ statusCode: 500, message: response.status === 401 ? 'Groq API key is invalid or missing. Go to Config > API Keys to set it.' : response.status === 429 ? 'Groq rate limit reached. Wait a moment or try a different model.' : response.status === 402 ? 'Groq quota exceeded. Check your plan at console.groq.com' : `Groq API error: ${response.status}` })
  }

  const json = await response.json()
  const choice = json.choices?.[0]
  const message = choice?.message

  return {
    content: message?.content || '',
    toolCalls: (message?.tool_calls || []).map((tc: any) => ({
      id: tc.id,
      type: 'function' as const,
      function: { name: tc.function.name, arguments: tc.function.arguments },
    })),
    usage: json.usage ? { prompt: json.usage.prompt_tokens || 0, completion: json.usage.completion_tokens || 0, total: json.usage.total_tokens || 0 } : null,
  }
}

export async function callZaiWithTools(
  apiKey: string,
  model: string,
  messages: { role: string; content: string | null }[],
  tools: any[],
): Promise<ToolUseResponse> {
  const response = await fetch('https://api.z.ai/api/coding/paas/v4/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, tools, tool_choice: 'auto', temperature: 0.3, max_tokens: 4096 }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error(`ZAI tool-use error: ${response.status}`, err)
    throw createError({ statusCode: 500, message: response.status === 401 ? 'ZAI API key is invalid or missing. Go to Config > API Keys to set it.' : response.status === 429 ? 'ZAI rate limit reached. Wait a moment or try a different model.' : `ZAI API error: ${response.status}` })
  }

  const json = await response.json()
  const choice = json.choices?.[0]
  const message = choice?.message

  return {
    content: message?.content || '',
    toolCalls: (message?.tool_calls || []).map((tc: any) => ({
      id: tc.id,
      type: 'function' as const,
      function: { name: tc.function.name, arguments: tc.function.arguments },
    })),
    usage: json.usage ? { prompt: json.usage.prompt_tokens || 0, completion: json.usage.completion_tokens || 0, total: json.usage.total_tokens || 0 } : null,
  }
}

export async function callMinimaxWithTools(
  apiKey: string,
  model: string,
  messages: { role: string; content: string | null }[],
  tools: any[],
): Promise<ToolUseResponse> {
  const response = await fetch('https://api.minimax.io/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, tools, tool_choice: 'auto', temperature: 0.3, max_tokens: 4096 }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error(`MiniMax tool-use error: ${response.status}`, err)
    throw createError({ statusCode: 500, message: response.status === 401 ? 'MiniMax API key is invalid or missing. Go to Config > API Keys to set it.' : response.status === 429 ? 'MiniMax rate limit reached. Wait a moment or try a different model.' : `MiniMax API error: ${response.status}` })
  }

  const json = await response.json()
  const choice = json.choices?.[0]
  const message = choice?.message

  return {
    content: message?.content || '',
    toolCalls: (message?.tool_calls || []).map((tc: any) => ({
      id: tc.id,
      type: 'function' as const,
      function: { name: tc.function.name, arguments: tc.function.arguments },
    })),
    usage: json.usage ? { prompt: json.usage.prompt_tokens || 0, completion: json.usage.completion_tokens || 0, total: json.usage.total_tokens || 0 } : null,
  }
}
