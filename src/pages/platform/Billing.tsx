import { useState, useMemo } from "react"
import {
  CreditCard, DollarSign, Building2, TrendingUp, Download, Percent,
  Wallet, RotateCcw, BarChart3, Star, Clock, Activity, AlertTriangle, RefreshCw,
} from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import StatsGrid from "../../components/platform/StatsGrid"
import DataToolbar from "../../components/DataToolbar"
import AdvancedTable from "../../components/AdvancedTable"
import type { Column } from "../../components/AdvancedTable"
import { platformService } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"
import type { PlatformInvoice } from "../../types/platform"

const SUMMARY = [
  { label: "Monthly Recurring Revenue", value: "$84,500", icon: DollarSign, color: "text-green-400" },
  { label: "Active Subscriptions", value: "128", icon: Building2, color: "text-blue-400" },
  { label: "Avg. Revenue Per Org", value: "$660.15", icon: TrendingUp, color: "text-brand-gold" },
  { label: "Pending Invoices", value: "3", icon: CreditCard, color: "text-status-warning" },
  { label: "Revenue Growth", value: "+12.4%", icon: Percent, color: "text-emerald-400", trend: { value: 12.4, positive: true } },
  { label: "Outstanding Payments", value: "$3,847.00", icon: Wallet, color: "text-amber-400" },
  { label: "Refunds This Month", value: "$420.00", icon: RotateCcw, color: "text-rose-400" },
]

const PLAN_REVENUE = [
  { plan: "Free", revenue: "$0", percent: 0, color: "bg-brand-surface-interactive" },
  { plan: "Basic", revenue: "$12,672", percent: 15, color: "bg-blue-500" },
  { plan: "Professional", revenue: "$38,244", percent: 45.2, color: "bg-brand-gold" },
  { plan: "Enterprise", revenue: "$33,584", percent: 39.8, color: "bg-violet-500" },
]

const TOP_CUSTOMERS = [
  { name: "Meranos Ltd.", revenue: "$4,500/mo", initials: "M", color: "bg-amber-500" },
  { name: "AfriTech Innovations", revenue: "$2,700/mo", initials: "A", color: "bg-blue-500" },
  { name: "TechBridge Academy", revenue: "$1,800/mo", initials: "T", color: "bg-emerald-500" },
  { name: "EduVote Systems", revenue: "$1,200/mo", initials: "E", color: "bg-violet-500" },
]

const OUTSTANDING_INVOICES = [
  { org: "Global Tech Innovators Inc.", amount: "$199.00", due: "Overdue 9 days", status: "Overdue" },
  { org: "Meranos Ltd.", amount: "$49.00", due: "Due in 5 days", status: "Pending" },
  { org: "RSU Faculty of Engineering", amount: "$199.00", due: "Due in 12 days", status: "Pending" },
]

const KPI_ITEMS = [
  { label: "MRR Growth Rate", value: "+12.4%", sub: "Month over month", positive: true },
  { label: "Churn Rate", value: "2.1%", sub: "Last 30 days", positive: false },
  { label: "Avg Rev Per Customer", value: "$660.15", sub: "Per active subscription", positive: true },
]

const statusStyles: Record<string, string> = {
  Paid: "bg-status-success/10 text-status-success",
  Pending: "bg-status-warning/10 text-status-warning",
  Free: "bg-brand-surface-interactive text-brand-text-muted",
  Overdue: "bg-red-500/10 text-red-400",
}

