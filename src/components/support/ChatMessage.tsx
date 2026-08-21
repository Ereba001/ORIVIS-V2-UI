import { useState, useRef, useCallback } from "react"
import { FileText, Download, Play, Pause } from "lucide-react"

interface ChatMessageData {
  id: string
  author: string
  authorRole: 'STAFF' | 'ORGANIZATION' | 'SYSTEM'
  content: string
  messageType?: 'text' | 'voice' | 'image' | 'file'
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  fileType?: string | null
  voiceDuration?: number | null
  createdAt: string
}

interface ChatMessageProps {
  message: ChatMessageData
  isOwn: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function AudioPlayer({ url, duration }: { url: string; duration: number | null }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(url)
      audio.preload = 'metadata'
      audio.addEventListener('timeupdate', () => {
        if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
      })
      audio.addEventListener('ended', () => { setPlaying(false); setProgress(0) })
      audio.addEventListener('error', () => { setPlaying(false); setProgress(0) })
      audioRef.current = audio
    }
    return audioRef.current
  }, [url])

  const toggle = useCallback(() => {
    const audio = getAudio()
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(() => setPlaying(false))
      setPlaying(true)
    }
  }, [playing, getAudio])

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <button onClick={toggle} className="p-1.5 rounded-full bg-brand-gold/20 text-brand-gold hover:bg-brand-gold/30 transition-colors cursor-pointer shrink-0">
        {playing ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
      </button>
      <div className="flex-1 h-1 bg-brand-border rounded-full overflow-hidden">
        <div className="h-full bg-brand-gold rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-[9px] font-mono text-brand-text-muted shrink-0">
        {duration != null ? formatDuration(duration) : '0:00'}
      </span>
    </div>
  )
}

function ImageAttachment({ url, fileName }: { url: string; fileName?: string | null }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg overflow-hidden border border-brand-border hover:opacity-90 transition-opacity cursor-pointer max-w-[200px]">
        <img src={url} alt={fileName || 'Image'} className="w-full h-auto max-h-[120px] object-cover" loading="lazy" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <img src={url} alt={fileName || 'Image'} className="max-w-full max-h-[90vh] rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}

function FileAttachment({ url, fileName, fileSize }: { url: string; fileName: string; fileSize?: number | null }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName}
      className="flex items-center gap-2 p-2 rounded-lg bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/30 transition-colors group"
    >
      <div className="p-1.5 rounded-lg bg-brand-gold/10">
        <FileText size={14} className="text-brand-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-brand-text-primary truncate">{fileName}</p>
        {fileSize != null && <p className="text-[8px] text-brand-text-muted">{formatFileSize(fileSize)}</p>}
      </div>
      <Download size={12} className="text-brand-text-muted group-hover:text-brand-gold transition-colors shrink-0" />
    </a>
  )
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now.getTime() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const type = message.messageType || 'text'
  const roleLabel = message.authorRole === 'STAFF' ? 'Staff' : 'Org'

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 ${
        isOwn
          ? 'bg-brand-gold/10 border border-brand-gold/20 rounded-br-md'
          : 'bg-brand-surface-elevated border border-brand-border rounded-bl-md'
      }`}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-bold text-brand-text-primary">{message.author}</span>
          <span className={`text-[7px] font-mono uppercase tracking-wider px-1 py-px rounded-full ${
            isOwn ? 'bg-brand-gold/20 text-brand-gold' : 'bg-brand-surface-interactive text-brand-text-muted'
          }`}>
            {roleLabel}
          </span>
        </div>

        {type === 'voice' && message.fileUrl ? (
          <AudioPlayer url={message.fileUrl} duration={message.voiceDuration ?? null} />
        ) : type === 'image' && message.fileUrl ? (
          <ImageAttachment url={message.fileUrl} fileName={message.fileName} />
        ) : type === 'file' && message.fileUrl ? (
          <FileAttachment url={message.fileUrl} fileName={message.fileName || 'File'} fileSize={message.fileSize} />
        ) : null}

        {message.content && type === 'text' ? (
          <p className="text-[11px] text-brand-text-secondary leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : message.content && type !== 'text' ? (
          <p className="text-[10px] text-brand-text-muted mt-1 italic">{message.content}</p>
        ) : null}

        <p className="text-[8px] font-mono text-brand-text-muted mt-1 text-right">{timeAgo(message.createdAt)}</p>
      </div>
    </div>
  )
}

export type { ChatMessageData }
