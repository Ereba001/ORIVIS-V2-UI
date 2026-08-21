import { motion } from 'motion/react'
import { PlusCircle, Edit, CheckCircle, XCircle, Send, Flag, Shield, AlertTriangle, Trash2, Upload, RefreshCw, Activity, type LucideIcon } from 'lucide-react'
import type { TimelineActivity } from '../types'

const TYPE_ICONS: Record<string, LucideIcon> = {
  create: PlusCircle,
  update: Edit,
  approve: CheckCircle,
  reject: XCircle,
  publish: Send,
  complete: Flag,
  system: Shield,
  alert: AlertTriangle,
  delete: Trash2,
  import: Upload,
  status_change: RefreshCw,
  cancel: XCircle,
}

const TYPE_COLORS: Record<string, string> = {
  create: 'text-status-success',
  update: 'text-event-upcoming',
  approve: 'text-status-info',
  reject: 'text-status-error',
  publish: 'text-event-upcoming',
  complete: 'text-status-success',
  system: 'text-brand-text-muted',
  alert: 'text-status-warning',
  delete: 'text-status-error',
  import: 'text-status-info',
  status_change: 'text-event-upcoming',
  cancel: 'text-status-warning',
}

interface EventTimelineProps {
  activities: TimelineActivity[]
}

function getGroupLabel(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (target.getTime() === today.getTime()) return 'Today'
  if (target.getTime() === yesterday.getTime()) return 'Yesterday'
  return 'Earlier'
}

function formatTime(timestamp: string): string {
  const d = new Date(timestamp)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDate(timestamp: string): string {
  const d = new Date(timestamp)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function EventTimeline({ activities }: EventTimelineProps) {
  if (activities.length === 0) return null

  const grouped = activities.reduce<Record<string, TimelineActivity[]>>((acc, activity) => {
    const label = getGroupLabel(activity.timestamp)
    if (!acc[label]) acc[label] = []
    acc[label].push(activity)
    return acc
  }, {})

  const groupOrder: string[] = []
  if (grouped['Today']) groupOrder.push('Today')
  if (grouped['Yesterday']) groupOrder.push('Yesterday')
  if (grouped['Earlier']) groupOrder.push('Earlier')

  return (
    <div className="space-y-6">
      {groupOrder.map((groupLabel) => (
        <div key={groupLabel}>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-3">
            {groupLabel}
          </h3>
          <div className="space-y-0">
            {grouped[groupLabel].map((activity, index) => {
              const Icon = TYPE_ICONS[activity.type] ?? Activity
              const color = TYPE_COLORS[activity.type] ?? 'text-brand-text-muted'
              const isLast = index === grouped[groupLabel].length - 1

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.25 }}
                  className="flex gap-4 relative"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full bg-brand-surface-elevated flex items-center justify-center ${color}`}>
                      <Icon size={12} />
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-brand-divider mt-1" />}
                  </div>
                  <div className={`pb-5 ${isLast ? '' : ''}`}>
                    <p className="text-xs text-brand-text-primary font-medium">{activity.action}</p>
                    {activity.description && (
                      <p className="text-[10px] text-brand-text-muted mt-0.5">{activity.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono text-brand-text-disabled">{formatTime(activity.timestamp)}</span>
                      <span className="text-brand-text-disabled">·</span>
                      <span className="text-[9px] font-mono text-brand-text-disabled">{activity.user}</span>
                      {getGroupLabel(activity.timestamp) === 'Earlier' && (
                        <>
                          <span className="text-brand-text-disabled">·</span>
                          <span className="text-[9px] font-mono text-brand-text-disabled">{formatDate(activity.timestamp)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}