export default function Billing() {
  const [search, setSearch] = useState("")
  const { data, loading, error, reload } = useApiResource(platformService.getInvoices)

  const invoices = data ?? []

  const filtered = invoices.filter(
    (inv) => !search || inv.org.toLowerCase().includes(search.toLowerCase())
  )

  const columns: Column<PlatformInvoice>[] = useMemo(() => [
    {
      key: "org", label: "Organization", sortable: true,
      render: (inv) => <span className="text-xs font-semibold text-brand-text-primary">{inv.org}</span>,
    },
    {
      key: "plan", label: "Plan", sortable: true,
      render: (inv) => <span className="text-xs text-brand-text-muted">{inv.plan}</span>,
    },
    {
      key: "amount", label: "Amount", sortable: true,
      render: (inv) => <span className="text-xs font-mono text-brand-text-primary">{inv.amount}</span>,
      sortValue: (inv) => inv.amount,
    },
    {
      key: "status", label: "Status", sortable: true,
      render: (inv) => (
        <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${statusStyles[inv.status] || ""}`}>
          {inv.status}
        </span>
      ),
      sortValue: (inv) => inv.status,
    },
    {
      key: "date", label: "Date", sortable: true,
      render: (inv) => <span className="text-xs text-brand-text-muted">{inv.date}</span>,
      sortValue: (inv) => inv.date,
    },
    {
      key: "actions", label: "", sortable: false,
      render: () => (
        <button className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer">
          <Download size={12} />
        </button>
      ),
    },
  ], [])

  return (
    <>
    <SeoHead meta={{ title: "Financial Dashboard — Platform | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Billing" }]} />
      <div>
        <h1 className="text-2xl font-display font-black uppercase tracking-tight text-brand-text-primary">Financial Dashboard</h1>
        <p className="text-sm text-brand-text-muted mt-1">Platform billing overview, revenue breakdown, and invoice management.</p>
      </div>

      <StatsGrid items={SUMMARY} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Revenue by Plan</h2>
            <BarChart3 size={16} className="text-brand-text-muted" />
          </div>
          <div className="space-y-3">
            {PLAN_REVENUE.map((item) => (
              <div key={item.plan} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-text-muted">{item.plan}</span>
                  <span className="font-mono font-semibold text-brand-text-primary">{item.revenue}</span>
                </div>
                <div className="h-2 bg-brand-surface-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-brand-border flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">Total</span>
            <span className="text-sm font-mono font-bold text-brand-text-primary">$84,500</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Top Customers</h2>
            <Star size={16} className="text-brand-gold" />
          </div>
          <div className="space-y-3">
            {TOP_CUSTOMERS.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${c.color} flex items-center justify-center text-white text-xs font-bold`}>
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-brand-text-primary truncate">{c.name}</p>
                  <p className="text-[10px] font-mono text-brand-text-muted">{c.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Outstanding Invoices</h2>
            <Clock size={16} className="text-status-warning" />
          </div>
          <div className="space-y-3">
            {OUTSTANDING_INVOICES.map((inv) => (
              <div key={inv.org} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-brand-text-primary truncate">{inv.org}</p>
                  <p className={`text-[10px] font-mono mt-0.5 ${inv.status === "Overdue" ? "text-red-400" : "text-status-warning"}`}>
                    {inv.due}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-brand-text-primary ml-3">{inv.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {KPI_ITEMS.map((kpi) => (
          <div key={kpi.label} className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className={kpi.positive ? "text-status-success" : "text-status-danger"} />
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">{kpi.label}</span>
            </div>
            <p className={`text-xl font-bold font-mono ${kpi.positive ? "text-status-success" : "text-status-danger"}`}>
              {kpi.value}
            </p>
            <p className="text-[10px] text-brand-text-muted mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <DataToolbar
        search={{ value: search, onChange: setSearch, placeholder: "Search invoices..." }}
        rightContent={
          <button className="flex items-center gap-2 bg-brand-surface border border-brand-border hover:border-brand-gold/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
            <Download size={14} />
            <span>Export</span>
          </button>
        }
      />

      {loading ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 border-b border-brand-border last:border-0 flex items-center gap-4 px-4">
              <div className="flex-1 h-3 bg-brand-surface-elevated animate-pulse rounded" />
              <div className="w-24 h-3 bg-brand-surface-elevated animate-pulse rounded" />
              <div className="w-16 h-3 bg-brand-surface-elevated animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={32} className="text-status-error mb-3" />
          <p className="text-brand-text-primary font-semibold">Failed to load invoices</p>
          <p className="text-sm text-brand-text-muted mt-1">{error}</p>
          <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : (
      <AdvancedTable<PlatformInvoice>
        columns={columns}
        data={filtered}
        keyExtractor={(inv) => inv.id}
        emptyMessage="No invoices found."
        pageSize={10}
      />
      )}
    </div>
    </>
  )
}
