function mimeToExt(mime: string): string {
  if (mime.includes('mp4')) return 'mp4'
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('wav')) return 'wav'
  return 'webm'
}

export function useGroqSpeechToText(language: Ref<string> | string = 'es-ES', engine: Ref<string> | string = 'groq', deviceId: Ref<string> | string = '') {
  const transcript = ref('')
  const interimText = ref('')
  const isListening = ref(false)
  const isSupported = ref(false)
  const error = ref<string | null>(null)

  let mediaRecorder: MediaRecorder | null = null
  let audioChunks: Blob[] = []
  let stream: MediaStream | null = null

  if (import.meta.client) {
    isSupported.value = !!navigator.mediaDevices?.getUserMedia
  }

  async function start() {
    if (!import.meta.client) return
    error.value = null
    interimText.value = ''
    audioChunks = []

    try {
      const did = unref(deviceId)
      stream = await navigator.mediaDevices.getUserMedia({ audio: did ? { deviceId: { exact: did } } : true })
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: getSupportedMimeType(),
      })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data)
      }

      mediaRecorder.onstart = () => {
        interimText.value = 'Grabando audio...'
      }

      mediaRecorder.onstop = async () => {
        interimText.value = 'Transcribiendo...'

        if (audioChunks.length === 0) {
          interimText.value = ''
          return
        }

        const audioBlob = new Blob(audioChunks, { type: audioChunks[0]?.type || 'audio/webm' })
        audioChunks = []

        try {
          const formData = new FormData()
          const ext = mimeToExt(audioBlob.type)
          formData.append('file', audioBlob, `audio.${ext}`)
          formData.append('language', unref(language))

          const result = await $fetch<{ text: string }>(`/api/transcribe?engine=${unref(engine)}`, {
            method: 'POST',
            body: formData,
          })

          if (result.text) {
            transcript.value += (transcript.value ? ' ' : '') + result.text.trim()
          }
        } catch (err: any) {
          error.value = err.data?.message || err.message || 'Transcription failed'
        } finally {
          interimText.value = ''
        }
      }

      mediaRecorder.start()
      isListening.value = true
    } catch (err: any) {
      error.value = err.message || 'Could not access microphone'
      isListening.value = false
    }
  }

  function stop() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      stream = null
    }
    isListening.value = false
  }

  function reset() {
    stop()
    transcript.value = ''
    interimText.value = ''
    error.value = null
    audioChunks = []
  }

  return {
    transcript,
    interimText,
    isListening,
    isSupported,
    error,
    start,
    stop,
    reset,
  }
}

function getSupportedMimeType(): string {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return 'audio/webm'
}
