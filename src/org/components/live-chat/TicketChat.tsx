import { useRef } from 'react'
import { Send, Paperclip, Image as ImageIcon, X, CheckCircle2 } from 'lucide-react'
import VoiceRecorder from '../../../components/support/VoiceRecorder'
import ChatMessage from '../../../components/support/ChatMessage'
import type { ChatMessageData } from '../../../components/support/ChatMessage'
import type { ChatTicket } from './TicketList'

export type PendingMedia = {
  type: 'voice' | 'image' | 'file'
  blob?: Blob
  fileName?: string
  fileSize?: number
  fileType?: string
  filePath?: string
  duration?: number
} | null

interface TicketChatProps {
  activeTicket: ChatTicket
  primaryColor: string
  sending: boolean
  inputText: string
  onInputChange: (value: string) => void
  pendingMedia: PendingMedia
  onClearPendingMedia: () => void
  onSend: () => void
  onVoiceRecorded: (blob: Blob, duration: number) => void
  onFileUpload: (file: File, type: 'image' | 'file') => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export default function TicketChat({
  activeTicket,
  primaryColor,
  sending,
  inputText,
  onInputChange,
  pendingMedia,
  onClearPendingMedia,
  onSend,
  onVoiceRecorded,
  onFileUpload,
  messagesEndRef,
}: TicketChatProps) {
  const groups: { date: string; items: ChatMessageData[] }[] = []
  let currentDate = ''
  for (const msg of activeTicket.messages) {
    const msgDate = new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    if (msgDate !== currentDate) { currentDate = msgDate; groups.push({ date: msgDate, items: [] }) }
    groups[groups.length - 1].items.push(msg)
  }

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <div className="flex justify-center py-2">
          <span className="text-[9px] px-3 py-1 rounded-full bg-brand-surface-elevated text-brand-text-muted">
            Conversation started · {new Date(activeTicket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {groups.map((group) => (
          <div key={group.date}>
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-brand-border" />
              <span className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">{group.date}</span>
              <div className="flex-1 h-px bg-brand-border" />
            </div>
            <div className="space-y-2">
              {group.items.map((msg) => (
                <ChatMessage key={msg.id} message={msg} isOwn={msg.authorRole === 'ORGANIZATION'} />
              ))}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start mb-1">
            <div className="bg-brand-surface-elevated border border-brand-divider rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-brand-divider px-4 py-3 bg-brand-surface space-y-2">
        {pendingMedia && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-surface-elevated border border-brand-divider">
            {pendingMedia.type === 'voice' ? (
              <div className="flex items-center gap-2 flex-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
                </div>
                <span className="text-[10px] font-mono text-brand-text-primary">Voice note ({pendingMedia.duration ? `${Math.floor(pendingMedia.duration / 60)}:${(pendingMedia.duration % 60).toString().padStart(2, '0')}` : '0:00'})</span>
              </div>
            ) : pendingMedia.type === 'image' && pendingMedia.filePath ? (
              <img src={pendingMedia.filePath} alt="Preview" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <Paperclip size={14} style={{ color: primaryColor }} className="shrink-0" />
            )}
            {pendingMedia.fileName && <span className="text-[10px] text-brand-text-muted truncate flex-1">{pendingMedia.fileName}</span>}
            <button onClick={onClearPendingMedia} className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted transition-colors cursor-pointer"><X size={10} /></button>
          </div>
        )}

        {activeTicket.status === 'closed' || activeTicket.status === 'resolved' ? (
          <div className="flex items-center justify-center gap-2 py-2 text-[10px] text-brand-text-muted">
            <CheckCircle2 size={12} />
            This conversation is {activeTicket.status}. Start a new one for further assistance.
          </div>
        ) : (
          <ChatInput
            primaryColor={primaryColor}
            sending={sending}
            inputText={inputText}
            onInputChange={onInputChange}
            pendingMedia={pendingMedia}
            onVoiceRecorded={onVoiceRecorded}
            onFileUpload={onFileUpload}
            onSend={onSend}
          />
        )}
      </div>
    </>
  )
}

function ChatInput({
  primaryColor,
  sending,
  inputText,
  onInputChange,
  pendingMedia,
  onVoiceRecorded,
  onFileUpload,
  onSend,
}: {
  primaryColor: string
  sending: boolean
  inputText: string
  onInputChange: (value: string) => void
  pendingMedia: PendingMedia
  onVoiceRecorded: (blob: Blob, duration: number) => void
  onFileUpload: (file: File, type: 'image' | 'file') => void
  onSend: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-end gap-2">
      <div className="flex items-center gap-1 shrink-0 pb-0.5">
        <VoiceRecorder onRecordingComplete={onVoiceRecorded} disabled={sending} />
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileUpload(f, 'image'); e.target.value = '' }} />
        <button onClick={() => imageInputRef.current?.click()} disabled={sending}
          className="p-2.5 rounded-xl bg-brand-surface-elevated border border-brand-divider text-brand-text-muted hover:text-brand-gold hover:border-brand-gold/30 transition-all cursor-pointer disabled:opacity-40"
          title="Upload image">
          <ImageIcon size={14} />
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileUpload(f, 'file'); e.target.value = '' }} />
        <button onClick={() => fileInputRef.current?.click()} disabled={sending}
          className="p-2.5 rounded-xl bg-brand-surface-elevated border border-brand-divider text-brand-text-muted hover:text-brand-gold hover:border-brand-gold/30 transition-all cursor-pointer disabled:opacity-40"
          title="Upload file">
          <Paperclip size={14} />
        </button>
      </div>

      <input
        ref={inputRef}
        value={inputText}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
        placeholder="Type a message..."
        className="flex-1 bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all"
      />
      <button onClick={onSend}
        disabled={(!inputText.trim() && !pendingMedia) || sending}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-white disabled:opacity-40 transition-all shrink-0 cursor-pointer"
        style={{ backgroundColor: primaryColor }}>
        <Send size={14} />
      </button>
    </div>
  )
}
