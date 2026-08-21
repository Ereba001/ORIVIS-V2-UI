import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X, Send, MessageCircle, ChevronLeft, Plus,
  CircleDot, Clock, CheckCircle2, Archive,
  Paperclip, Image as ImageIcon,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import { orgService } from '../../services/org-service'
import VoiceRecorder from '../../components/support/VoiceRecorder'
import ChatMessage from '../../components/support/ChatMessage'
import type { ChatMessageData } from '../../components/support/ChatMessage'
import NotificationBell from '../../components/support/NotificationBell'

interface ChatTicket {
  uuid: string
  subject: string
  status: string
  reference: string
  createdAt: string
  messages: ChatMessageData[]
}

interface LiveChatProps {
  open: boolean
  onClose: () => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: typeof CircleDot }> = {
  open: { label: 'Open', color: 'text-status-warning', Icon: CircleDot },
  assigned: { label: 'Assigned', color: 'text-blue-400', Icon: Clock },
  accepted: { label: 'Accepted', color: 'text-cyan-400', Icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: 'text-cyan-400', Icon: Clock },
  waiting: { label: 'Waiting', color: 'text-brand-text-muted', Icon: Clock },
  resolved: { label: 'Resolved', color: 'text-status-success', Icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'text-brand-text-disabled', Icon: Archive },
}

const CATEGORY_OPTIONS = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing', label: 'Account & Billing' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'other', label: 'General Inquiry' },
]

