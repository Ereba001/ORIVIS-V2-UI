import { motion } from 'motion/react'
import { Eye, Shield, LogOut, AlertTriangle } from 'lucide-react'
import { usePlatformPermissions } from '../../contexts/PlatformPermissionsContext'

interface WorkspaceImpersonationBannerProps {
  organizationName: string
  mode: 'view_only' | 'full_control'
  onExit: () => void
  exiting?: boolean
}

/**
 * Highly visible banner displayed when a platform staff member is viewing
 * another workspace. Shows the target workspace name, mode, and an Exit button.
 */
export default function WorkspaceImpersonationBanner({ organizationName, mode, onExit, exiting }: WorkspaceImpersonationBannerProps) {
  const { staff } = usePlatformPermissions()
  const staffName = staff?.name ?? 'Administrator'
  const isAuditMode = mode === 'view_only'

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-semibold ${
          isAuditMode
            ? 'bg-status-warning/10 border-b border-status-warning/30 text-status-warning'
            : 'bg-status-error/10 border-b border-status-error/30 text-status-error'
        }`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {isAuditMode ? <Eye size={14} className="shrink-0" /> : <Shield size={14} className="shrink-0" />}
          <span className="truncate">
            Viewing as <strong className="font-bold">{organizationName}</strong> — {staffName}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 ${
            isAuditMode
              ? 'bg-status-warning/20 text-status-warning'
              : 'bg-status-error/20 text-status-error'
          }`}>
            {isAuditMode ? 'Audit Mode' : 'Full Action Mode'}
          </span>
          {isAuditMode && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-normal opacity-70">
              <AlertTriangle size={10} />
              Read only
            </span>
          )}
        </div>
        <button
          onClick={onExit}
          disabled={exiting}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${
            isAuditMode
              ? 'bg-status-warning/20 text-status-warning hover:bg-status-warning/30'
              : 'bg-status-error/20 text-status-error hover:bg-status-error/30'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <LogOut size={11} />
          {exiting ? 'Exiting...' : 'Exit Workspace'}
        </button>
      </div>
    </motion.div>
  )
}
