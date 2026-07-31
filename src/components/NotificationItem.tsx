import { Building2, ScrollText, AlertTriangle, Settings } from "lucide-react"

interface Notification {
  id: string
  title: string
  preview: string
  time: string
  read: boolean
  type: 'system' | 'org' | 'election' | 'alert'
}

interface NotificationItemProps {
  notification: Notification
}

const TYPE_CONFIG = {
  system: { icon: Settings, bg: "bg-brand-surface-interactive text-brand-text-muted" },
  org: { icon: Building2, bg: "bg-blue-400/10 text-blue-400" },
  election: { icon: ScrollText, bg: "bg-status-success/10 text-status-success" },
  alert: { icon: AlertTriangle, bg: "bg-status-error/10 text-status-error" },
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system
  const Icon = config.icon

  return (
    <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-brand-surface-elevated/50 transition-colors cursor-pointer">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
        <Icon size={12} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-brand-text-primary">{notification.title}</p>
          {!notification.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />}
        </div>
        <p className="text-[10px] text-brand-text-muted mt-0.5 line-clamp-1">{notification.preview}</p>
        <p className="text-[9px] font-mono text-brand-text-muted/60 mt-0.5">{notification.time}</p>
      </div>
    </div>
  )
}
