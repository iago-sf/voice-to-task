export function useSpeechToText(language: Ref<string> | string = 'es-ES') {
  const transcript = ref('')
  const interimText = ref('')
  const isListening = ref(false)
  const isSupported = ref(false)
  const error = ref<string | null>(null)

  let recognition: any = null

  if (import.meta.client) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    isSupported.value = !!SpeechRecognition

    if (SpeechRecognition) {
      recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onresult = (event: any) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            final += result[0].transcript
          } else {
            interim += result[0].transcript
          }
        }

        if (final) {
          transcript.value += (transcript.value ? ' ' : '') + final.trim()
        }
        interimText.value = interim
      }

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return
        error.value = event.error
        isListening.value = false
      }

      recognition.onend = () => {
        if (isListening.value) {
          // Auto-restart if we're still supposed to be listening
          try {
            recognition.start()
          } catch {
            isListening.value = false
          }
        }
      }
    }
  }

  function start() {
    if (!recognition) return
    error.value = null
    interimText.value = ''
    const lang = unref(language)
    recognition.lang = lang
    try {
      recognition.start()
      isListening.value = true
    } catch {
      // Already started
    }
  }

  function stop() {
    if (!recognition) return
    isListening.value = false
    recognition.stop()
    interimText.value = ''
  }

  function reset() {
    stop()
    transcript.value = ''
    interimText.value = ''
    error.value = null
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
