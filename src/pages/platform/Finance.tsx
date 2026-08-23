import { useMemo, useState } from "react"
import {
  Wallet, Banknote, RefreshCw, AlertTriangle, Inbox, Vote, Building2, Hash,
  TrendingUp, Globe, Landmark, ReceiptText, BarChart3,
} from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import EmptyState from "../../components/platform/EmptyState"
import ResponsiveTable, { ResponsiveColumn } from "../../components/platform/ResponsiveTable"
import { platformService } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"
import { formatMoney } from "../../lib/currency"
import type { PlatformCurrencyBucket, PlatformFinanceAnalytics, PlatformPayment } from "../../types/platform"

const STATUS_META: Record<PlatformPayment["status"], { label: string; className: string }> = {
  pending: { label: "pending", className: "text-status-warning bg-status-warning/10" },
  verified: { label: "verified", className: "text-status-success bg-status-success/10" },
  failed: { label: "failed", className: "text-status-error bg-status-error/10" },
  cancelled: { label: "cancelled", className: "text-brand-text-muted bg-brand-surface-elevated" },
}

const TREND_COLORS = ["bg-brand-gold", "bg-status-info", "bg-status-success", "bg-status-warning", "bg-status-danger", "bg-status-info"]

function BucketCard({ title, icon, bucket, note, currency }: { title: string; icon: React.ReactNode; bucket: PlatformCurrencyBucket; note: string; currency: string }) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">{title}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-[10px] font-mono text-brand-text-muted">Transactions</p>
          <p className="text-lg font-display font-bold text-brand-text-primary">{bucket.count.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-brand-text-muted">Revenue</p>
          <p className="text-lg font-display font-bold text-brand-text-primary truncate">{formatMoney(bucket.revenue, currency)}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-brand-text-muted">Avg value</p>
          <p className="text-sm font-mono font-semibold text-brand-text-primary">{formatMoney(bucket.avgTransactionValue, currency)}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-brand-text-muted">Success rate</p>
          <p className="text-sm font-mono font-semibold text-status-success">
            {bucket.count > 0 ? `${Math.round((bucket.successful / bucket.count) * 100)}%` : "—"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-brand-border">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-bold text-status-success bg-status-success/10">{bucket.successful} successful</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-bold text-status-warning bg-status-warning/10">{bucket.pending} pending</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-bold text-status-error bg-status-error/10">{bucket.failed} failed</span>
        {bucket.cancelled > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-bold text-brand-text-muted bg-brand-surface-elevated">{bucket.cancelled} cancelled</span>
        )}
      </div>
      <p className="text-[10px] font-mono text-brand-text-disabled mt-2">{note}</p>
    </div>
  )
}

