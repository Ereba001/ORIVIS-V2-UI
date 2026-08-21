import { useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { NotificationToast } from "../hooks/useNotifications"

const AUTO_DISMISS_MS: Record<NotificationToast["priority"], number> = {
  info: 5000,
  success: 6000,
  warning: 8000,
  critical: 12000,
}

const STYLES: Record<NotificationToast["priority"], { icon: typeof Info; ring: string; chip: string; iconColor: string }> = {
  info: { icon: Info, ring: "border-brand-border", chip: "bg-brand-surface-interactive", iconColor: "text-brand-text-secondary" },
  success: { icon: CheckCircle2, ring: "border-status-success/30", chip: "bg-status-success/10", iconColor: "text-status-success" },
  warning: { icon: AlertTriangle, ring: "border-status-warning/30", chip: "bg-status-warning/10", iconColor: "text-status-warning-strong" },
  critical: { icon: AlertTriangle, ring: "border-status-error/40", chip: "bg-status-error/10", iconColor: "text-status-error" },
}

interface NotificationToastsProps {
  toasts: NotificationToast[]
  onDismiss: (id: string) => void
}

/**
 * Fixed-position toast stack. Toasts auto-dismiss after a priority-dependent
 * delay, and critical ones stay longer. Clicking a toast navigates to the
 * action path when one is available; the X always dismisses.
 */
export default function NotificationToasts({ toasts, onDismiss }: NotificationToastsProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <AutoDismissToast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function AutoDismissToast({ toast, onDismiss }: { toast: NotificationToast; onDismiss: (id: string) => void }) {
  const navigate = useNavigate()
  const style = STYLES[toast.priority] ?? STYLES.info
  const Icon = style.icon

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS[toast.priority])
    return () => window.clearTimeout(timer)
  }, [toast.id, toast.priority, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border bg-brand-surface-elevated shadow-lg ${style.ring} ${toast.actionPath ? "cursor-pointer" : ""}`}
      role="status"
      aria-live="polite"
      onClick={() => {
        if (toast.actionPath) {
          onDismiss(toast.id)
          navigate(toast.actionPath)
        }
      }}
    >
      <div className="flex items-start gap-3 p-3.5">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.chip}`}>
          <Icon size={16} className={style.iconColor} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-brand-text-primary pr-5">{toast.title}</p>
          {toast.body && <p className="mt-0.5 text-[11px] text-brand-text-muted line-clamp-2">{toast.body}</p>}
          {toast.actionPath && (
            <span className="mt-1.5 inline-block text-[10px] font-semibold text-brand-gold">Open</span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(toast.id) }}
          className="absolute right-2 top-2 rounded-md p-1 text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-colors"
          aria-label="Dismiss notification"
        >
          <X size={12} />
        </button>
      </div>
      <div className={`h-0.5 ${toast.priority === "critical" ? "bg-status-error/60" : toast.priority === "warning" ? "bg-status-warning/60" : "bg-brand-gold/50"}`} />
    </motion.div>
  )
}