export default function LiveChat({ open, onClose }: LiveChatProps) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor

  const [view, setView] = useState<'list' | 'chat' | 'new'>('list')
  const [tickets, setTickets] = useState<ChatTicket[]>([])
  const [activeTicket, setActiveTicket] = useState<ChatTicket | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [inputText, setInputText] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [newCategory, setNewCategory] = useState('technical')
  const [creating, setCreating] = useState(false)
  const [pendingMedia, setPendingMedia] = useState<{ type: 'voice' | 'image' | 'file'; blob?: Blob; fileName?: string; fileSize?: number; fileType?: string; filePath?: string; duration?: number } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const mapMessages = (msgs: any[], userId?: number): ChatMessageData[] =>
    msgs.map((m: any) => ({
      id: m.uuid,
      author: m.user?.display_name || m.user?.name || 'Unknown',
      authorRole: m.is_internal ? 'STAFF' : (m.user_id === userId ? 'ORGANIZATION' : 'STAFF') as 'STAFF' | 'ORGANIZATION' | 'SYSTEM',
      content: m.body,
      messageType: (m.message_type as ChatMessageData['messageType']) || 'text',
      fileUrl: m.file_url ?? m.file_path ?? null,
      fileName: m.file_name ?? null,
      fileSize: m.file_size ?? null,
      fileType: m.file_type ?? null,
      voiceDuration: m.voice_duration ?? null,
      createdAt: m.created_at,
    }))

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const result = await orgService.getSupportTickets({ perPage: 50 })
      setTickets(result.items.map((t) => ({
        uuid: t.uuid,
        subject: t.subject,
        status: t.status,
        reference: t.reference,
        createdAt: t.created_at,
        messages: mapMessages(t.messages ?? [], t.user_id),
      })))
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  const loadTicket = useCallback(async (uuid: string) => {
    try {
      const updated = await orgService.getSupportTicket(uuid)
      if (updated) {
        const mapped: ChatTicket = {
          uuid: updated.uuid,
          subject: updated.subject,
          status: updated.status,
          reference: updated.reference,
          createdAt: updated.created_at,
          messages: mapMessages(updated.messages ?? [], updated.user_id),
        }
        setActiveTicket(mapped)
        setTickets((prev) => prev.map((t) => t.uuid === uuid ? mapped : t))
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (open && view === 'list') loadTickets()
  }, [open, view, loadTickets])

  useEffect(() => {
    if (view === 'chat') scrollToBottom()
  }, [view, activeTicket?.messages.length, scrollToBottom])

  useEffect(() => {
    if (open && view === 'chat') setTimeout(() => inputRef.current?.focus(), 100)
  }, [open, view])

  useEffect(() => {
    if (!activeTicket || view !== 'chat') return
    const interval = setInterval(async () => {
      try {
        const updated = await orgService.getSupportTicket(activeTicket.uuid)
        if (updated) {
          setActiveTicket((prev) => {
            if (!prev) return null
            return {
              ...prev,
              status: updated.status,
              messages: mapMessages(updated.messages ?? [], updated.user_id),
            }
          })
        }
      } catch { /* ignore */ }
    }, 10000)
    return () => clearInterval(interval)
  }, [activeTicket?.uuid, view])

  const handleSend = async () => {
    const hasText = inputText.trim().length > 0
    const hasMedia = pendingMedia !== null
    if ((!hasText && !hasMedia) || !activeTicket || sending) return

    const text = inputText.trim()
    setInputText('')
    setSending(true)

    try {
      let media: { message_type?: string; file_path?: string; file_name?: string; file_size?: number; file_type?: string; voice_duration?: number } | undefined

      if (hasMedia && pendingMedia) {
        if (pendingMedia.filePath) {
          media = {
            message_type: pendingMedia.type,
            file_path: pendingMedia.filePath,
            file_name: pendingMedia.fileName,
            file_size: pendingMedia.fileSize,
            file_type: pendingMedia.fileType,
            voice_duration: pendingMedia.duration,
          }
        } else if (pendingMedia.blob) {
          const file = new File([pendingMedia.blob], pendingMedia.fileName || 'upload', { type: pendingMedia.blob.type })
          const uploaded = await orgService.uploadSupportMedia(file)
          media = {
            message_type: uploaded.message_type,
            file_path: uploaded.file_path,
            file_name: uploaded.file_name,
            file_size: uploaded.file_size,
            file_type: uploaded.file_type,
            voice_duration: pendingMedia.duration,
          }
        }
      }

      await orgService.replyToTicket(activeTicket.uuid, text || (pendingMedia?.type === 'voice' ? '' : text), media)
      setPendingMedia(null)
      await loadTicket(activeTicket.uuid)
    } catch {
      // error handled silently
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (file: File, type: 'image' | 'file') => {
    try {
      const uploaded = await orgService.uploadSupportMedia(file)
      setPendingMedia({
        type,
        fileName: uploaded.file_name,
        fileSize: uploaded.file_size,
        fileType: uploaded.file_type,
        filePath: uploaded.file_path,
      })
    } catch { /* ignore */ }
  }

  const handleVoiceRecorded = async (blob: Blob, duration: number) => {
    setPendingMedia({
      type: 'voice',
      blob,
      fileName: `voice-${Date.now()}.webm`,
      fileSize: blob.size,
      fileType: blob.type,
      duration,
    })
  }

  const handleOpenTicket = (ticket: ChatTicket) => {
    setActiveTicket(ticket)
    setView('chat')
  }

  const handleClose = () => {
    setView('list')
    setActiveTicket(null)
    setPendingMedia(null)
    onClose()
  }

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim() || creating) return
    setCreating(true)
    try {
      const result = await orgService.createSupportTicket({
        subject: newSubject.trim(),
        description: newMessage.trim(),
        category: newCategory,
        priority: 'medium',
      })
      setNewSubject('')
      setNewMessage('')
      setNewCategory('technical')
      await loadTickets()
      if (result?.uuid) {
        await loadTicket(result.uuid)
        setView('chat')
      } else {
        setView('list')
      }
    } catch { /* ignore */ }
    setCreating(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[999] backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-brand-bg border-l border-brand-border z-[1000] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="shrink-0 px-4 py-3 border-b border-brand-divider" style={{ background: `linear-gradient(135deg, ${pColor}08, ${pColor}03)` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {view !== 'list' && (
                    <button onClick={() => { setView('list'); setPendingMedia(null) }}
                      className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted transition-colors cursor-pointer">
                      <ChevronLeft size={16} />
                    </button>
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-brand-text-primary">
                      {view === 'list' ? 'Support' : view === 'new' ? 'New Conversation' : activeTicket?.subject || 'Chat'}
                    </h3>
                    <p className="text-[10px] text-brand-text-muted">
                      {view === 'chat' && activeTicket
                        ? (STATUS_CONFIG[activeTicket.status] || STATUS_CONFIG.open).label
                        : 'We typically reply within minutes'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <NotificationBell
                    fetchNotifications={async () => {
                      const { items } = await orgService.getNotifications({ perPage: 20 })
                      return items.map((n) => ({ id: n.id, title: n.title, body: n.preview, type: n.type, read: n.read, created_at: n.time }))
                    }}
                    fetchUnreadCount={async () => {
                      const { items } = await orgService.getNotifications({ perPage: 100 })
                      return items.filter((n) => !n.read).length
                    }}
                  />
                  <button onClick={handleClose}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-surface-interactive transition-colors text-brand-text-muted cursor-pointer">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            {view === 'list' && (
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-brand-text-muted border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${pColor}15` }}>
                      <MessageCircle size={24} style={{ color: pColor }} />
                    </div>
                    <p className="text-sm font-bold text-brand-text-primary mb-1">No conversations yet</p>
                    <p className="text-[11px] text-brand-text-muted mb-5">Start a new conversation with our support team.</p>
                    <button onClick={() => setView('new')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                      style={{ backgroundColor: pColor }}>
                      <Plus size={14} /> New Conversation
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="px-4 py-3">
                      <button onClick={() => setView('new')}
                        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed transition-all text-xs font-bold cursor-pointer"
                        style={{ borderColor: `${pColor}40`, color: pColor }}>
                        <Plus size={14} /> New Conversation
                      </button>
                    </div>
                    {tickets.map((ticket) => {
                      const st = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open
                      const lastMsg = ticket.messages[ticket.messages.length - 1]
                      return (
                        <button key={ticket.uuid}
                          onClick={() => handleOpenTicket(ticket)}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-brand-surface-interactive/50 transition-colors text-left border-b border-brand-divider last:border-0 cursor-pointer">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: `${pColor}12` }}>
                            <MessageCircle size={16} style={{ color: pColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-brand-text-primary truncate">{ticket.subject}</span>
                              <span className="text-[9px] text-brand-text-muted shrink-0">{new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <st.Icon size={10} className={st.color} />
                              <span className={`text-[9px] font-medium ${st.color}`}>{st.label}</span>
                              <span className="text-[9px] text-brand-text-disabled">·</span>
                              <span className="text-[9px] text-brand-text-muted truncate">
                                {lastMsg ? (lastMsg.messageType === 'voice' ? '🎤 Voice note' : lastMsg.messageType === 'image' ? '🖼 Image' : lastMsg.messageType === 'file' ? '📎 File' : lastMsg.content) : 'No messages yet'}
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {view === 'new' && (
              <div className="flex-1 overflow-y-auto px-4 py-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">Subject</label>
                    <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="What do you need help with?"
                      className="w-full bg-brand-surface border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORY_OPTIONS.map((c) => (
                        <button key={c.value} onClick={() => setNewCategory(c.value)}
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            newCategory === c.value
                              ? 'text-white border-transparent'
                              : 'text-brand-text-muted border-brand-divider hover:border-brand-text-disabled'
                          }`}
                          style={newCategory === c.value ? { backgroundColor: pColor } : {}}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">Message</label>
                    <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                      rows={4} placeholder="Describe your issue..."
                      className="w-full bg-brand-surface border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all resize-none" />
                  </div>
                  <button onClick={handleCreateTicket}
                    disabled={!newSubject.trim() || !newMessage.trim() || creating}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all cursor-pointer"
                    style={{ backgroundColor: pColor }}>
                    {creating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    {creating ? 'Sending...' : 'Start Conversation'}
                  </button>
                </div>
              </div>
            )}

            {view === 'chat' && activeTicket && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                  <div className="flex justify-center py-2">
                    <span className="text-[9px] px-3 py-1 rounded-full bg-brand-surface-elevated text-brand-text-muted">
                      Conversation started · {new Date(activeTicket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {(() => {
                    const groups: { date: string; items: ChatMessageData[] }[] = []
                    let currentDate = ''
                    for (const msg of activeTicket.messages) {
                      const msgDate = new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                      if (msgDate !== currentDate) { currentDate = msgDate; groups.push({ date: msgDate, items: [] }) }
                      groups[groups.length - 1].items.push(msg)
                    }
                    return groups.map((group) => (
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
                    ))
                  })()}

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
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${pColor}15` }}>
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: pColor }} />
                          </div>
                          <span className="text-[10px] font-mono text-brand-text-primary">Voice note ({pendingMedia.duration ? `${Math.floor(pendingMedia.duration / 60)}:${(pendingMedia.duration % 60).toString().padStart(2, '0')}` : '0:00'})</span>
                        </div>
                      ) : pendingMedia.type === 'image' && pendingMedia.filePath ? (
                        <img src={pendingMedia.filePath} alt="Preview" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <Paperclip size={14} style={{ color: pColor }} className="shrink-0" />
                      )}
                      {pendingMedia.fileName && <span className="text-[10px] text-brand-text-muted truncate flex-1">{pendingMedia.fileName}</span>}
                      <button onClick={() => setPendingMedia(null)} className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted transition-colors cursor-pointer"><X size={10} /></button>
                    </div>
                  )}

                  {activeTicket.status === 'closed' || activeTicket.status === 'resolved' ? (
                    <div className="flex items-center justify-center gap-2 py-2 text-[10px] text-brand-text-muted">
                      <CheckCircle2 size={12} />
                      This conversation is {activeTicket.status}. Start a new one for further assistance.
                    </div>
                  ) : (
                    <div className="flex items-end gap-2">
                      <div className="flex items-center gap-1 shrink-0 pb-0.5">
                        <VoiceRecorder onRecordingComplete={handleVoiceRecorded} disabled={sending} />
                        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'image'); e.target.value = '' }} />
                        <button onClick={() => imageInputRef.current?.click()} disabled={sending}
                          className="p-2.5 rounded-xl bg-brand-surface-elevated border border-brand-divider text-brand-text-muted hover:text-brand-gold hover:border-brand-gold/30 transition-all cursor-pointer disabled:opacity-40"
                          title="Upload image">
                          <ImageIcon size={14} />
                        </button>
                        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'file'); e.target.value = '' }} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={sending}
                          className="p-2.5 rounded-xl bg-brand-surface-elevated border border-brand-divider text-brand-text-muted hover:text-brand-gold hover:border-brand-gold/30 transition-all cursor-pointer disabled:opacity-40"
                          title="Upload file">
                          <Paperclip size={14} />
                        </button>
                      </div>

                      <input
                        ref={inputRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                        placeholder="Type a message..."
                        className="flex-1 bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all"
                      />
                      <button onClick={handleSend}
                        disabled={(!inputText.trim() && !pendingMedia) || sending}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-white disabled:opacity-40 transition-all shrink-0 cursor-pointer"
                        style={{ backgroundColor: pColor }}>
                        <Send size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
