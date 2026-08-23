import { useState, useEffect } from 'react'
import { Search, Shield, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import DashboardCard from '../../components/DashboardCard'
import EmptyState from '../../components/EmptyState'
import { electionService } from '../../../services/election-service'
import { type OrivisEvent, timeAgo } from './_shared'

const SEVERITY_STYLES: Record<string, string> = {
  info: 'bg-status-info/10 text-status-info border-status-info/20',
  warning: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  critical: 'bg-status-error/10 text-status-error border-status-error/20',
}

export function AuditTab({ event }: { event: OrivisEvent }) {
  const [auditSearch, setAuditSearch] = useState('')
  const [auditLogs, setAuditLogs] = useState<import('../../../types/election').ElectionAuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(true)
  const [auditPage, setAuditPage] = useState(1)
  const [auditTotal, setAuditTotal] = useState(0)

  useEffect(() => {
    setAuditLoading(true)
    electionService.getElectionAuditLogs(event.id, { page: auditPage, perPage: 15, search: auditSearch || undefined })
      .then((res) => { setAuditLogs(res.items); setAuditTotal(res.total) })
      .catch((err) => console.error('AuditTab.fetch:', err))
      .finally(() => setAuditLoading(false))
  }, [event.id, auditPage, auditSearch])

  const formatEventName = (evt: string) => {
    const parts = evt.split('.')
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/_/g, ' ')).join(' › ')
  }

  const getSeverity = (evt: string): 'info' | 'warning' | 'critical' => {
    if (evt.includes('cancelled') || evt.includes('ended') || evt.includes('archived')) return 'warning'
    if (evt.includes('started') || evt.includes('live') || evt.includes('published')) return 'info'
    return 'info'
  }

  return (
    <DashboardCard hover={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input name="search" value={auditSearch} onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1) }} placeholder="Search audit logs..." aria-label="Search audit logs"
            className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
        </div>
        <div className="text-[10px] text-brand-text-muted">
          {auditTotal} audit event{auditTotal !== 1 ? 's' : ''}
        </div>
      </div>

      {auditLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-brand-text-muted" />
        </div>
      ) : auditLogs.length === 0 ? (
        <EmptyState icon={Shield} title="No Audit Events" description="No audit events have been recorded for this election yet." />
      ) : (
        <>
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-divider">
                <th className="px-3 py-3 text-[9px] text-brand-text-muted font-bold">Event</th>
                <th className="px-3 py-3 text-[9px] text-brand-text-muted font-bold">Actor</th>
                <th className="px-3 py-3 text-[9px] text-brand-text-muted font-bold">Details</th>
                <th className="px-3 py-3 text-[9px] text-brand-text-muted font-bold">IP</th>
                <th className="px-3 py-3 text-[9px] text-brand-text-muted font-bold">Timestamp</th>
                <th className="px-3 py-3 text-[9px] text-brand-text-muted font-bold">Severity</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => {
                const sev = getSeverity(log.event)
                return (
                  <tr key={log.id} className="border-b border-brand-divider last:border-0 hover:bg-brand-surface-interactive/30 transition-colors">
                    <td className="px-3 py-3 text-xs text-brand-text-primary font-medium">{formatEventName(log.event)}</td>
                    <td className="px-3 py-3 text-[10px] text-brand-text-muted">{log.user?.name ?? 'System'}</td>
                    <td className="px-3 py-3 text-[10px] text-brand-text-muted max-w-[200px] truncate">
                      {log.old_values?.lifecycle_state && log.new_values?.lifecycle_state
                        ? `${log.old_values.lifecycle_state} → ${log.new_values.lifecycle_state}`
                        : '—'}
                    </td>
                    <td className="px-3 py-3 text-[10px] text-brand-text-muted font-mono">{log.ip_address ?? '—'}</td>
                    <td className="px-3 py-3 text-[10px] text-brand-text-muted">{log.created_at ? timeAgo(log.created_at) : '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[sev]}`}>
                        {sev}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {auditTotal > 15 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                disabled={auditPage === 1}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive disabled:opacity-40"
              >
                <ChevronLeft size={12} />
              </button>
              <span className="text-[10px] text-brand-text-muted">Page {auditPage}</span>
              <button
                onClick={() => setAuditPage((p) => p + 1)}
                disabled={auditLogs.length < 15}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive disabled:opacity-40"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="lg:hidden divide-y divide-brand-divider">
          {auditLogs.map((log) => {
            const sev = getSeverity(log.event)
            const details = log.old_values?.lifecycle_state && log.new_values?.lifecycle_state
              ? `${log.old_values.lifecycle_state} → ${log.new_values.lifecycle_state}`
              : '—'
            return (
              <div key={log.id} className="px-3 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-text-primary font-medium">{formatEventName(log.event)}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[sev]}`}>
                    {sev}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[10px]">
                  <span className="text-brand-text-muted">Actor</span>
                  <span className="text-brand-text-primary text-right">{log.user?.name ?? 'System'}</span>
                  <span className="text-brand-text-muted">Details</span>
                  <span className="text-brand-text-primary text-right truncate">{details}</span>
                  <span className="text-brand-text-muted">IP</span>
                  <span className="text-brand-text-primary text-right font-mono">{log.ip_address ?? '—'}</span>
                  <span className="text-brand-text-muted">Timestamp</span>
                  <span className="text-brand-text-primary text-right">{log.created_at ? timeAgo(log.created_at) : '—'}</span>
                </div>
              </div>
            )
          })}
        </div>

        {auditTotal > 15 && (
          <div className="lg:hidden flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
              disabled={auditPage === 1}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive disabled:opacity-40"
            >
              <ChevronLeft size={12} />
            </button>
            <span className="text-[10px] text-brand-text-muted">Page {auditPage}</span>
            <button
              onClick={() => setAuditPage((p) => p + 1)}
              disabled={auditLogs.length < 15}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive disabled:opacity-40"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        )}
        </>
      )}
    </DashboardCard>
  )
}
