import { useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import SeoHead from "../../components/SeoHead"
import {
  Building2, Eye, ShieldCheck, LogOut, RefreshCw, AlertTriangle,
  HardDrive, Users, FileText, Mail, MapPin, Clock,
  ArrowLeft, Activity, CalendarDays, Phone,
} from "lucide-react"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import StatusPill from "../../components/platform/StatusPill"
import EmptyState from "../../components/platform/EmptyState"
import StatsGrid from "../../components/platform/StatsGrid"
import { platformService } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"
import { usePlatformGovernance } from "../../contexts/PlatformGovernanceContext"
import { useAuth } from "../../hooks/useAuth"
import { ROUTES } from "../../constants/routes"
import type { WorkspaceSessionMode, WorkspaceView } from "../../types/platform"

const STATUS_MAP: Record<string, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  PENDING: "warning",
  SUSPENDED: "danger",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

export default function WorkspaceView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { exitInspection, hasPermission } = usePlatformGovernance()
  const { startImpersonation } = useAuth()
  const [entering, setEntering] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const { data, loading, error, reload } = useApiResource<WorkspaceView>(
    () => platformService.getWorkspaceView(id ?? ""),
    [id]
  )

  const canFullControl = hasPermission("intervene")
  const org = data?.organization
  const session = data?.session ?? null
  const sessionActive = data?.sessionActive ?? false

  const openEntry = useCallback(async (mode: WorkspaceSessionMode) => {
    if (!id) return
    setEntering(true)
    try {
      await platformService.openWorkspaceSession(id, mode)
      if (mode === "full_control") {
        startImpersonation(id)
        navigate(ROUTES.ORG.DASHBOARD)
      } else {
        reload()
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to open workspace session")
    } finally {
      setEntering(false)
    }
  }, [id, reload, startImpersonation, navigate])

  const closeSession = useCallback(async () => {
    if (!id) return
    setEntering(true)
    try {
      await exitInspection()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to close workspace session")
    } finally {
      setEntering(false)
    }
  }, [id, exitInspection])

  return (
    <>
      <SeoHead meta={{ title: `${org?.name ?? "Workspace"} — Inspection | ORIVIS`, noindex: true }} />
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Organizations", href: "/platform/organizations" },
            { label: org?.name ?? "Organization", href: `/platform/organizations/${id}` },
            { label: "Workspace" },
          ]}
        />

        {sessionActive && session && (
          <div
            className={`rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              session.mode === "full_control"
                ? "bg-status-error/10 border border-status-error/25"
                : "bg-status-success/10 border border-status-success/25"
            }`}
          >
            <div className="flex items-center gap-3">
              {session.mode === "full_control"
                ? <ShieldCheck size={20} className="text-status-error shrink-0" />
                : <Eye size={20} className="text-status-success shrink-0" />}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">
                  Workspace Session Active — {session.mode === "full_control" ? "Full Control" : "View Only"}
                </p>
                <p className="text-[10px] font-mono text-brand-text-muted mt-0.5">
                  Entered {session.enteredAt ? timeAgo(session.enteredAt) : "now"} · Changing org data requires full control mode
                </p>
              </div>
            </div>
            <button
              onClick={closeSession}
              disabled={entering}
              className="flex items-center gap-1.5 bg-brand-surface-elevated border border-brand-border hover:border-status-error/40 text-brand-text-primary px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              <LogOut size={14} />
              <span>{entering ? "Closing…" : "Exit Workspace"}</span>
            </button>
          </div>
        )}

        {actionError && (
          <div className="flex items-center gap-2 bg-status-error/10 border border-status-error/30 text-status-error px-4 py-3 rounded-xl text-xs">
            <AlertTriangle size={14} /> {actionError}
            <button onClick={() => setActionError(null)} className="ml-auto text-[10px] font-bold uppercase tracking-wider hover:underline">Dismiss</button>
          </div>
        )}

        <div className="glass-card rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-brand-surface-elevated flex items-center justify-center shrink-0">
                <Building2 size={28} className="text-brand-gold" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-brand-text-primary">
                    {org?.name ?? "Organization Workspace"}
                  </h1>
                  {org ? (
                    <StatusPill status={org.status} variant={STATUS_MAP[org.status] || "neutral"} />
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-brand-text-muted">
                  {org && <span>{org.slug}</span>}
                  {org && <span className="w-1 h-1 rounded-full bg-brand-text-disabled" />}
                  <span>
                    {sessionActive && session
                      ? (session.mode === "full_control" ? "Full Control" : "View Only")
                      : "Not entered"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate(`/platform/organizations/${id}`)}
                className="flex items-center gap-1.5 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/30 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Organization</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-brand-surface-elevated rounded-xl p-4 h-24 animate-pulse" />
              ))}
            </div>
            <div className="bg-brand-surface-elevated rounded-xl p-6 h-40 animate-pulse" />
          </div>
        ) : error ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <AlertTriangle size={32} className="text-status-error mb-3" />
            <p className="text-brand-text-primary font-semibold">Failed to load workspace</p>
            <p className="text-sm text-brand-text-muted mt-1">{error}</p>
            <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : !sessionActive ? (
          <EmptyState
            icon={Eye}
            title="No active workspace session"
            description="Enter this organization's workspace in view-only or full-control mode. Full control is restricted to staff with the manage workspace permission and is fully audited."
            action={{
              label: entering ? "Opening…" : "Open View-Only Session",
              onClick: () => openEntry("view_only"),
            }}
          />
        ) : (
          <>
            {session && (
              <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-brand-text-muted">
                  <span>Current mode:</span>
                  <StatusPill
                    status={session.mode === "full_control" ? "Full Control" : "View Only"}
                    variant={session.mode === "full_control" ? "danger" : "success"}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => session.mode !== "view_only" && openEntry("view_only")}
                    disabled={entering || session.mode === "view_only"}
                    className="flex items-center gap-1.5 bg-brand-surface-elevated border border-brand-border px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                  >
                    <Eye size={14} /> View Only
                  </button>
                  <button
                    onClick={() => session.mode !== "full_control" && openEntry("full_control")}
                    disabled={!canFullControl || entering || session.mode === "full_control"}
                    title={canFullControl ? "" : "Requires manage workspace permission"}
                    className="flex items-center gap-1.5 bg-status-error/10 border border-status-error/25 text-status-error px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                  >
                    <ShieldCheck size={14} /> Full Control
                  </button>
                </div>
              </div>
            )}

            <StatsGrid
              items={[
                { label: "Members", value: (org?.users_count ?? 0).toLocaleString(), icon: Users, color: "text-brand-gold" },
                { label: "Admins", value: (org?.admins_count ?? 0).toLocaleString(), icon: ShieldCheck, color: "text-blue-400" },
                { label: "Events", value: (org?.elections_count ?? 0).toString(), icon: FileText, color: "text-emerald-400" },
                {
                  label: "Storage",
                  value: formatBytes(data?.storage?.bytes ?? 0),
                  icon: HardDrive,
                  color: "text-amber-400",
                },
              ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card rounded-2xl p-5 space-y-4">
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">
                  Organization Profile
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField icon={Mail} label="Email" value={org?.email ?? "—"} />
                  <InfoField icon={Phone} label="Phone" value={org?.phone ?? "—"} />
                  <InfoField icon={MapPin} label="Location" value={org?.country ?? "—"} />
                  <InfoField icon={CalendarDays} label="Created" value={org?.created_at ? formatDate(org.created_at) : "—"} />
                </div>

                <div className="pt-3 border-t border-brand-border space-y-2">
                  <h4 className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">Workspace</h4>
                  <div className="space-y-2">
                    <QuickRow label="Workspace Name" value={data?.workspace?.workspaceName ?? "—"} />
                    <QuickRow label="Setup Progress" value={data?.workspace ? `${data.workspace.setupProgress}%` : "—"} />
                    <QuickRow label="Branding" value={data?.workspace?.hasBranding ? "Configured" : "Not configured"} />
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">
                  Quick Overview
                </h3>
                <div className="space-y-3">
                  <QuickRow label="Status" value={org?.status ?? "—"} />
                  <QuickRow label="Members" value={(org?.users_count ?? 0).toLocaleString()} />
                  <QuickRow label="Admins" value={(org?.admins_count ?? 0).toLocaleString()} />
                  <QuickRow label="Events" value={(org?.elections_count ?? 0).toString()} />
                  <QuickRow label="Storage" value={formatBytes(data?.storage?.bytes ?? 0)} />
                  <InfoRow label="Last Activity" icon={Activity} value={data?.lastActivity?.event || "—"} />
                  {data?.lastActivity?.at && (
                    <InfoRow label="Last Activated" icon={Clock} value={timeAgo(data.lastActivity.at)} />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function InfoField({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated flex items-center justify-center text-brand-text-muted shrink-0">
        <Icon size={14} />
      </div>
      <div>
        <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">{label}</p>
        <p className="text-xs text-brand-text-primary">{value}</p>
      </div>
    </div>
  )
}

function QuickRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono text-brand-text-muted">{label}</span>
      <span className="text-xs font-bold text-brand-text-primary">{value}</span>
    </div>
  )
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Clock }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-[10px] font-mono text-brand-text-muted">
        <Icon size={11} />
        {label}
      </span>
      <span className="text-xs font-bold text-brand-text-primary">{value}</span>
    </div>
  )
}