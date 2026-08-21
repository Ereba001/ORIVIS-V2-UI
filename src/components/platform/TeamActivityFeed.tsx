import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Shield, UserPlus, UserMinus, Key, Settings, Eye, Activity,
  RefreshCw, ArrowRight, Clock,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { platformService } from '../../services/platform-service'
import type { PlatformAuditLog } from '../../types/platform'
import EmptyState from '../../org/components/EmptyState'

// ---------------------------------------------------------------------------
// Staff-relevant audit event categories
// ---------------------------------------------------------------------------

const STAFF_EVENT_PATTERNS = [
  'staff',
  'role',
  'permission',
  'workspace',
  'impersonat',
  'suspend',
  'terminate',
  'reactivat',
  'assign',
  'password_reset',
  'security',
  'login',
  'logout',
  'access',
]

const EVENT_ICONS: Record<string, typeof Shield> = {
  staff_joined: UserPlus,
  role_assigned: Key,
  role_changed: Key,
  permission_added: Settings,
  permission_removed: Settings,
  staff_suspended: UserMinus,
  staff_terminated: UserMinus,
  staff_reactivated: UserPlus,
  workspace_accessed: Eye,
  password_reset: Shield,
  login: Shield,
  logout: Shield,
  default: Activity,
}

function getEventIcon(event: string): typeof Shield {
  const lower = event.toLowerCase()
  for (const [key, icon] of Object.entries(EVENT_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return EVENT_ICONS.default
}

function getEventColor(event: string): string {
  const lower = event.toLowerCase()
  if (lower.includes('termin') || lower.includes('suspend') || lower.includes('remove')) return 'text-status-error bg-status-error/10'
  if (lower.includes('create') || lower.includes('join') || lower.includes('reactiv')) return 'text-status-success bg-status-success/10'
  if (lower.includes('permission') || lower.includes('role') || lower.includes('assign')) return 'text-brand-gold bg-brand-gold/10'
  if (lower.includes('workspace') || lower.includes('access') || lower.includes('impersonat')) return 'text-status-info bg-status-info/10'
  if (lower.includes('security') || lower.includes('password')) return 'text-status-warning bg-status-warning/10'
  return 'text-brand-text-muted bg-brand-surface-elevated'
}

function isStaffRelevant(event: string): boolean {
  const lower = event.toLowerCase()
  return STAFF_EVENT_PATTERNS.some((p) => lower.includes(p))
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const now = Date.now()
  const diff = now - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TeamActivityFeedProps {
  maxItems?: number
  permissionGated?: boolean
  showHeader?: boolean
}

export default function TeamActivityFeed({
  maxItems = 8,
  permissionGated = true,
  showHeader = true,
}: TeamActivityFeedProps) {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<PlatformAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    platformService
      .getAuditLogs({ perPage: 50 })
      .then((res) => {
        setLogs(res.items.filter((l) => isStaffRelevant(l.action)))
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load activity')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const items = logs.slice(0, maxItems)

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg animate-pulse">
            <div className="w-7 h-7 rounded-lg bg-brand-surface-elevated" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-3/4 bg-brand-surface-elevated rounded" />
              <div className="h-2 w-1/3 bg-brand-surface-elevated rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-status-error mb-2">{error}</p>
        <button onClick={load} className="text-[10px] font-mono text-brand-gold hover:underline cursor-pointer">
          <RefreshCw size={10} className="inline mr-1" />Retry
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No Staff Activity"
        description="Staff actions will appear here as they occur."
      />
    )
  }

  return (
    <div>
      {showHeader && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-brand-gold" />
            <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Team Activity</h3>
          </div>
          <button
            onClick={() => navigate('/platform/audit')}
            className="flex items-center gap-1 text-[10px] font-medium text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
          >
            View All <ArrowRight size={10} />
          </button>
        </div>
      )}

      <div className="space-y-1">
        <AnimatePresence initial={false}>
          {items.map((log, i) => {
            const Icon = getEventIcon(log.action)
            const colorClass = getEventColor(log.action)
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-surface-interactive/50 transition-colors"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
                  <Icon size={12} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-brand-text-primary leading-snug truncate">
                    {log.action}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {log.user && (
                      <span className="text-[9px] text-brand-text-muted flex items-center gap-1">
                        <UserMinus size={8} className="hidden" />
                        {log.user}
                      </span>
                    )}
                    <span className="text-[9px] text-brand-text-muted flex items-center gap-1">
                      <Clock size={8} />
                      {formatRelativeTime(log.timestamp)}
                    </span>
                  </div>
                </div>
                <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${colorClass}`}>
                  {log.severity}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {permissionGated && (
        <p className="text-[9px] font-mono text-brand-text-disabled text-center mt-3">
          Showing staff-relevant events ({items.length} of {logs.length})
        </p>
      )}
    </div>
  )
}
