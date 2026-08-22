import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Eye, Shield, LogOut, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react'
import { usePlatformPermissions } from '../../contexts/PlatformPermissionsContext'

interface WorkspaceAccessOverlayProps {
  organizationName: string
  mode: 'view_only' | 'full_control'
  onExit: () => void
  exiting?: boolean
}

/**
 * Floating overlay displayed when a platform staff member is viewing
 * another workspace. Shows a compact indicator by default, expanding
 * on hover/focus to show full details and exit button.
 *
 * Uses fixed positioning with high z-index to stay above all content.
 * Mobile: touch-compatible via tap-to-toggle.
 */
export default function WorkspaceAccessOverlay({
  organizationName,
  mode,
  onExit,
  exiting = false,
}: WorkspaceAccessOverlayProps) {
  const [expanded, setExpanded] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const { staff } = usePlatformPermissions()
  const staffName = staff?.name ?? 'Administrator'
  const isAuditMode = mode === 'view_only'

  // Close on outside click
  useEffect(() => {
    if (!expanded) return
    const handleClick = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [expanded])

  // Close on Escape
  useEffect(() => {
    if (!expanded) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [expanded])

  const toggle = useCallback(() => setExpanded((prev) => !prev), [])

  return (
    <div
      ref={overlayRef}
      className="fixed bottom-6 right-6 z-[100] max-w-[calc(100vw-3rem)]"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-2xl border shadow-2xl overflow-hidden ${
              isAuditMode
                ? 'bg-brand-surface border-status-warning/30'
                : 'bg-brand-surface border-status-error/30'
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-4 py-3 border-b ${
                isAuditMode
                  ? 'border-status-warning/20 bg-status-warning/5'
                  : 'border-status-error/20 bg-status-error/5'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isAuditMode ? (
                  <Eye size={16} className="text-status-warning shrink-0" />
                ) : (
                  <Shield size={16} className="text-status-error shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-brand-text-primary truncate">
                    Workspace Access Active
                  </p>
                  <p className="text-[10px] text-brand-text-muted truncate">
                    {organizationName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 rounded-lg hover:bg-brand-surface-interactive transition-colors shrink-0 cursor-pointer"
                aria-label="Collapse overlay"
              >
                <ChevronDown size={14} className="text-brand-text-muted" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-3 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Mode</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      isAuditMode
                        ? 'bg-status-warning/20 text-status-warning'
                        : 'bg-status-error/20 text-status-error'
                    }`}
                  >
                    {isAuditMode ? 'Audit Mode' : 'Full Action Mode'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Staff</span>
                  <span className="text-[11px] font-semibold text-brand-text-primary">{staffName}</span>
                </div>
                {isAuditMode && (
                  <div className="flex items-center gap-1.5 text-[10px] text-status-warning/80 mt-1">
                    <AlertTriangle size={10} />
                    <span>Read only. No changes are possible.</span>
                  </div>
                )}
                {!isAuditMode && (
                  <div className="flex items-center gap-1.5 text-[10px] text-status-error/80 mt-1">
                    <AlertTriangle size={10} />
                    <span>All actions are fully audited.</span>
                  </div>
                )}
              </div>

              <button
                onClick={onExit}
                disabled={exiting}
                className={`w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                  isAuditMode
                    ? 'bg-status-warning/10 border border-status-warning/25 text-status-warning hover:bg-status-warning/20'
                    : 'bg-status-error/10 border border-status-error/25 text-status-error hover:bg-status-error/20'
                }`}
              >
                <LogOut size={12} />
                {exiting ? 'Exiting...' : 'Exit Workspace'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="compact"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onClick={toggle}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-full border shadow-lg cursor-pointer transition-all hover:shadow-xl ${
              isAuditMode
                ? 'bg-status-warning/10 border-status-warning/30 text-status-warning hover:bg-status-warning/15'
                : 'bg-status-error/10 border-status-error/30 text-status-error hover:bg-status-error/15'
            }`}
            aria-label={`Workspace access active for ${organizationName}. Click to expand.`}
            title={`${organizationName} — ${isAuditMode ? 'Audit Mode' : 'Full Action Mode'}`}
          >
            {isAuditMode ? <Eye size={14} /> : <Shield size={14} />}
            <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap hidden sm:inline">
              {isAuditMode ? 'Audit' : 'Full Action'}
            </span>
            <span className="text-[9px] font-mono text-brand-text-muted hidden md:inline truncate max-w-[100px]">
              {organizationName}
            </span>
            <ChevronUp size={12} className="text-brand-text-muted" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
