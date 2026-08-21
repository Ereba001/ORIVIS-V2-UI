import { useState } from "react"
import { createPortal } from "react-dom"
import { Search, ScrollText, MoreHorizontal, Building2, Clock, AlertTriangle, RefreshCw, Inbox, XCircle } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import EmptyState from "../../components/platform/EmptyState"
import ResponsiveTable, { ResponsiveColumn } from "../../components/platform/ResponsiveTable"
import { platformService } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"

type TabFilter = "all" | "pending" | "upcoming" | "live" | "concluded"

export default function PlatformElections() {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<TabFilter>("all")
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { data, loading, error, reload } = useApiResource(() => platformService.getElections())

  const elections = data ?? []

  const filtered = elections.filter((e) => {
    if (!search && tab === "all") return true
    const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.org.toLowerCase().includes(search.toLowerCase())
    const statusKey = e.status === "Pending Review" ? "pending" : e.status.toLowerCase() as string
    const matchesTab = tab === "all" || statusKey === tab
    return matchesSearch && matchesTab
  })

  const pendingCount = elections.filter((e) => e.status === "Pending Review").length

  return (
    <>
    <SeoHead meta={{ title: "Events — Platform | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Events" }]} />
      <div>
        <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-brand-text-primary">Events</h1>
        <p className="text-sm text-brand-text-muted mt-1">Oversee elections across all organizations. Oversee and monitor event activity.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-md flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events..." aria-label="Search"
            className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all" />
        </div>
        <div className="flex gap-1 bg-brand-surface border border-brand-border rounded-xl p-1 overflow-x-auto">
          {(["all", "pending", "upcoming", "live", "concluded"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                tab === t ? "bg-brand-gold/20 text-brand-gold" : "text-brand-text-muted hover:text-brand-text-primary"
              }`}>
              {t}{t === "pending" ? ` (${pendingCount})` : ""}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 bg-status-error/10 border border-status-error/30 text-status-error text-xs font-semibold rounded-xl px-4 py-3">
          <AlertTriangle size={14} /> {actionError}
        </div>
      )}

      {loading ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 border-b border-brand-border last:border-0 flex items-center gap-4 px-4">
              <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated animate-pulse" />
              <div className="flex-1 h-3 bg-brand-surface-elevated animate-pulse rounded" />
              <div className="w-24 h-3 bg-brand-surface-elevated animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={32} className="text-status-error mb-3" />
          <p className="text-brand-text-primary font-semibold">Failed to load events</p>
          <p className="text-sm text-brand-text-muted mt-1">{error}</p>
          <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No events found"
          description={search ? "Try a different search term." : "No events match this filter."}
        />
      ) : (
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
        <ResponsiveTable
          columns={[
            {
              key: "name",
              label: "Event",
              mobileOrder: 1,
              render: (el) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated flex items-center justify-center">
                    <ScrollText size={14} className="text-brand-text-muted" />
                  </div>
                  <span className="text-xs font-semibold text-brand-text-primary">{el.name}</span>
                </div>
              ),
            },
            {
              key: "org",
              label: "Organization",
              mobileOrder: 2,
              render: (el) => (
                <span className="inline-flex items-center gap-1 text-xs text-brand-text-muted">
                  <Building2 size={10} />{el.org}
                </span>
              ),
            },
            {
              key: "status",
              label: "Status",
              mobileOrder: 3,
              render: (el) => (
                <span className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  el.status === "Live" ? "bg-status-success/10 text-status-success" :
                  el.status === "Upcoming" ? "bg-status-warning/10 text-status-warning" :
                  el.status === "Pending Review" ? "bg-yellow-400/10 text-yellow-400" :
                  "bg-brand-surface-interactive text-brand-text-muted"
                }`}>
                  {el.status === "Pending Review" && <Clock size={10} />}
                  {el.status}
                </span>
              ),
            },
            {
              key: "created",
              label: "Created",
              mobileOrder: 4,
              render: (el) => (
                <span className="text-xs text-brand-text-muted">{el.created}</span>
              ),
            },
            {
              key: "actions",
              label: "",
              mobileOrder: 5,
              render: (el) => (
                el.status === "Pending Review" ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (menuOpenId === el.id) { setMenuOpenId(null); setMenuPos(null) }
                      else {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                        setMenuOpenId(el.id)
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer"
                  >
                    <MoreHorizontal size={12} />
                  </button>
                ) : null
              ),
            },
          ] as ResponsiveColumn<any>[]}
          data={filtered}
          keyExtractor={(el) => el.id}
        />
        {menuOpenId && menuPos && createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setMenuOpenId(null); setMenuPos(null) }} />
            <div className="fixed z-50 w-40 bg-brand-surface border border-brand-border rounded-xl py-1 shadow-xl" style={{ top: menuPos.top, right: menuPos.right }}>
              <button onClick={async () => {
                const id = menuOpenId; setMenuOpenId(null); setMenuPos(null)
                setActingId(id); setActionError(null)
                try {
                  await platformService.approveElection(id)
                } catch (err) {
                  setActionError(err instanceof Error ? err.message : 'Failed to approve election.')
                }
                setActingId(null); reload()
              }}
                disabled={actingId === menuOpenId}
                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-status-success hover:bg-brand-surface-interactive transition-colors disabled:opacity-50">
                {actingId === menuOpenId ? 'Approving...' : 'Approve'}
              </button>
              <button onClick={async () => {
                const id = menuOpenId; setMenuOpenId(null); setMenuPos(null)
                setActingId(id); setActionError(null)
                try {
                  await platformService.rejectElection(id)
                } catch (err) {
                  setActionError(err instanceof Error ? err.message : 'Failed to reject election.')
                }
                setActingId(null); reload()
              }}
                disabled={actingId === menuOpenId}
                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-status-error hover:bg-brand-surface-interactive transition-colors disabled:opacity-50">
                <XCircle size={12} /> {actingId === menuOpenId ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </>,
          document.body
        )}
      </div>
      )}
    </div>
    </>
  )
}
