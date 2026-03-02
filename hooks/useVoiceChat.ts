import { useCallback, useEffect, useRef, useState } from 'react'
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition'
import { AudioContext, type AnalyserNode as AnalyserNodeType } from 'react-native-audio-api'
import { generateAPIUrl } from '@/utils'
import { fetch as expoFetch } from 'expo/fetch'

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

type UseVoiceChatOptions = {
  onTranscript?: (text: string, isFinal: boolean) => void
  onSpeakingStart?: () => void
  onSpeakingEnd?: () => void
  onError?: (error: string) => void
}

export function useVoiceChat({
  onTranscript,
  onSpeakingStart,
  onSpeakingEnd,
  onError,
}: UseVoiceChatOptions = {}) {
  const [state, setState] = useState<VoiceState>('idle')
  const [interimTranscript, setInterimTranscript] = useState('')

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNodeType | null>(null)
  const sourceRef = useRef<any>(null)
  const isStoppingRef = useRef(false)
  const isSpeakingRef = useRef(false)

  // Stable callback refs
  const onTranscriptRef = useRef(onTranscript)
  const onSpeakingStartRef = useRef(onSpeakingStart)
  const onSpeakingEndRef = useRef(onSpeakingEnd)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onTranscriptRef.current = onTranscript
    onSpeakingStartRef.current = onSpeakingStart
    onSpeakingEndRef.current = onSpeakingEnd
    onErrorRef.current = onError
  }, [onTranscript, onSpeakingStart, onSpeakingEnd, onError])

  // Initialize AudioContext lazily
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
      const analyser = audioContextRef.current.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser
    }
    return audioContextRef.current
  }, [])

  // Set up STT event listeners
  useEffect(() => {
    const resultSub = ExpoSpeechRecognitionModule.addListener('result', (event) => {
      const transcript = event.results[0]?.transcript || ''
      const isFinal = event.isFinal

      setInterimTranscript(isFinal ? '' : transcript)
      onTranscriptRef.current?.(transcript, isFinal)

      if (isFinal) {
        setState('processing')
      }
    })

    const errorSub = ExpoSpeechRecognitionModule.addListener('error', (event) => {
      // no-speech / speech-timeout are normal — just go back to idle silently
      if (event.error === 'no-speech' || event.error === 'speech-timeout') {
        setState('idle')
        return
      }
      console.warn('[VOICE] STT error:', event.error, event.message)
      onErrorRef.current?.(event.message || event.error)
      setState('idle')
    })

    const endSub = ExpoSpeechRecognitionModule.addListener('end', () => {
      // Only transition to idle if we're still listening (not already processing/speaking)
      setState(prev => prev === 'listening' ? 'idle' : prev)
    })

    return () => {
      resultSub.remove()
      errorSub.remove()
      endSub.remove()
    }
  }, [])

  const startListening = useCallback(async () => {
    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
      if (!granted) {
        onErrorRef.current?.('Microphone permission denied')
        return
      }

      setInterimTranscript('')
      setState('listening')

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
      })
    } catch (error) {
      console.error('[VOICE] Failed to start listening:', error)
      onErrorRef.current?.('Failed to start speech recognition')
      setState('idle')
    }
  }, [])

  const stopListening = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop()
    } catch (error) {
      console.error('[VOICE] Failed to stop listening:', error)
    }
  }, [])

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return

    // Stop any existing playback before starting new speech
    if (sourceRef.current) {
      try { sourceRef.current.stop() } catch {}
      sourceRef.current = null
    }

    // Guard against concurrent speak calls
    if (isSpeakingRef.current) return
    isSpeakingRef.current = true

    try {
      setState('speaking')
      onSpeakingStartRef.current?.()

      // Fetch TTS audio from our endpoint
      const url = generateAPIUrl('/api/speech')
      console.log('[VOICE] Fetching TTS for:', text.substring(0, 60) + '...')
      const response = await expoFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      console.log('[VOICE] Got audio buffer, size:', arrayBuffer.byteLength)
      const ctx = getAudioContext()

      // Resume context if suspended
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      // Decode the audio data
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      console.log('[VOICE] Decoded audio, duration:', audioBuffer.duration, 's')

      // Create source and connect through analyser
      const source = await ctx.createBufferSource()
      source.buffer = audioBuffer

      const analyser = analyserRef.current!
      source.connect(analyser)
      analyser.connect(ctx.destination)

      sourceRef.current = source

      // Start playback
      source.start()
      console.log('[VOICE] Playback started')

      // Wait for playback to finish
      const duration = audioBuffer.duration * 1000 // ms
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          sourceRef.current = null
          resolve()
        }, duration + 100) // small buffer
      })

      if (!isStoppingRef.current) {
        setState('idle')
        onSpeakingEndRef.current?.()
      }
    } catch (error) {
      console.error('[VOICE] TTS error:', error)
      setState('idle')
      onSpeakingEndRef.current?.()
    } finally {
      isSpeakingRef.current = false
    }
  }, [getAudioContext])

  const stopSpeaking = useCallback(() => {
    isStoppingRef.current = true
    try {
      if (sourceRef.current) {
        sourceRef.current.stop()
        sourceRef.current = null
      }
    } catch (error) {
      // Source may already be stopped
    }
    setState('idle')
    onSpeakingEndRef.current?.()
    isStoppingRef.current = false
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        ExpoSpeechRecognitionModule.abort()
      } catch {}
      if (sourceRef.current) {
        try { sourceRef.current.stop() } catch {}
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close() } catch {}
      }
    }
  }, [])

  return {
    state,
    interimTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    analyserNode: analyserRef.current,
    setState,
  }
}
