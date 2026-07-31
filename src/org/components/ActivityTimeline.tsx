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
  create: 'text-status-success',
  update: 'text-event-upcoming',
  complete: 'text-status-info',
  alert: 'text-status-warning',
  system: 'text-brand-text-muted',
}

interface ActivityTimelineProps {
  events: ActivityEvent[]
}

export default function ActivityTimeline({ events }: ActivityTimelineProps) {
  if (events.length === 0) return null

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const Icon = TYPE_ICONS[event.type]
        const color = TYPE_COLORS[event.type]
        const isLast = index === events.length - 1

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
            className="flex gap-4 relative"
          >
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full bg-brand-surface-elevated flex items-center justify-center ${color}`}>
                <Icon size={12} />
              </div>
              {!isLast && <div className="w-px flex-1 bg-brand-divider mt-1" />}
            </div>
            <div className={`pb-5 ${isLast ? '' : ''}`}>
              <p className="text-xs text-brand-text-primary font-medium">{event.action}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] font-mono text-brand-text-disabled">{event.time}</p>
                {event.user && (
                  <>
                    <span className="text-brand-text-disabled">·</span>
                    <p className="text-[10px] font-mono text-brand-text-disabled">{event.user}</p>
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
