import { motion } from 'motion/react'
import { Bell, Users, Shield, AlertTriangle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { OrgNotification } from '../types'

const TYPE_ICONS: Record<OrgNotification['type'], LucideIcon> = {
  event: Bell,
  team: Users,
  system: Shield,
  alert: AlertTriangle,
}

const TYPE_COLORS: Record<OrgNotification['type'], string> = {
  event: 'text-status-success',
  team: 'text-status-info',
  system: 'text-brand-text-muted',
  alert: 'text-status-warning',
}

interface NotificationCardProps {
  notification: OrgNotification
  index: number
}

export default function NotificationCard({ notification, index }: NotificationCardProps) {
  const Icon = TYPE_ICONS[notification.type]
  const color = TYPE_COLORS[notification.type]

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className={`flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-brand-surface-interactive ${notification.read ? '' : 'bg-brand-surface-elevated'}`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-surface-interactive text-brand-text-muted">
        <Icon size={14} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium truncate ${notification.read ? 'text-brand-text-secondary' : 'text-brand-text-primary'}`}>
            {notification.title}
          </p>
          {!notification.read && <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--org-primary)]" style={{ backgroundColor: 'var(--org-primary)' }} />}
        </div>
        <p className="text-xs text-brand-text-muted mt-0.5 line-clamp-1">{notification.preview}</p>
        <p className="text-[11px] text-brand-text-disabled mt-1">{notification.time}</p>
      </div>
    </motion.div>
  )
}
