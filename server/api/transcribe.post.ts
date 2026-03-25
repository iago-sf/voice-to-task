export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const engine = (query.engine as string) || 'groq'

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, message: 'No multipart data received' })
  }

  const audioFile = formData.find(f => f.name === 'file')
  const languageField = formData.find(f => f.name === 'language')

  if (!audioFile || !audioFile.data) {
    throw createError({ statusCode: 400, message: 'No audio file provided' })
  }

  // Map BCP-47 language codes to ISO 639-1
  const langMap: Record<string, string> = {
    'es-ES': 'es',
    'en-US': 'en',
    'pt-BR': 'pt',
    'ca-ES': 'ca',
    'gl-ES': 'gl',
    'eu-ES': 'eu',
  }
  const rawLang = languageField?.data?.toString() || 'es-ES'
  const language = langMap[rawLang] || rawLang.split('-')[0]

  if (engine === 'zai') {
    return transcribeWithZai(config, audioFile, language)
  }
  return transcribeWithGroq(config, audioFile, language)
})

async function transcribeWithGroq(
  config: ReturnType<typeof useRuntimeConfig>,
  audioFile: { data: Buffer; type?: string },
  language: string,
) {
  if (!config.groqApiKey) {
    throw createError({ statusCode: 500, message: 'GROQ_API_KEY not configured' })
  }

  const blob = new Blob([audioFile.data], { type: audioFile.type || 'audio/webm' })
  const form = new FormData()
  form.append('file', blob, 'audio.webm')
  form.append('model', 'whisper-large-v3-turbo')
  form.append('language', language)
  form.append('response_format', 'json')

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${config.groqApiKey}` },
      body: form,
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Groq API error: ${response.status} ${err}`)
    }

    const result = await response.json()
    return { text: result.text || '' }
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message || 'Transcription failed' })
  }
}

async function transcribeWithZai(
  config: ReturnType<typeof useRuntimeConfig>,
  audioFile: { data: Buffer; type?: string },
  language: string,
) {
  if (!config.zaiApiKey) {
    throw createError({ statusCode: 500, message: 'ZAI_API_KEY not configured' })
  }

  const blob = new Blob([audioFile.data], { type: audioFile.type || 'audio/webm' })
  const form = new FormData()
  form.append('file', blob, 'audio.webm')
  form.append('model', 'glm-asr-2512')
  form.append('language', language)

  try {
    const response = await fetch('https://api.z.ai/api/paas/v4/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${config.zaiApiKey}` },
      body: form,
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`ZAI API error: ${response.status} ${err}`)
    }

    const result = await response.json()
    return { text: result.text || '' }
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message || 'Transcription failed' })
  }
}
