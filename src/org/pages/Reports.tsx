import { useState, useMemo, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  FileText, Download, BarChart3, Clock,
  MoreHorizontal, Eye, Trash2,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'
import SeoHead from "../../components/SeoHead"
import type { ReportType } from '../types'
import { orgService } from '../../services/org-service'
import { useApiResource } from '../../hooks/useApiResource'

type ReportStatus = 'generated' | 'processing' | 'queued' | 'failed'
type ExportFormat = 'csv' | 'pdf' | 'json'

interface Report {
  id: string
  title: string
  reportType: ReportType
  status: ReportStatus
  generatedAt: string
  size: string
  format: ExportFormat
  eventId?: string
  downloads: number
}

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  executive_summary: 'Executive Summary',
  participation: 'Participation Report',
  turnout: 'Turnout Report',
  candidate_performance: 'Candidate Performance',
  results_summary: 'Results Summary',
  audit: 'Audit Report',
  timeline: 'Timeline Report',
  event_summary: 'Event Summary',
}

const STATUS_VARIANTS: Record<ReportStatus, string> = {
  generated: 'text-status-success',
  processing: 'text-status-warning',
  queued: 'text-brand-text-muted',
  failed: 'text-status-error',
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  generated: 'Generated',
  processing: 'Processing',
  queued: 'Queued',
  failed: 'Failed',
}

const REPORT_KEY_TO_TYPE: Record<string, ReportType> = {
  elections: 'executive_summary',
  voters: 'participation',
  candidates: 'candidate_performance',
  audit: 'audit',
}