export default function Finance() {
  const [status, setStatus] = useState<"all" | PlatformPayment["status"]>("all")
  const { data: analytics, loading: analyticsLoading, error: analyticsError, reload: reloadAnalytics } = useApiResource<PlatformFinanceAnalytics>(() =>
    platformService.getFinanceAnalytics(),
  )
  const { data: paymentsData, loading: paymentsLoading, error: paymentsError, reload: reloadPayments } = useApiResource(() =>
    platformService.getPayments({ perPage: 100 }),
  )

  const payments = paymentsData?.items ?? []
  const loading = analyticsLoading || paymentsLoading
  const error = analyticsError || paymentsError
  const reload = () => { reloadAnalytics(); reloadPayments() }

  const filtered = useMemo(
    () => (status === "all" ? payments : payments.filter((p) => p.status === status)),
    [payments, status],
  )

  const overall = analytics?.overall
  const revenueEntries = overall ? Object.entries(overall.revenueByCurrency) : []
  const trends = analytics?.trends ?? []
  const revenueByTier = analytics?.revenueByTier ?? []
  const maxTrendRevenue = Math.max(...trends.map((t) => t.revenue), 0)
  const maxTierRevenue = Math.max(...revenueByTier.map((t) => t.revenue), 0)

  return (
    <>
      <SeoHead meta={{ title: "Finance — Platform | ORIVIS", noindex: true }} />
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Finance" }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-brand-text-primary">Finance</h1>
            <p className="text-sm text-brand-text-muted mt-1">Per election payment analytics and collected event payments across all organizations.</p>
          </div>
          <button onClick={reload} className="flex items-center gap-2 bg-brand-surface border border-brand-border hover:border-brand-gold/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-brand-surface border border-brand-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <AlertTriangle size={32} className="text-status-error mb-3" />
            <p className="text-brand-text-primary font-semibold">Failed to load finance analytics</p>
            <p className="text-sm text-brand-text-muted mt-1">{error}</p>
            <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Wallet size={14} className="text-brand-gold" />
                  <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Collected revenue</p>
                </div>
                {revenueEntries.length === 0 ? (
                  <p className="text-2xl font-display font-bold text-brand-text-primary mt-1">—</p>
                ) : (
                  <div className="space-y-1 mt-1">
                    {revenueEntries.map(([code, value]) => (
                      <p key={code} className="text-xl font-display font-bold text-brand-text-primary">{formatMoney(value, code)} <span className="text-[10px] font-mono text-brand-text-muted">({code})</span></p>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Banknote size={14} className="text-status-success" />
                  <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Verified payments</p>
                </div>
                <p className="text-2xl font-display font-bold text-brand-text-primary mt-1">{overall?.verified.toLocaleString() ?? 0}</p>
              </div>
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-status-warning" />
                  <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Paying organizations</p>
                </div>
                <p className="text-2xl font-display font-bold text-brand-text-primary mt-1">{overall?.payingOrganizations.toLocaleString() ?? 0}</p>
              </div>
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <ReceiptText size={14} className="text-status-error" />
                  <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Pending / failed</p>
                </div>
                <p className="text-2xl font-display font-bold text-brand-text-primary mt-1">
                  {((overall?.pending ?? 0) + (overall?.failed ?? 0)).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <BucketCard title="Local (NGN)" icon={<Landmark size={14} className="text-brand-gold" />} bucket={analytics?.local ?? { count: 0, revenue: 0, avgTransactionValue: 0, successful: 0, pending: 0, failed: 0, cancelled: 0 }} note="Nigerian naira payments. NGN is the default platform billing currency." currency="NGN" />
              <BucketCard title="International (USD)" icon={<Globe size={14} className="text-status-info" />} bucket={analytics?.international ?? { count: 0, revenue: 0, avgTransactionValue: 0, successful: 0, pending: 0, failed: 0, cancelled: 0 }} note="US dollar payments (optional explicit currency)." currency="USD" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Revenue trend</h2>
                  <TrendingUp size={16} className="text-brand-text-muted" />
                </div>
                {trends.length === 0 || maxTrendRevenue === 0 ? (
                  <p className="text-xs text-brand-text-muted flex items-center gap-2 py-4"><Inbox size={14} /> No verified payments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {trends.map((t) => (
                      <div key={t.month} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-brand-text-muted">{t.month}</span>
                          <span className="font-mono font-semibold text-brand-text-primary">{formatMoney(t.revenue, revenueEntries[0]?.[0] ?? "NGN")}</span>
                        </div>
                        <div className="h-2 bg-brand-surface-elevated rounded-full overflow-hidden">
                          <div className="h-full bg-brand-gold rounded-full transition-all duration-500" style={{ width: `${(t.revenue / maxTrendRevenue) * 100}%` }} />
                        </div>
                        <p className="text-[9px] font-mono text-brand-text-disabled">{t.volume} payment(s)</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Revenue by pricing tier</h2>
                  <BarChart3 size={16} className="text-brand-text-muted" />
                </div>
                {revenueByTier.length === 0 || maxTierRevenue === 0 ? (
                  <p className="text-xs text-brand-text-muted flex items-center gap-2 py-4"><Inbox size={14} /> No paid tiers yet.</p>
                ) : (
                  <div className="space-y-3">
                    {revenueByTier.map((tier, i) => (
                      <div key={tier.tier} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-brand-text-muted">{tier.tier}</span>
                          <span className="font-mono font-semibold text-brand-text-primary">{formatMoney(tier.revenue, revenueEntries[0]?.[0] ?? "NGN")}</span>
                        </div>
                        <div className="h-2 bg-brand-surface-elevated rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${TREND_COLORS[i % TREND_COLORS.length]}`} style={{ width: `${(tier.revenue / maxTierRevenue) * 100}%` }} />
                        </div>
                        <p className="text-[9px] font-mono text-brand-text-disabled">{tier.elections} paid election(s)</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center flex-wrap gap-3">
          <select name="status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Status filter"
            className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-[10px] font-mono text-brand-text-primary focus:outline-none focus:border-brand-gold cursor-pointer">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {paymentsLoading ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 border-b border-brand-border last:border-0 flex items-center gap-4 px-4">
                <div className="w-7 h-7 rounded-lg bg-brand-surface-elevated animate-pulse" />
                <div className="flex-1 h-3 bg-brand-surface-elevated animate-pulse rounded" />
                <div className="w-24 h-3 bg-brand-surface-elevated animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : paymentsError ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <AlertTriangle size={32} className="text-status-error mb-3" />
            <p className="text-brand-text-primary font-semibold">Failed to load payments</p>
            <p className="text-sm text-brand-text-muted mt-1">{paymentsError}</p>
            <button onClick={reloadPayments} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Inbox} title="No payments found" description="No event payments match this filter." />
        ) : (
          <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
            <ResponsiveTable
              columns={[
                {
                  key: "event",
                  label: "Event",
                  mobileOrder: 1,
                  render: (p: PlatformPayment) => (
                    <div className="flex items-center gap-2">
                      <Vote size={12} className="text-brand-text-muted shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-brand-text-primary truncate">{p.election?.title ?? "—"}</p>
                        <p className="text-[10px] font-mono text-brand-text-muted truncate">{p.reference}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "org",
                  label: "Organization",
                  mobileOrder: 2,
                  render: (p: PlatformPayment) => (
                    <div className="flex items-center gap-2">
                      <Building2 size={12} className="text-brand-text-muted shrink-0" />
                      <span className="text-xs text-brand-text-primary truncate">{p.organization?.name ?? "—"}</span>
                    </div>
                  ),
                },
                {
                  key: "amount",
                  label: "Amount",
                  mobileOrder: 3,
                  render: (p: PlatformPayment) => (
                    <span className="text-xs font-bold text-brand-text-primary">{formatMoney(p.amount, p.currency)}</span>
                  ),
                },
                {
                  key: "status",
                  label: "Status",
                  mobileOrder: 4,
                  render: (p: PlatformPayment) => (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-bold ${(STATUS_META[p.status] ?? STATUS_META.pending).className}`}>
                      {(STATUS_META[p.status] ?? STATUS_META.pending).label}
                    </span>
                  ),
                },
                {
                  key: "paidAt",
                  label: "Paid",
                  mobileOrder: 5,
                  render: (p: PlatformPayment) => (
                    <span className="text-[10px] font-mono text-brand-text-muted">
                      {p.verifiedAt ? new Date(p.verifiedAt).toLocaleString() : "—"}
                    </span>
                  ),
                },
                {
                  key: "created",
                  label: "Created",
                  mobileOrder: 6,
                  render: (p: PlatformPayment) => (
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-brand-text-muted">
                      <Hash size={10} className="text-brand-text-disabled" />
                      {new Date(p.createdAt).toLocaleString()}
                    </span>
                  ),
                },
              ] as ResponsiveColumn<PlatformPayment>[]}
              data={filtered}
              keyExtractor={(p) => p.uuid}
            />
          </div>
        )}
        <p className="text-[10px] font-mono text-brand-text-disabled text-center">{filtered.length} payment(s)</p>
      </div>
    </>
  )
}