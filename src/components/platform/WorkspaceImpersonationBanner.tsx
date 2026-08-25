import { motion } from 'motion/react'
import { Eye, Shield, LogOut, AlertTriangle, Minimize2, Maximize2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useState } from 'react'

interface WorkspaceImpersonationBannerProps {
  organizationName: string
  mode: 'view_only' | 'full_control'
  onExit: () => void
  exiting?: boolean
}

/**
 * Floating overlay displayed when a platform staff member is viewing another workspace.
 * Fixed to bottom-right corner with minimize/maximize toggle.
 */
export default function WorkspaceImpersonationBanner({ organizationName, mode, onExit, exiting }: WorkspaceImpersonationBannerProps) {
  const { user } = useAuth()
  const staffName = user?.displayName ?? 'Administrator'
  const isAuditMode = mode === 'view_only'
  const [minimized, setMinimized] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-4 right-4 z-[150] pointer-events-auto"
      style={{ position: 'fixed' }}
    >
      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold shadow-xl border transition-all hover:scale-105 ${
            isAuditMode
              ? 'bg-status-warning/20 border-status-warning/30 text-status-warning'
              : 'bg-status-error/20 border-status-error/30 text-status-error'
          }`}
          aria-label="Expand workspace control"
        >
          <Shield size={16} />
          <span className="hidden sm:inline">{organizationName}</span>
          <Maximize2 size={12} />
        </button>
      ) : (
        <motion.div
          layout
          className={`w-80 rounded-2xl shadow-2xl border overflow-hidden ${
            isAuditMode
              ? 'bg-brand-bg border-status-warning/30'
              : 'bg-brand-bg border-status-error/30'
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between gap-2 px-4 py-3 ${
              isAuditMode
                ? 'bg-status-warning/10 border-b border-status-warning/20'
                : 'bg-status-error/10 border-b border-status-error/20'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {isAuditMode ? (
                <Eye size={14} className="text-status-warning shrink-0" />
              ) : (
                <Shield size={14} className="text-status-error shrink-0" />
              )}
              <span className="text-xs font-bold text-brand-text-primary truncate">
                Workspace Mode
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setMinimized(true)}
                className="p-1.5 rounded-lg hover:bg-brand-surface-interactive/30 transition-all"
                aria-label="Minimize overlay"
              >
                <Minimize2 size={12} className="text-brand-text-muted" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-brand-text-muted font-semibold uppercase tracking-wider">Workspace</span>
                <span className="text-xs font-bold text-brand-text-primary">{organizationName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-brand-text-muted font-semibold uppercase tracking-wider">Staff</span>
                <span className="text-xs font-semibold text-brand-text-primary">{staffName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-brand-text-muted font-semibold uppercase tracking-wider">Mode</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  isAuditMode
                    ? 'bg-status-warning/20 text-status-warning'
                    : 'bg-status-error/20 text-status-error'
                }`}>
                  {isAuditMode ? 'Audit Mode' : 'Full Action Mode'}
                </span>
              </div>
              {isAuditMode && (
                <div className="flex items-center gap-1.5 text-[10px] text-status-warning/80 font-medium">
                  <AlertTriangle size={10} />
                  Read only — no changes can be made
                </div>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={onExit}
              disabled={exiting}
              className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isAuditMode
                  ? 'bg-status-warning/20 text-status-warning hover:bg-status-warning/30'
                  : 'bg-status-error/20 text-status-error hover:bg-status-error/30'
              }`}
            >
              <LogOut size={14} />
              {exiting ? 'Exiting...' : 'Exit Workspace'}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
