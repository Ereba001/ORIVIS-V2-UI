import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  X,
  LayoutDashboard,
  Search,
  User,
  UserPlus,
  Shield,
  Key,
  Vote,
  AlertTriangle,
  Activity,
} from "lucide-react"

const EVENT_ICONS: Record<string, typeof Activity> = {
  ASSISTED_CENTER_ACCESSED: LayoutDashboard,
  ASSISTED_ELECTION_CENTER_ACCESSED: LayoutDashboard,
  ASSISTED_PARTICIPANT_SEARCH: Search,
  ASSISTED_PARTICIPANT_OPENED: User,
  "assisted.participant_context_viewed": User,
  "assisted.participant_registered": UserPlus,
  "assisted.verification_otp_sent": Shield,
  "assisted.verification_completed": Shield,
  "assisted.pass_issued": Key,
  "assisted.pass_reissued": Key,
  "assisted.vote_cast": Vote,
  ASSISTED_ACTION_BLOCKED: AlertTriangle,
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  })
}

interface AssistedAuditModalProps {
  open: boolean
  onClose: () => void
  events: Array<{
    id: number
    event: string
    actor: string | null
    description: string
    created_at: string | null
    metadata?: Record<string, unknown>
  }>
  title?: string
  brandColor?: string
}

export default function AssistedAuditModal({
  open,
  onClose,
  events,
  title = "Audit History",
  brandColor = "#D4AF37",
}: AssistedAuditModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      closeBtnRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="glass-strong rounded-2xl shadow-brand-lg flex flex-col w-full max-w-2xl max-h-[80vh]"
          >
            <div className="flex items-start justify-between gap-3 p-6 pb-4 border-b border-brand-border shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${brandColor}18` }}
                >
                  <LayoutDashboard size={18} style={{ color: brandColor }} />
                </div>
                <h2 className="text-sm font-bold text-brand-text-primary leading-tight">{title}</h2>
              </div>
              <button
                ref={closeBtnRef}
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto p-6 pt-4 min-h-0 modal-scrollbar"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "var(--color-brand-border) transparent",
              }}
            >
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity size={32} className="text-brand-text-disabled mb-3" />
                  <p className="text-xs font-medium text-brand-text-muted">No audit events recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => {
                    const Icon = EVENT_ICONS[event.event] ?? Activity
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-brand-surface-elevated/50 border border-brand-border"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${brandColor}18` }}
                        >
                          <Icon size={14} style={{ color: brandColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-brand-text-primary truncate">
                              {event.event}
                            </span>
                            <span className="text-[9px] font-mono text-brand-text-muted whitespace-nowrap shrink-0">
                              {formatTimestamp(event.created_at)}
                            </span>
                          </div>
                          {event.actor && (
                            <p className="text-[10px] text-brand-text-muted mt-0.5">
                              {event.actor}
                            </p>
                          )}
                          <p className="text-[10px] text-brand-text-primary mt-1 leading-relaxed">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 p-6 pt-4 border-t border-brand-border shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary bg-brand-surface-interactive rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
