import { Plus, Upload, Shield, AlertTriangle, CheckCircle } from "lucide-react"

interface ActivityEvent {
  id: string
  event: string
  time: string
  type: 'create' | 'publish' | 'import' | 'system' | 'alert'
}

interface ActivityItemProps {
  event: ActivityEvent
  index: number
}

const TYPE_CONFIG = {
  create: { icon: Plus, bg: "bg-status-success/10 text-status-success", hoverBg: "hover:bg-status-success/5" },
  publish: { icon: CheckCircle, bg: "bg-status-info/10 text-status-info", hoverBg: "hover:bg-status-info/5" },
  import: { icon: Upload, bg: "bg-status-warning/10 text-status-warning", hoverBg: "hover:bg-status-warning/5" },
  system: { icon: Shield, bg: "bg-brand-surface-interactive text-brand-text-muted", hoverBg: "hover:bg-brand-surface-interactive/50" },
  alert: { icon: AlertTriangle, bg: "bg-status-error/10 text-status-error", hoverBg: "hover:bg-status-danger/5" },
}

export default function ActivityItem({ event, index: _index }: ActivityItemProps) {
  const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.system
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${config.hoverBg}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
        <Icon size={12} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-brand-text-primary">{event.event}</p>
      </div>
      <span className="text-[9px] font-mono text-brand-text-muted shrink-0">{event.time}</span>
    </div>
  )
}
