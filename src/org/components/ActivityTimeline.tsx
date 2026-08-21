import { motion } from 'motion/react'
import { Plus, Edit3, CheckCircle, AlertTriangle, Settings } from 'lucide-react'
import type { ActivityEvent } from '../types'

const TYPE_ICONS = {
  create: Plus,
  update: Edit3,
  complete: CheckCircle,
  alert: AlertTriangle,
  system: Settings,
}

const TYPE_COLORS = {
  create: 'bg-status-success/10 text-status-success-strong',
  update: 'bg-status-info/10 text-status-info-strong',
  complete: 'bg-status-success/10 text-status-success-strong',
  alert: 'bg-status-warning/10 text-status-warning-strong',
  system: 'bg-brand-surface-interactive text-brand-text-muted',
}

interface ActivityTimelineProps {
  events: ActivityEvent[]
}

export default function ActivityTimeline({ events }: ActivityTimelineProps) {
  if (events.length === 0) return null

  return (
    <div className="space-y-1">
      {events.map((event, index) => {
        const Icon = TYPE_ICONS[event.type]
        const color = TYPE_COLORS[event.type]

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
            className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-brand-surface-interactive transition-colors"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
              <Icon size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-brand-text-primary">{event.action}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] text-brand-text-muted">{event.time}</p>
                {event.user && (
                  <>
                    <span className="text-brand-text-disabled">·</span>
                    <p className="text-xs text-brand-text-secondary">{event.user}</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
