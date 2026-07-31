import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  FileText, Download, BarChart3, PieChart, Users, Clock,
  CheckCircle, Trash2, Filter, MoreHorizontal,
  FileType, Image, Code, Shield
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import WidgetPanel from '../components/WidgetPanel'
import EmptyState from '../components/EmptyState'
import SeoHead from "../../components/SeoHead"
import type { ReportType } from '../types'

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

const REPORT_TYPE_ICONS: Record<ReportType, typeof FileText> = {
  executive_summary: BarChart3,
  participation: PieChart,
  turnout: Users,
  candidate_performance: Users,
  results_summary: CheckCircle,
  audit: Shield,
  timeline: Clock,
  event_summary: FileText,
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

const MOCK_REPORTS: Report[] = [
  { id: 'rpt-1', title: 'Executive Summary — Q3 2026', reportType: 'executive_summary', status: 'generated', generatedAt: '2026-07-28T14:30:00Z', size: '2.4 MB', format: 'pdf', downloads: 12 },
  { id: 'rpt-2', title: 'Participation Report — Students Union Election', reportType: 'participation', status: 'generated', generatedAt: '2026-07-27T09:15:00Z', size: '1.1 MB', format: 'csv', downloads: 8 },
  { id: 'rpt-3', title: 'Turnout Analysis — Faculty Senate Vote', reportType: 'turnout', status: 'processing', generatedAt: '2026-07-28T16:00:00Z', size: '—', format: 'pdf', downloads: 0 },
  { id: 'rpt-4', title: 'Candidate Performance — AGM 2026', reportType: 'candidate_performance', status: 'generated', generatedAt: '2026-07-26T11:45:00Z', size: '3.7 MB', format: 'json', downloads: 5 },
  { id: 'rpt-5', title: 'Results Summary — Budget Approval Poll', reportType: 'results_summary', status: 'generated', generatedAt: '2026-07-25T13:20:00Z', size: '890 KB', format: 'csv', downloads: 15 },
  { id: 'rpt-6', title: 'Audit Report — Q2 2026 Elections', reportType: 'audit', status: 'generated', generatedAt: '2026-07-24T10:00:00Z', size: '5.2 MB', format: 'pdf', downloads: 3 },
  { id: 'rpt-7', title: 'Timeline Report — Presidential Election', reportType: 'timeline', status: 'queued', generatedAt: '2026-07-28T17:00:00Z', size: '—', format: 'json', downloads: 0 },
  { id: 'rpt-8', title: 'Event Summary — Mentorship Survey', reportType: 'event_summary', status: 'failed', generatedAt: '2026-07-23T08:30:00Z', size: '—', format: 'csv', downloads: 0 },
]

export default function OrgReports() {
  const { branding } = useOrgBranding()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all')
  const [generating, setGenerating] = useState(false)

  const filtered = useMemo(() => {
    let result = [...MOCK_REPORTS]
    if (typeFilter !== 'all') result = result.filter((r) => r.reportType === typeFilter)
    if (statusFilter !== 'all') result = result.filter((r) => r.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) => r.title.toLowerCase().includes(q))
    }
    return result
  }, [typeFilter, statusFilter, search])

  const stats = useMemo(() => ({
    total: MOCK_REPORTS.length,
    generated: MOCK_REPORTS.filter((r) => r.status === 'generated').length,
    processing: MOCK_REPORTS.filter((r) => r.status === 'processing').length,
    failed: MOCK_REPORTS.filter((r) => r.status === 'failed').length,
  }), [])

  const handleExport = (format: ExportFormat) => {
    setGenerating(true)
    setTimeout(() => setGenerating(false), 1500)
  }

  return (
    <>
      <SeoHead meta={{ title: 'Reports — Organization | ORIVIS', noindex: true }} />
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-display font-black uppercase tracking-tight text-brand-text-primary">
              Reports Center
            </h1>
            <p className="text-[10px] font-mono text-brand-text-muted mt-0.5">
              Generate, export, and manage organization reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => handleExport('csv')}
              disabled={generating}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all bg-brand-surface border-brand-border text-brand-text-primary hover:border-brand-text-muted/30 disabled:opacity-50"
            >
              <FileType size={14} /> CSV Export
            </motion.button>
            <motion.button
              onClick={() => handleExport('pdf')}
              disabled={generating}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all bg-brand-surface border-brand-border text-brand-text-primary hover:border-brand-text-muted/30 disabled:opacity-50"
            >
              <Image size={14} /> PDF Export
            </motion.button>
            <motion.button
              onClick={() => handleExport('json')}
              disabled={generating}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-all"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <Code size={14} /> JSON Export
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard>
            <p className="text-[10px] font-mono text-brand-text-muted uppercase tracking-wider">Total Reports</p>
            <p className="text-2xl font-bold font-mono text-brand-text-primary mt-1">{stats.total}</p>
          </DashboardCard>
          <DashboardCard>
            <p className="text-[10px] font-mono text-status-success uppercase tracking-wider">Generated</p>
            <p className="text-2xl font-bold font-mono text-brand-text-primary mt-1">{stats.generated}</p>
          </DashboardCard>
          <DashboardCard>
            <p className="text-[10px] font-mono text-status-warning uppercase tracking-wider">Processing</p>
            <p className="text-2xl font-bold font-mono text-brand-text-primary mt-1">{stats.processing}</p>
          </DashboardCard>
          <DashboardCard>
            <p className="text-[10px] font-mono text-status-error uppercase tracking-wider">Failed</p>
            <p className="text-2xl font-bold font-mono text-brand-text-primary mt-1">{stats.failed}</p>
          </DashboardCard>
        </div>

        <WidgetPanel title="Report Generation" subtitle="Create new reports from existing election data">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['participation', 'turnout', 'candidate_performance', 'results_summary', 'audit', 'timeline', 'event_summary'] as ReportType[]).map((type) => {
              const Icon = REPORT_TYPE_ICONS[type]
              return (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border border-brand-border bg-brand-surface-elevated/30 hover:bg-brand-surface-interactive/30 transition-all text-center"
                  onClick={() => handleExport('pdf')}
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-surface flex items-center justify-center" style={{ color: branding.primaryColor }}>
                    <Icon size={20} />
                  </div>
                  <span className="text-[11px] font-semibold text-brand-text-primary leading-tight">{REPORT_TYPE_LABELS[type]}</span>
                  <span className="text-[9px] font-mono text-brand-text-muted">Click to generate</span>
                </motion.button>
              )
            })}
          </div>
        </WidgetPanel>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="w-full h-10 pl-9 pr-4 rounded-xl text-xs bg-brand-surface border border-brand-border text-brand-text-primary placeholder:text-brand-text-disabled focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': branding.primaryColor } as React.CSSProperties}
            />
          </div>
          <div className="flex items-center gap-2">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ReportType | 'all')} className="h-10 px-3 rounded-xl text-xs bg-brand-surface border border-brand-border text-brand-text-primary focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': branding.primaryColor } as React.CSSProperties}>
              <option value="all">All Types</option>
              {Object.entries(REPORT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')} className="h-10 px-3 rounded-xl text-xs bg-brand-surface border border-brand-border text-brand-text-primary focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': branding.primaryColor } as React.CSSProperties}>
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
                <p className="text-[10px] font-mono text-brand-text-muted mt-0.5">
                  {REPORT_TYPE_LABELS[report.reportType]} &middot; {report.format.toUpperCase()} &middot; {report.size}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-brand-text-muted">
                <Clock size={10} /> {report.downloads} dl
              </div>
              <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${STATUS_VARIANTS[report.status]}`}>
                {STATUS_LABELS[report.status]}
              </span>
              <span className="text-[10px] font-mono text-brand-text-muted hidden md:block">
                {new Date(report.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-1">
                {report.status === 'generated' && (
                  <button className="p-2 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer" title="Download">
                    <Download size={14} />
                  </button>
                )}
                {report.status === 'generated' && (
                  <button className="p-2 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer" title="Delete">
                    <Trash2 size={14} />
                  </button>
                )}
                <button className="p-2 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer" title="More actions">
                  <MoreHorizontal size={14} />
                </button>
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