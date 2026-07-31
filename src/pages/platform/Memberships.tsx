import { useState } from "react"
import { Search, UserCheck, MoreHorizontal, AlertTriangle, RefreshCw, Users } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import EmptyState from "../../components/platform/EmptyState"
import { platformService } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"

export default function Memberships() {
  const [search, setSearch] = useState("")
  const { data, loading, error, reload } = useApiResource(platformService.getMemberships)

  const memberships = data ?? []

  const filtered = memberships.filter((m) => !search || m.user.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()) || m.org.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
    <SeoHead meta={{ title: "Memberships — Platform | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Memberships" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black uppercase tracking-tight text-brand-text-primary">Memberships</h1>
          <p className="text-sm text-brand-text-muted mt-1">Manage organization memberships across the platform.</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
          <span>Invite</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search memberships..."
          className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all" />
      </div>

      {loading ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 border-b border-brand-border last:border-0 flex items-center gap-4 px-4">
              <div className="w-8 h-8 rounded-full bg-brand-surface-interactive animate-pulse" />
              <div className="flex-1 h-3 bg-brand-surface-elevated animate-pulse rounded" />
              <div className="w-24 h-3 bg-brand-surface-elevated animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={32} className="text-status-error mb-3" />
          <p className="text-brand-text-primary font-semibold">Failed to load memberships</p>
          <p className="text-sm text-brand-text-muted mt-1">{error}</p>
          <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No memberships found"
          description={search ? "Try a different search term." : "No memberships yet."}
        />
      ) : (
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-brand-border">
              {["Member", "Organization", "Role", "Status", "Joined", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-brand-border last:border-0 hover:bg-brand-surface-interactive/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-surface-interactive flex items-center justify-center">
                      <UserCheck size={14} className="text-brand-text-muted" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-brand-text-primary">{m.user}</p>
                      <p className="text-[9px] font-mono text-brand-text-muted">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-brand-text-muted">{m.org}</td>
                <td className="px-4 py-3 text-xs text-brand-text-primary font-semibold">{m.role}</td>
                <td className="px-4 py-3">
                  <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    m.status === "Active" ? "bg-status-success/10 text-status-success" :
                    m.status === "Suspended" ? "bg-status-error/10 text-status-error" :
                    "bg-status-warning/10 text-status-warning"
                  }`}>{m.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-brand-text-muted">{m.joined}</td>
                <td className="px-4 py-3"><button className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer"><MoreHorizontal size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
    </>
  )
}
