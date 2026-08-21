import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

interface Props {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  onClose: () => void
  autoDismiss?: boolean
  duration?: number
}

const TOAST_STYLES: Record<string, { bg: string; border: string; text: string; Icon: typeof CheckCircle2 }> = {
  success: {
    bg: 'bg-status-success/10',
    border: 'border-status-success/20',
    text: 'text-status-success',
    Icon: CheckCircle2,
  },
  error: {
    bg: 'bg-status-error/10',
    border: 'border-status-error/20',
    text: 'text-status-error',
    Icon: AlertTriangle,
  },
  warning: {
    bg: 'bg-status-warning/10',
    border: 'border-status-warning/20',
    text: 'text-status-warning',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    text: 'text-blue-400',
    Icon: Info,
  },
}

export default function Toast({
  message,
  type = 'success',
  onClose,
  autoDismiss = true,
  duration = 5000,
}: Props) {
  useEffect(() => {
    if (!autoDismiss) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [autoDismiss, duration, onClose])

  const { bg, border, text, Icon } = TOAST_STYLES[type] || TOAST_STYLES.success

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-4 right-4 z-50 flex items-center gap-2 ${bg} border ${border} ${text} rounded-xl px-4 py-3 text-xs font-semibold shadow-lg`}
      >
        <Icon size={14} />
        <span className="flex-1">{message}</span>
        <button onClick={onClose} className="p-0.5 rounded hover:opacity-70 transition-opacity cursor-pointer">
          <X size={12} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
