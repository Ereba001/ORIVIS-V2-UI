import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { Building2, AlertTriangle, RefreshCw } from "lucide-react"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import PageHeader from "../../components/platform/PageHeader"
import TabNav from "../../components/platform/TabNav"
import StatusPill from "../../components/platform/StatusPill"
import EmptyState from "../../components/platform/EmptyState"
import { platformService } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"
import type { OrganizationHealth } from "../../types/platform"
import SeoHead from "../../components/SeoHead"

type TabId = "all" | "provisioning" | "active" | "suspended"
type SortKey = "name" | "date"

const STATUS_MAP: Record<string, "success" | "warning" | "danger" | "info"> = {
  ACTIVE: "success",
  PROVISIONING: "info",
  SUSPENDED: "danger",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function PlatformOrganizations() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<TabId>("all")
  const [sort, setSort] = useState<SortKey>("name")
  const { data, loading, error, reload } = useApiResource(platformService.getOrganizations)

  const organizations = data?.items ?? []
  const loadingOrgs = loading || (data === null && error === null)

  const tabs = useMemo(() => {
    const total = organizations.length
    const provisioning = organizations.filter((o) => o.status === "PROVISIONING").length
    const active = organizations.filter((o) => o.status === "ACTIVE").length
    const suspended = organizations.filter((o) => o.status === "SUSPENDED").length
    return [
      { id: "all", label: "All", count: total },
      { id: "provisioning", label: "Provisioning", count: provisioning },
      { id: "active", label: "Active", count: active },
      { id: "suspended", label: "Suspended", count: suspended },
    ]
  }, [organizations])

  const filtered = useMemo(() => {
    let result = [...organizations]

    if (tab !== "all") {
      result = result.filter((o) => o.status.toLowerCase() === tab)
    }


    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.organizationName.toLowerCase().includes(q) ||
          o.slug.toLowerCase().includes(q) ||
          o.country.toLowerCase().includes(q) ||
          o.plan.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      if (sort === "name") {
        return a.organizationName.localeCompare(b.organizationName)
      }
      return new Date(b.dateJoined).getTime() - new Date(a.dateJoined).getTime()
    })

    return result
  }, [search, tab, sort, organizations])

  return (
    <>
    <SeoHead meta={{ title: "Organizations — Platform | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Organizations" }]} />

      <PageHeader
        title="Organizations"
        description="Manage all platform organizations."
        search={{ value: search, onChange: setSearch, placeholder: "Search organizations..." }}
        actions={undefined}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <TabNav tabs={tabs} activeTab={tab} onChange={(id) => setTab(id as TabId)} />
        <div className="flex items-center gap-2 text-[10px] font-mono text-brand-text-muted">
          <span>Sort by</span>
          <button
            onClick={() => setSort(sort === "name" ? "date" : "name")}
            className="flex items-center gap-1.5 bg-brand-surface-elevated border border-brand-border rounded-xl px-3 py-1.5 text-brand-text-primary hover:border-brand-gold/30 transition-all cursor-pointer"
          >
            {sort === "name" ? "Name" : "Date Joined"}
            <span className="text-brand-text-muted">&uarr;</span>
          </button>
        </div>
      </div>

      {loadingOrgs ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-brand-border last:border-0 flex items-center gap-4 px-4">
              <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated animate-pulse" />
              <div className="flex-1 h-3 bg-brand-surface-elevated animate-pulse rounded" />
              <div className="w-24 h-3 bg-brand-surface-elevated animate-pulse rounded" />
              <div className="w-16 h-3 bg-brand-surface-elevated animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={32} className="text-status-error mb-3" />
          <p className="text-brand-text-primary font-semibold">Failed to load organizations</p>
          <p className="text-sm text-brand-text-muted mt-1">{error}</p>
          <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations found"
          description={search ? "Try a different search term." : "No organizations match this filter."}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-border">
                  {["Organization", "Workspace", "Subscription", "Active Events", "Status", "Country", "Date Joined", "Last Activity"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((org, i) => (
                  <motion.tr
                    key={org.organizationId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-brand-border last:border-0 hover:bg-brand-surface-interactive/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/platform/organizations/${org.organizationId}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated flex items-center justify-center shrink-0">
                          <Building2 size={14} className="text-brand-text-muted" />
                        </div>
                        <span className="text-xs font-semibold text-brand-text-primary whitespace-nowrap">
                          {org.organizationName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono text-brand-text-muted">{org.slug}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-text-muted whitespace-nowrap">{org.plan}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-md bg-brand-surface-elevated text-[10px] font-mono font-bold text-brand-text-primary">
                        {org.activeEvents}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill
                        status={org.status}
                        variant={STATUS_MAP[org.status] || "neutral"}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-text-muted whitespace-nowrap">{org.country}</td>
                    <td className="px-4 py-3 text-[10px] font-mono text-brand-text-muted whitespace-nowrap">
                      {formatDate(org.dateJoined)}
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-brand-text-muted whitespace-nowrap">
                      {timeAgo(org.lastActivity)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
    </>
  )
}
