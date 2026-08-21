import { useMemo, useState } from "react"
import { Search, ShieldAlert, ShieldCheck, Ban, RotateCcw, CheckCircle2, Building2, Vote, RefreshCw, AlertTriangle, Inbox, X } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import EmptyState from "../../components/platform/EmptyState"
import ResponsiveTable, { ResponsiveColumn } from "../../components/platform/ResponsiveTable"
import { usePlatformPermissions } from "../../contexts/PlatformPermissionsContext"
import { PLATFORM_PERMISSIONS } from "../../constants/platformPermissions"
import { platformService } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"
import type { PlatformFreeEventFlag } from "../../types/platform"

const SEVERITY_COLORS: Record<string, string> = {
  low: "text-blue-400 bg-blue-400/10",
  medium: "text-status-warning bg-status-warning/10",
  high: "text-status-error bg-status-error/10",
}

function flagTitle(flag: PlatformFreeEventFlag): string {
  return flag.election?.title ?? flag.organization?.name ?? `Flag #${flag.id}`
}

export default function FreeEventFlags() {
  const { hasAnyPermission } = usePlatformPermissions()
  const canManage = hasAnyPermission(PLATFORM_PERMISSIONS.MANAGE_FINANCE, PLATFORM_PERMISSIONS.MANAGE_ORGANIZATIONS)
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState<"All" | "low" | "medium" | "high">("All")
  const [stateFilter, setStateFilter] = useState<"all" | "open" | "resolved">("all")
  const [busy, setBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [promptAction, setPromptAction] = useState<{ action: "resolve" | "block" | "unblock"; flag: PlatformFreeEventFlag } | null>(null)
  const [promptNote, setPromptNote] = useState("")
  const { data, loading, error, reload } = useApiResource(() => platformService.getFreeEventFlags({ perPage: 100 }))

  const flags = data?.items ?? []

  const filtered = useMemo(
    () =>
      flags.filter((flag) => {
        if (severity !== "All" && flag.severity !== severity) return false
        if (stateFilter === "open" && flag.resolved) return false
        if (stateFilter === "resolved" && !flag.resolved) return false
        if (search) {
          const haystack = `${flagTitle(flag)} ${flag.reason ?? ""} ${flag.organization?.email ?? ""}`.toLowerCase()
          if (!haystack.includes(search.toLowerCase())) return false
        }
        return true
      }),
    [flags, severity, stateFilter, search],
  )

  function runAction(action: "resolve" | "block" | "unblock", flag: PlatformFreeEventFlag) {
    setPromptAction({ action, flag })
    setPromptNote("")
  }

  async function confirmAction() {
    if (!promptAction) return
    const { action, flag } = promptAction
    setBusy(`${action}:${flag.id}`)
    setActionError(null)
    try {
      if (action === "resolve") await platformService.resolveFreeEventFlag(flag.id, promptNote || undefined)
      if (action === "block") await platformService.blockFreeEventFlag(flag.id, promptNote || undefined)
      if (action === "unblock") await platformService.unblockFreeEventFlag(flag.id, promptNote || undefined)
      setPromptAction(null)
      setPromptNote("")
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed. Try again.")
    } finally {
      setBusy(null)
    }
  }

  const openCount = flags.filter((f) => !f.resolved).length
  const blockedCount = flags.filter((f) => f.isBlocked).length

  return (
    <>
      <SeoHead meta={{ title: "Free-Event Flags — Platform | ORIVIS", noindex: true }} />
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Free-Event Flags" }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-brand-text-primary">Free-Event Flags</h1>
            <p className="text-sm text-brand-text-muted mt-1">Anti abuse review console for the free first event offer.</p>
          </div>
          <button onClick={reload} className="flex items-center gap-2 bg-brand-surface border border-brand-border hover:border-brand-gold/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {actionError && (
          <div className="flex items-center gap-2 bg-status-error/10 border border-status-error/30 text-status-error px-4 py-3 rounded-xl text-xs">
            <AlertTriangle size={14} /> {actionError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Total flags</p>
            <p className="text-2xl font-display font-bold text-brand-text-primary mt-1">{flags.length}</p>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Open (unresolved)</p>
            <p className={`text-2xl font-display font-bold mt-1 ${openCount > 0 ? "text-status-warning" : "text-brand-text-primary"}`}>{openCount}</p>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Blocked grants</p>
            <p className={`text-2xl font-display font-bold mt-1 ${blockedCount > 0 ? "text-status-error" : "text-brand-text-primary"}`}>{blockedCount}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search flags..." aria-label="Search flags"
              className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all" />
          </div>
          {(["All", "low", "medium", "high"] as const).map((s) => (
            <button key={s} onClick={() => setSeverity(s)}
              className={`px-3 py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                severity === s ? "bg-brand-gold text-brand-bg-secondary" : "bg-brand-surface border border-brand-border text-brand-text-muted hover:border-brand-gold/30"
              }`}>{s}</button>
          ))}
          <select name="stateFilter" value={stateFilter} onChange={(e) => setStateFilter(e.target.value as "all" | "open" | "resolved")} aria-label="State filter"
            className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-[10px] font-mono text-brand-text-primary focus:outline-none focus:border-brand-gold cursor-pointer">
            <option value="all">All states</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {loading ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 border-b border-brand-border last:border-0 flex items-center gap-4 px-4">
                <div className="w-7 h-7 rounded-lg bg-brand-surface-elevated animate-pulse" />
                <div className="flex-1 h-3 bg-brand-surface-elevated animate-pulse rounded" />
                <div className="w-24 h-3 bg-brand-surface-elevated animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <AlertTriangle size={32} className="text-status-error mb-3" />
            <p className="text-brand-text-primary font-semibold">Failed to load flags</p>
            <p className="text-sm text-brand-text-muted mt-1">{error}</p>
            <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Inbox} title="No flags found" description={search ? "Try a different search term." : "No abuse flags match this filter."} />
        ) : (
          <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
            <ResponsiveTable
              columns={[
                {
                  key: "flag",
                  label: "Flag",
                  mobileOrder: 1,
                  render: (flag: PlatformFreeEventFlag) => (
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center ${
                        flag.isBlocked ? "bg-status-error/10 text-status-error" : flag.resolved ? "bg-brand-surface-elevated text-brand-text-muted" : "text-status-warning bg-status-warning/10"
                      }`}>
                        {flag.isBlocked ? <Ban size={12} /> : flag.resolved ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-brand-text-primary truncate">{flagTitle(flag)}</p>
                        <p className="text-[10px] font-mono text-brand-text-muted truncate">{flag.reason ?? "No reason recorded"}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${SEVERITY_COLORS[flag.severity]}`}>{flag.severity}</span>
                          {flag.isBlocked && <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full text-status-error bg-status-error/10">blocked</span>}
                          {flag.resolved && <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full text-brand-text-muted bg-brand-surface-elevated">resolved</span>}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "org",
                  label: "Organization",
                  mobileOrder: 2,
                  render: (flag: PlatformFreeEventFlag) => (
                    <div className="flex items-center gap-2">
                      <Building2 size={12} className="text-brand-text-muted shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-brand-text-primary truncate">{flag.organization?.name ?? "—"}</p>
                        <p className="text-[10px] font-mono text-brand-text-muted truncate">{flag.organization?.email ?? ""}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "election",
                  label: "Event",
                  mobileOrder: 3,
                  render: (flag: PlatformFreeEventFlag) => (
                    <div className="flex items-center gap-2">
                      <Vote size={12} className="text-brand-text-muted shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-brand-text-primary truncate">{flag.election?.title ?? "—"}</p>
                        {flag.election && (
                          <p className="text-[10px] font-mono text-brand-text-muted">
                            {(flag.election?.estimatedParticipants ?? 0).toLocaleString("en-NG")} participants
                          </p>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "signals",
                  label: "Signals",
                  mobileOrder: 4,
                  render: (flag: PlatformFreeEventFlag) => {
                    const riskScore = (flag.signals?.risk_score as number | undefined) ?? null
                    const duplicates = (flag.signals?.duplicate_orgs_by_email as number | undefined) ?? null
                    return (
                      <div className="flex flex-wrap gap-1.5">
                        {riskScore !== null && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-surface-elevated text-brand-text-muted">risk {riskScore}</span>
                        )}
                        {duplicates !== null && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-surface-elevated text-brand-text-muted">{duplicates} dup email(s)</span>
                        )}
                        {riskScore === null && duplicates === null && (
                          <span className="text-[10px] font-mono text-brand-text-disabled">—</span>
                        )}
                      </div>
                    )
                  },
                },
                {
                  key: "time",
                  label: "Raised",
                  mobileOrder: 5,
                  render: (flag: PlatformFreeEventFlag) => (
                    <span className="text-[10px] font-mono text-brand-text-muted">{new Date(flag.createdAt).toLocaleString()}</span>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  mobileOrder: 6,
                  render: (flag: PlatformFreeEventFlag) =>
                    canManage ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {!flag.resolved && (
                          <button onClick={() => runAction("resolve", flag)} disabled={busy !== null}
                            className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-brand-text-primary hover:border-brand-gold/40 disabled:opacity-50 cursor-pointer">
                            Resolve
                          </button>
                        )}
                        {!flag.isBlocked && (
                          <button onClick={() => runAction("block", flag)} disabled={busy !== null}
                            className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-1.5 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error hover:bg-status-error/20 disabled:opacity-50 cursor-pointer">
                            <Ban size={11} /> Block
                          </button>
                        )}
                        {flag.isBlocked && (
                          <button onClick={() => runAction("unblock", flag)} disabled={busy !== null}
                            className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 cursor-pointer">
                            <RotateCcw size={11} /> Unblock
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-brand-text-disabled"><ShieldCheck size={11} /> View only</span>
                    ),
                },
              ] as ResponsiveColumn<PlatformFreeEventFlag>[]}
              data={filtered}
              keyExtractor={(flag) => flag.id}
            />
          </div>
        )}
        <p className="text-[10px] font-mono text-brand-text-disabled text-center">{filtered.length} flag(s)</p>
      </div>

      {promptAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPromptAction(null)}>
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-brand-text-primary">
                {promptAction.action === "resolve"
                  ? `Resolve "${flagTitle(promptAction.flag)}"`
                  : promptAction.action === "block"
                    ? `Block "${flagTitle(promptAction.flag)}"`
                    : `Unblock "${flagTitle(promptAction.flag)}"`}
              </h3>
              <button onClick={() => setPromptAction(null)} className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted">
                <X size={16} />
              </button>
            </div>
            <p className="text-[10px] text-brand-text-muted mb-3">
              {promptAction.action === "resolve"
                ? "Add an optional resolution note."
                : promptAction.action === "block"
                  ? "This will revoke the organization's free event entitlement. Add an optional note."
                  : "This will restore the organization's free event entitlement. Add an optional note."}
            </p>
            <textarea
              value={promptNote}
              onChange={(e) => setPromptNote(e.target.value)}
              placeholder="Optional note..."
              rows={3}
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all resize-none mb-4"
            />
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setPromptAction(null)}
                className="px-4 py-2 rounded-xl text-[10px] font-bold text-brand-text-muted hover:bg-brand-surface-interactive transition-all">
                Cancel
              </button>
              <button onClick={confirmAction} disabled={busy !== null}
                className="px-4 py-2 rounded-xl text-[10px] font-bold text-white hover:opacity-90 transition-all disabled:opacity-50"
                style={{ backgroundColor: promptAction.action === "block" ? "var(--status-error, #ef4444)" : promptAction.action === "unblock" ? "#10b981" : undefined }}>
                {busy !== null ? "Processing..." : promptAction.action === "resolve" ? "Resolve" : promptAction.action === "block" ? "Block" : "Unblock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}