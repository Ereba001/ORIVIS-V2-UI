import { MessageCircle, Plus, CircleDot, Clock, CheckCircle2, Archive } from 'lucide-react'
import type { ChatMessageData } from '../../../components/support/ChatMessage'

export interface ChatTicket {
  uuid: string
  subject: string
  status: string
  reference: string
  createdAt: string
  messages: ChatMessageData[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: typeof CircleDot }> = {
  open: { label: 'Open', color: 'text-status-warning', Icon: CircleDot },
  assigned: { label: 'Assigned', color: 'text-status-info', Icon: Clock },
  accepted: { label: 'Accepted', color: 'text-status-info', Icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: 'text-status-info', Icon: Clock },
  waiting: { label: 'Waiting', color: 'text-brand-text-muted', Icon: Clock },
  resolved: { label: 'Resolved', color: 'text-status-success', Icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'text-brand-text-disabled', Icon: Archive },
}

export { STATUS_CONFIG }

interface TicketListProps {
  tickets: ChatTicket[]
  loading: boolean
  primaryColor: string
  onOpenTicket: (ticket: ChatTicket) => void
  onNewConversation: () => void
}

export default function TicketList({ tickets, loading, primaryColor, onOpenTicket, onNewConversation }: TicketListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-brand-text-muted border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: `${primaryColor}15` }}>
          <MessageCircle size={24} style={{ color: primaryColor }} />
        </div>
        <p className="text-sm font-bold text-brand-text-primary mb-1">No conversations yet</p>
        <p className="text-[11px] text-brand-text-muted mb-5">Start a new conversation with our support team.</p>
        <button onClick={onNewConversation}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
          style={{ backgroundColor: primaryColor }}>
          <Plus size={14} /> New Conversation
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="px-4 py-3">
        <button onClick={onNewConversation}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed transition-all text-xs font-bold cursor-pointer"
          style={{ borderColor: `${primaryColor}40`, color: primaryColor }}>
          <Plus size={14} /> New Conversation
        </button>
      </div>
      {tickets.map((ticket) => {
        const st = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open
        const lastMsg = ticket.messages[ticket.messages.length - 1]
        return (
          <button key={ticket.uuid}
            onClick={() => onOpenTicket(ticket)}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-brand-surface-interactive/50 transition-colors text-left border-b border-brand-divider last:border-0 cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: `${primaryColor}12` }}>
              <MessageCircle size={16} style={{ color: primaryColor }} />
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
  )
}
