import {
  Building2, Users, Vote, Landmark, ReceiptText, RefreshCw, AlertTriangle,
  Wallet, TrendingUp,
} from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import StatsGrid from "../../components/platform/StatsGrid"
import { platformService } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"
import { formatMoney } from "../../lib/currency"
import type { PlatformCommercialOverview } from "../../types/platform"

function fmt(value: number | undefined | null): string {
  return (value ?? 0).toLocaleString()
}

export default function Billing() {
  const { data: overview, loading, error, reload } = useApiResource<PlatformCommercialOverview>(() =>
    platformService.getCommercialOverview(),
  )

  const orgs = overview?.organizations
  const elections = overview?.elections
  const payments = overview?.payments
  const revenueEntries = overview?.revenue?.byCurrency
    ? Object.entries(overview.revenue.byCurrency)
    : []
  const totalRevenue = revenueEntries.reduce((sum, [, v]) => sum + v, 0)

  const orgSegments = [
    { label: "Paid", value: orgs?.paid ?? 0, className: "text-status-success bg-status-success/10" },
    { label: "Free", value: orgs?.free ?? 0, className: "text-brand-gold bg-brand-gold/10" },
    { label: "No billing activity", value: orgs?.noBillingActivity ?? 0, className: "text-brand-text-muted bg-brand-surface-elevated" },
  ]
  const maxOrgSegment = Math.max(orgSegments[0].value, orgSegments[1].value, orgSegments[2].value, 1)

  const electionSegments = [
    { label: "Paid", value: elections?.paid ?? 0, className: "text-status-success bg-status-success/10" },
    { label: "Free (entitled)", value: elections?.free ?? 0, className: "text-brand-gold bg-brand-gold/10" },
  ]
  const maxElectionSegment = Math.max(electionSegments[0].value, electionSegments[1].value, 1)

  const SUMMARY = [
    { label: "Total Organizations", value: fmt(orgs?.total), icon: Building2, color: "text-blue-400" },
    { label: "Paid Organizations", value: fmt(orgs?.paid), icon: Users, color: "text-status-success" },
    { label: "Paid Events", value: fmt(elections?.paid), icon: Vote, color: "text-brand-gold" },
    { label: "Free Events", value: fmt(elections?.free), icon: Vote, color: "text-violet-400" },
    { label: "Verified Payments", value: fmt(payments?.verified), icon: ReceiptText, color: "text-status-success" },
    { label: "Total Revenue", value: totalRevenue > 0 && revenueEntries.length === 1 ? formatMoney(revenueEntries[0][1], revenueEntries[0][0]) : `${revenueEntries.length} currency(ies)`, icon: Wallet, color: "text-green-400" },
  ]

  return (
    <>
    <SeoHead meta={{ title: "Billing — Commercial Overview | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Billing" }]} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-brand-text-primary">Commercial Overview</h1>
          <p className="text-sm text-brand-text-muted mt-1">Per election billing across organizations — free vs paid adoption and collected revenue.</p>
        </div>
        <button onClick={reload} className="flex items-center gap-2 bg-brand-surface border border-brand-border hover:border-brand-gold/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-brand-surface border border-brand-border rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={32} className="text-status-error mb-3" />
          <p className="text-brand-text-primary font-semibold">Failed to load commercial overview</p>
          <p className="text-sm text-brand-text-muted mt-1">{error}</p>
          <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : (
        <>
          <StatsGrid items={SUMMARY} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Organization mix</h2>
                <Building2 size={16} className="text-brand-text-muted" />
              </div>
              <div className="space-y-3">
                {orgSegments.map((seg) => (
                  <div key={seg.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-brand-text-muted">{seg.label}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-bold ${seg.className}`}>{fmt(seg.value)}</span>
                    </div>
                    <div className="h-2 bg-brand-surface-elevated rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500 bg-brand-gold" style={{ width: `${(seg.value / maxOrgSegment) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-mono text-brand-text-disabled mt-4">
                Paid = at least one verified event payment. Free = billing activity but never verified a payment.
              </p>
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Events billed</h2>
                <Vote size={16} className="text-brand-text-muted" />
              </div>
              <div className="space-y-3">
                {electionSegments.map((seg) => (
                  <div key={seg.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-brand-text-muted">{seg.label}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-bold ${seg.className}`}>{fmt(seg.value)}</span>
                    </div>
                    <div className="h-2 bg-brand-surface-elevated rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500 bg-blue-500" style={{ width: `${(seg.value / maxElectionSegment) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <ReceiptText size={14} className="text-status-warning" />
                <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Pending payments</p>
              </div>
              <p className="text-2xl font-display font-bold text-brand-text-primary mt-1">{fmt(payments?.pending)}</p>
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <ReceiptText size={14} className="text-status-success" />
                <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Verified payments</p>
              </div>
              <p className="text-2xl font-display font-bold text-brand-text-primary mt-1">{fmt(payments?.verified)}</p>
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <ReceiptText size={14} className="text-status-error" />
                <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Failed payments</p>
              </div>
              <p className="text-2xl font-display font-bold text-brand-text-primary mt-1">{fmt(payments?.failed)}</p>
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Landmark size={14} className="text-brand-gold" />
                <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Revenue (by currency)</p>
              </div>
              {revenueEntries.length === 0 ? (
                <p className="text-2xl font-display font-bold text-brand-text-primary mt-1">—</p>
              ) : (
                <div className="space-y-0.5 mt-1">
                  {revenueEntries.map(([code, value]) => (
                    <p key={code} className="text-lg font-display font-bold text-brand-text-primary">{formatMoney(value, code)} <span className="text-[10px] font-mono text-brand-text-muted">({code})</span></p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-brand-text-muted bg-brand-surface border border-brand-border rounded-2xl px-4 py-3">
            <TrendingUp size={14} className="text-brand-gold" />
            <span>Currencies are never merged or converted — NGN (default) and USD (explicit optional) are tracked separately.</span>
          </div>
        </>
      )}
    </div>
    </>
  )
}