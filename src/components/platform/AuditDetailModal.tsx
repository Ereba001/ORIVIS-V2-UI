import { motion, AnimatePresence } from "motion/react"
import { X, Shield, Building2, User, Vote, Activity, Eye, Copy, Check } from "lucide-react"
import { useState } from "react"
import type { PlatformAuditLog } from "../../types/platform"

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  Organization: Building2, Election: Vote, Voter: User, User: User, System: Shield,
  org: Building2, election: Vote, auth: Shield, permissions: Shield, billing: Activity,
  system: Shield, Governance: Eye,
}

const SEVERITY_STYLES: Record<string, string> = {
  Info: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  Warning: "bg-status-warning/10 text-status-warning border-status-warning/20",
  Critical: "bg-status-error/10 text-status-error border-status-error/20",
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit",
  })
}

function JsonBlock({ label, data }: { label: string; data: Record<string, unknown> | null | undefined }) {
  const [copied, setCopied] = useState(false)
  if (!data || Object.keys(data).length === 0) return null

  const formatted = JSON.stringify(data, null, 2)

  const handleCopy = () => {
    navigator.clipboard.writeText(formatted)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">{label}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[9px] text-brand-text-muted hover:text-brand-gold transition-colors cursor-pointer"
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="bg-brand-bg-secondary border border-brand-border rounded-xl p-3 text-[10px] font-mono text-brand-text-primary overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
        {formatted}
      </pre>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted shrink-0">{label}</span>
      <span className={`text-xs text-brand-text-primary text-right ${mono ? "font-mono" : ""}`}>
        {value ?? "—"}
      </span>
    </div>
  )
}

interface AuditDetailModalProps {
  open: boolean
  log: PlatformAuditLog | null
  onClose: () => void
}

export default function AuditDetailModal({ open, log, onClose }: AuditDetailModalProps) {
  if (!log) return null

  const CatIcon = CATEGORY_ICONS[log.category] || Shield
  const modelType = log.auditableType ? log.auditableType.split("\\").pop() ?? log.auditableType : null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="glass-strong rounded-2xl shadow-brand-lg flex flex-col w-full max-w-2xl"
            style={{ maxHeight: "min(90vh, 720px)" }}
          >
            {/* Header — fixed, never scrolls */}
            <div className="flex items-start justify-between gap-3 p-6 pb-4 border-b border-brand-border shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  log.category === "Governance" ? "bg-brand-gold/10 text-brand-gold" : "bg-brand-surface-elevated text-brand-text-muted"
                }`}>
                  <CatIcon size={18} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-brand-text-primary leading-tight break-words">{log.action}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[log.severity]}`}>
                      {log.severity}
                    </span>
                    <span className="text-[9px] font-mono text-brand-text-muted">{log.category}</span>
                    {modelType && (
                      <span className="text-[9px] font-mono text-brand-text-disabled">
                        {modelType}#{log.auditableId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-5 min-h-0">
              {/* Summary section */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">Summary</h3>
                <div className="bg-brand-surface-elevated/50 border border-brand-border rounded-xl p-4 space-y-0.5">
                  <DetailRow label="Actor" value={log.user} />
                  <DetailRow label="Time" value={formatTimestamp(log.timestamp)} />
                  <DetailRow label="Event" value={log.action} mono />
                  <DetailRow label="IP Address" value={log.ipAddress} mono />
                </div>
              </div>

              {/* Metadata section */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">Metadata</h3>
                <div className="bg-brand-surface-elevated/50 border border-brand-border rounded-xl p-4 space-y-0.5">
                  <DetailRow label="Log ID" value={log.id} mono />
                  <DetailRow label="Organization ID" value={log.organizationId != null ? String(log.organizationId) : null} mono />
                  <DetailRow label="User ID" value={log.userId != null ? String(log.userId) : null} mono />
                  <DetailRow label="Auditable Type" value={log.auditableType} mono />
                  <DetailRow label="Auditable ID" value={log.auditableId != null ? String(log.auditableId) : null} mono />
                  {log.userAgent && (
                    <DetailRow label="User Agent" value={log.userAgent} />
                  )}
                </div>
              </div>

              {/* Before / After diff */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">Change Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <JsonBlock label="Before (old values)" data={log.oldValues} />
                  <JsonBlock label="After (new values)" data={log.newValues} />
                </div>
              </div>
            </div>

            {/* Footer — fixed, never scrolls */}
            <div className="flex items-center justify-end gap-2 p-6 pt-4 border-t border-brand-border shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary bg-brand-surface-interactive rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
