import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { MoreHorizontal, User, AlertTriangle, RefreshCw } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import DataToolbar from "../../components/DataToolbar"
import AdvancedTable from "../../components/AdvancedTable"
import type { Column } from "../../components/AdvancedTable"
import { platformService } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"
import type { PlatformUser } from "../../types/platform"

export default function PlatformUsers() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const { data, loading, error, reload } = useApiResource(platformService.getUsers)

  const users = data?.items ?? []

  const filtered = users.filter(
    (u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  const columns: Column<PlatformUser>[] = useMemo(() => [
    {
      key: "name", label: "User", sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-surface-interactive flex items-center justify-center">
            <User size={14} className="text-brand-text-muted" />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-text-primary">{u.name}</p>
            <p className="text-[9px] font-mono text-brand-text-muted">{u.email}</p>
          </div>
        </div>
      ),
      sortValue: (u) => u.name,
    },
    {
      key: "role", label: "Role", sortable: true,
      render: (u) => <span className="text-xs text-brand-text-muted">{u.role}</span>,
    },
    {
      key: "org", label: "Organization", sortable: true,
      render: (u) => <span className="text-xs text-brand-text-muted">{u.org}</span>,
    },
    {
      key: "status", label: "Status", sortable: true,
      render: (u) => (
        <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
          u.status === "Active" ? "bg-status-success/10 text-status-success" :
          u.status === "Suspended" ? "bg-status-error/10 text-status-error" :
          "bg-status-warning/10 text-status-warning"
        }`}>{u.status}</span>
      ),
      sortValue: (u) => u.status,
    },
    {
      key: "joined", label: "Joined", sortable: true,
      render: (u) => <span className="text-xs text-brand-text-muted">{u.joined}</span>,
      sortValue: (u) => u.joined,
    },
    {
      key: "actions", label: "", sortable: false,
      render: (u) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/platform/users/${u.id}`) }}
          className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer"
        >
          <MoreHorizontal size={14} />
        </button>
      ),
    },
  ], [navigate])

  return (
    <>
    <SeoHead meta={{ title: "Users — Platform | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Users" }]} />
      <div>
        <h1 className="text-2xl font-display font-black uppercase tracking-tight text-brand-text-primary">Users</h1>
        <p className="text-sm text-brand-text-muted mt-1">Manage all platform users.</p>
      </div>

      <DataToolbar
        search={{ value: search, onChange: setSearch, placeholder: "Search users..." }}
      />

      {loading ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 border-b border-brand-border last:border-0 flex items-center gap-4 px-4">
              <div className="w-9 h-9 rounded-full bg-brand-surface-interactive animate-pulse" />
              <div className="flex-1 h-3 bg-brand-surface-elevated animate-pulse rounded" />
              <div className="w-24 h-3 bg-brand-surface-elevated animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={32} className="text-status-error mb-3" />
          <p className="text-brand-text-primary font-semibold">Failed to load users</p>
          <p className="text-sm text-brand-text-muted mt-1">{error}</p>
          <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : (
      <AdvancedTable<PlatformUser>
        columns={columns}
        data={filtered}
        keyExtractor={(u) => u.id}
        onRowClick={(u) => navigate(`/platform/users/${u.id}`)}
        emptyMessage="No users found."
        pageSize={10}
      />
      )}
    </div>
    </>
  )
}
