import { useState } from "react"
import { Search, Eye, AlertTriangle, RefreshCw, Building2, Clock, Filter } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import EmptyState from "../../components/platform/EmptyState"
import StatusPill from "../../components/platform/StatusPill"
import ResponsiveTable, { ResponsiveColumn } from "../../components/platform/ResponsiveTable"
import { platformService } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"
import type { WorkspaceSession } from "../../types/platform"

const MODE_LABELS: Record<string, string> = {
  view_only: "View Only",
  full_control: "Full Control",
}
const MODE_VARIANTS: Record<string, "success" | "danger" | "neutral"> = {
  view_only: "success",
  full_control: "danger",
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  })
}

function calcDuration(start: string, end: string | null): string {
  const startTime = new Date(start).getTime()
  const endTime = end ? new Date(end).getTime() : Date.now()
  const diffMs = endTime - startTime
  if (diffMs < 0) return "—"
  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${Math.floor(diffMs / 1000)}s`
}

export default function FounderAuditConsole() {
  const [search, setSearch] = useState("")
  const [modeFilter, setModeFilter] = useState<string>("all")
  const { data, loading, error, reload } = useApiResource(() =>
    platformService.getWorkspaceSessions({
      mode: modeFilter === "all" ? undefined : modeFilter,
      perPage: 50,
    })
  )

  const sessions = data?.items ?? []

  const filtered = sessions.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.organization?.toLowerCase().includes(q) ||
      s.reason?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    )
  })

  const columns: ResponsiveColumn<WorkspaceSession>[] = [
    {
      key: "organization",
      label: "Organization",
      render: (s) => (
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-brand-text-muted shrink-0" />
          <span className="text-xs font-medium text-brand-text-primary">{s.organization ?? "Unknown"}</span>
        </div>
      ),
    },
    {
      key: "mode",
      label: "Mode",
      render: (s) => (
        <StatusPill status={MODE_LABELS[s.mode] ?? s.mode} variant={MODE_VARIANTS[s.mode] ?? "neutral"} />
      ),
    },
    {
      key: "reason",
      label: "Reason",
      render: (s) => (
        <span className="text-xs text-brand-text-muted truncate max-w-[200px] block">
          {s.reason ?? "—"}
        </span>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (s) => (
        <span className="text-xs text-brand-text-muted">{s.category ?? "—"}</span>
      ),
    },
    {
      key: "riskLevel",
      label: "Risk",
      render: (s) => {
        const colors: Record<string, string> = {
          low: "text-status-success bg-status-success/10",
          medium: "text-status-warning bg-status-warning/10",
          high: "text-status-danger bg-status-danger/10",
          critical: "text-status-danger bg-status-danger/10",
        }
        const level = s.riskLevel ?? "low"
        return (
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${colors[level] ?? colors.low}`}>
            {level}
          </span>
        )
      },
    },
    {
      key: "duration",
      label: "Duration",
      render: (s) => (
        <div className="flex items-center gap-1 text-xs text-brand-text-muted">
          <Clock size={12} />
          {calcDuration(s.enteredAt ?? "", s.exitedAt)}
        </div>
      ),
    },
    {
      key: "enteredAt",
      label: "Started",
      render: (s) => (
        <span className="text-xs text-brand-text-muted">{formatTimestamp(s.enteredAt)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (s) => (
        <StatusPill
          status={s.status === "active" ? "Active" : "Closed"}
          variant={s.status === "active" ? "success" : "neutral"}
        />
      ),
    },
  ]

  return (
    <>
      <SeoHead meta={{ title: "Founder Audit Console | ORIVIS", noindex: true }} />
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Platform", href: "/platform" },
            { label: "Founder Audit Console" },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-brand-text-primary">
              Founder Audit Console
            </h1>
            <p className="text-xs text-brand-text-muted mt-1">
              Complete history of your workspace access sessions across all organizations.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-brand-surface-elevated border border-brand-border rounded-xl px-3 py-2 flex-1">
            <Search size={14} className="text-brand-text-muted shrink-0" />
            <input
              type="text"
              placeholder="Search by organization, reason, or session ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-brand-text-primary placeholder-brand-text-disabled flex-1 outline-none border-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-brand-text-muted" />
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="bg-brand-surface-elevated border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all"
            >
              <option value="all">All Modes</option>
              <option value="view_only">View Only</option>
              <option value="full_control">Full Control</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-brand-surface-elevated rounded-xl h-20 animate-pulse" />
              ))}
            </div>
            <div className="bg-brand-surface-elevated rounded-xl h-60 animate-pulse" />
          </div>
        ) : error ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <AlertTriangle size={32} className="text-status-error mb-3" />
            <p className="text-brand-text-primary font-semibold">Failed to load audit data</p>
            <p className="text-sm text-brand-text-muted mt-1">{error}</p>
            <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Eye}
            title="No workspace sessions found"
            description={
              search || modeFilter !== "all"
                ? "No sessions match your filters. Try adjusting your search or filter criteria."
                : "You have not initiated any workspace access sessions yet."
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card rounded-2xl p-4">
                <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">Total Sessions</p>
                <p className="text-2xl font-bold text-brand-text-primary mt-1">{sessions.length}</p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">View Only</p>
                <p className="text-2xl font-bold text-status-success mt-1">
                  {sessions.filter((s) => s.mode === "view_only").length}
                </p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">Full Control</p>
                <p className="text-2xl font-bold text-status-danger mt-1">
                  {sessions.filter((s) => s.mode === "full_control").length}
                </p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">Active Now</p>
                <p className="text-2xl font-bold text-brand-gold mt-1">
                  {sessions.filter((s) => s.status === "active").length}
                </p>
              </div>
            </div>

            <ResponsiveTable
              data={filtered}
              columns={columns}
              keyExtractor={(s) => s.id}
              emptyMessage="No sessions match your search"
            />
          </>
        )}
      </div>
    </>
  )
}