export default function OrgReports() {
  const { branding } = useOrgBranding()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all')
  const [generating, setGenerating] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null)
    }
    if (menuOpenId) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenId])

  const { data, loading, error, reload } = useApiResource(() => orgService.getReports())

  const MOCK_REPORTS: Report[] = (data?.reports ?? []).map((r) => ({
    id: r.key,
    title: r.label,
    reportType: REPORT_KEY_TO_TYPE[r.key] ?? 'event_summary',
    status: 'generated',
    generatedAt: new Date().toISOString(),
    size: '—',
    format: 'pdf',
    downloads: 0,
  }))

  const filtered = useMemo(() => {
    let result = [...MOCK_REPORTS]
    if (typeFilter !== 'all') result = result.filter((r) => r.reportType === typeFilter)
    if (statusFilter !== 'all') result = result.filter((r) => r.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) => r.title.toLowerCase().includes(q))
    }
    return result
  }, [typeFilter, statusFilter, search, MOCK_REPORTS])

  const stats = useMemo(() => ({
    total: MOCK_REPORTS.length,
    generated: MOCK_REPORTS.filter((r) => r.status === 'generated').length,
    processing: MOCK_REPORTS.filter((r) => r.status === 'processing').length,
    failed: MOCK_REPORTS.filter((r) => r.status === 'failed').length,
  }), [MOCK_REPORTS])

  if (loading) {
    return (
      <>
        <SeoHead meta={{ title: 'Reports — Organization | ORIVIS', noindex: true }} />
        <div className="space-y-6">
          <div className="animate-pulse h-10 w-64 bg-brand-surface-elevated rounded-2xl" />
          <SkeletonLoader rows={4} variant="card" />
        </div>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <SeoHead meta={{ title: 'Reports — Organization | ORIVIS', noindex: true }} />
        <EmptyState
          icon={BarChart3}
          title="Failed to load reports"
          description={error ?? 'Something went wrong loading reports.'}
          action={{ label: 'Retry', onClick: reload }}
        />
      </>
    )
  }

  const handleExport = async (reportKey: string) => {
    setGenerating(true)
    try {
      await orgService.downloadReport(reportKey)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed.'
      alert(msg)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <SeoHead meta={{ title: 'Reports — Organization | ORIVIS', noindex: true }} />
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-text-primary">
              Reports Center
            </h1>
            <p className="text-[10px] text-brand-text-muted mt-0.5">
              Generate, export, and manage organization reports
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard>
            <p className="text-[10px] text-brand-text-muted ">Total Reports</p>
            <p className="text-2xl font-bold text-brand-text-primary mt-1">{stats.total}</p>
          </DashboardCard>
          <DashboardCard>
            <p className="text-[10px] text-status-success ">Generated</p>
            <p className="text-2xl font-bold text-brand-text-primary mt-1">{stats.generated}</p>
          </DashboardCard>
          <DashboardCard>
            <p className="text-[10px] text-status-warning ">Processing</p>
            <p className="text-2xl font-bold text-brand-text-primary mt-1">{stats.processing}</p>
          </DashboardCard>
          <DashboardCard>
            <p className="text-[10px] text-status-error ">Failed</p>
            <p className="text-2xl font-bold text-brand-text-primary mt-1">{stats.failed}</p>
          </DashboardCard>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
            <input
              name="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search"
              placeholder="Search reports..."
              className="w-full h-10 pl-9 pr-4 rounded-xl text-xs bg-brand-surface border border-brand-border text-brand-text-primary placeholder:text-brand-text-disabled focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': branding.primaryColor } as React.CSSProperties}
            />
          </div>
          <div className="flex items-center gap-2">
            <select name="typeFilter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ReportType | 'all')} aria-label="Report type" className="h-10 px-3 rounded-xl text-xs bg-brand-surface border border-brand-border text-brand-text-primary focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': branding.primaryColor } as React.CSSProperties}>
              <option value="all">All Types</option>
              {Object.entries(REPORT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select name="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')} aria-label="Report status" className="h-10 px-3 rounded-xl text-xs bg-brand-surface border border-brand-border text-brand-text-primary focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': branding.primaryColor } as React.CSSProperties}>
              <option value="all">All Status</option>
              <option value="generated">Generated</option>
              <option value="processing">Processing</option>
              <option value="queued">Queued</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="flex items-center gap-4 p-4 rounded-xl border border-brand-border bg-brand-surface hover:bg-brand-surface-interactive/30 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-surface-elevated flex items-center justify-center shrink-0" style={{ color: branding.primaryColor }}>
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-brand-text-primary truncate">{report.title}</p>
                <p className="text-[10px] text-brand-text-muted mt-0.5">
                  {REPORT_TYPE_LABELS[report.reportType]} &middot; {report.format.toUpperCase()} &middot; {report.size}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[10px] text-brand-text-muted">
                <Clock size={10} /> {report.downloads} dl
              </div>
              <span className={`text-[9px] font-bold ${STATUS_VARIANTS[report.status]}`}>
                {STATUS_LABELS[report.status]}
              </span>
              <span className="text-[10px] text-brand-text-muted hidden md:block">
                {new Date(report.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-1">
                {report.status === 'generated' && (
                  <button
                    onClick={() => handleExport(report.id)}
                    disabled={generating}
                    className="p-2 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer disabled:opacity-50" title="Download CSV">
                    <Download size={14} />
                  </button>
                )}
                <div className="relative" ref={menuOpenId === report.id ? menuRef : undefined}>
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === report.id ? null : report.id)}
                    className="p-2 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer"
                    title="More actions"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {menuOpenId === report.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                      <div className="absolute right-0 top-8 z-20 w-40 bg-brand-surface border border-brand-border rounded-xl py-1 shadow-xl">
                        {report.status === 'generated' && (
                          <button
                            onClick={() => { handleExport(report.id); setMenuOpenId(null) }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-colors"
                          >
                            <Download size={12} />
                            Download CSV
                          </button>
                        )}
                        <button
                          onClick={() => { setMenuOpenId(null); orgService.downloadReport(report.id).catch((err) => { console.error('Reports.download:', err); alert('Download failed. Please try again.') }) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-colors"
                        >
                          <Eye size={12} />
                          View Details
                        </button>
                        <button
                          onClick={async () => { setMenuOpenId(null); try { await orgService.deleteReport(report.id); reload() } catch { /* silent */ } }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-status-error hover:bg-brand-surface-interactive transition-colors"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <EmptyState
              icon={BarChart3}
              title="No Reports Found"
              description={search || typeFilter !== 'all' || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'No reports have been generated yet.'}
            />
          )}
        </div>
      </div>
    </>
  )
}