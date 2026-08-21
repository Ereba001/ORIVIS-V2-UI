import { useState, useRef, useCallback, useEffect } from "react"
import { Mic, Square, Trash2 } from "lucide-react"

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void
  onCancel?: () => void
  disabled?: boolean
}

export default function VoiceRecorder({ onRecordingComplete, onCancel, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [amplitudes, setAmplitudes] = useState<number[]>(new Array(40).fill(0.1))
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    cancelAnimationFrame(animFrameRef.current)
    setRecording(false)
    setPaused(false)
  }, [])

  const cancelRecording = useCallback(() => {
    chunksRef.current = []
    stopRecording()
    setDuration(0)
    setAmplitudes(new Array(40).fill(0.1))
    onCancel?.()
  }, [stopRecording, onCancel])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 128
      source.connect(analyser)
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const drawWaveform = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        const step = Math.floor(dataArray.length / 40)
        const newAmps = Array.from({ length: 40 }, (_, i) => {
          const val = dataArray[i * step] ?? 0
          return Math.max(0.08, val / 255)
        })
        setAmplitudes(newAmps)
        animFrameRef.current = requestAnimationFrame(drawWaveform)
      }
      drawWaveform()

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        audioCtx.close()
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          onRecordingComplete(blob, duration)
        }
        chunksRef.current = []
      }

      mediaRecorder.start(250)
      setRecording(true)
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch {
      // mic permission denied or not available
    }
  }, [duration, onRecordingComplete])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      cancelAnimationFrame(animFrameRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (!recording) {
    return (
      <button
        onClick={startRecording}
        disabled={disabled}
        className="p-2.5 rounded-xl bg-brand-surface-elevated border border-brand-border text-brand-text-muted hover:text-status-error hover:border-status-error/30 transition-all cursor-pointer disabled:opacity-40"
        title="Record voice note"
      >
        <Mic size={14} />
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 bg-brand-surface-elevated border border-brand-border rounded-xl px-3 py-2">
      <button
        onClick={cancelRecording}
        className="p-1.5 rounded-lg text-brand-text-muted hover:text-status-error hover:bg-status-error/10 transition-colors cursor-pointer"
        title="Cancel recording"
      >
        <Trash2 size={12} />
      </button>

      <div className="flex items-end gap-px h-5 flex-1 min-w-[80px] sm:min-w-[120px]">
        {amplitudes.map((amp, i) => (
          <div
            key={i}
            className="flex-1 bg-status-error rounded-full transition-all duration-75"
            style={{ height: `${Math.max(8, amp * 100)}%`, opacity: paused ? 0.4 : 1 }}
          />
        ))}
      </div>

      <span className="text-[10px] font-mono text-status-error font-bold min-w-[32px] text-right">
        {formatDuration(duration)}
      </span>

      <button
        onClick={() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.pause()
            setPaused(true)
            if (timerRef.current) clearInterval(timerRef.current)
          } else if (mediaRecorderRef.current?.state === 'paused') {
            mediaRecorderRef.current.resume()
            setPaused(false)
            timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
          }
        }}
        className="p-1.5 rounded-lg text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
        title={paused ? 'Resume' : 'Pause'}
      >
        <div className={`w-2.5 h-2.5 rounded-sm ${paused ? 'bg-status-error' : 'bg-status-error animate-pulse'}`} />
      </button>

      <button
        onClick={stopRecording}
        className="p-1.5 rounded-lg bg-status-error text-white hover:opacity-90 transition-all cursor-pointer"
        title="Stop & send"
      >
        <Square size={10} fill="white" />
      </button>
    </div>
  )
}
