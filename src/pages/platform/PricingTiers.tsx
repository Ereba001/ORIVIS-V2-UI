import { useEffect, useMemo, useState } from "react"
import {
  Tag, Plus, RefreshCw, AlertTriangle, Inbox, Pencil, Archive, RotateCcw, ToggleLeft, ToggleRight, X,
} from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import EmptyState from "../../components/platform/EmptyState"
import ConfirmDialog from "../../components/platform/ConfirmDialog"
import { platformService } from "../../services/platform-service"
import { usePlatformPermissions } from "../../contexts/PlatformPermissionsContext"
import { PLATFORM_PERMISSIONS } from "../../constants/platformPermissions"
import { formatMoney } from "../../lib/currency"
import type { PlatformPricingTier } from "../../types/platform"

function formatRange(tier: PlatformPricingTier): string {
  return `${tier.minParticipants.toLocaleString()} – ${tier.maxParticipants >= 1_000_000 ? "1M+" : tier.maxParticipants.toLocaleString()}`
}

interface TierForm {
  name: string
  code: string
  description: string
  minParticipants: string
  maxParticipants: string
  price: string
  isFree: boolean
  isActive: boolean
  sortOrder: string
  effectiveFrom: string
}

const emptyForm: TierForm = {
  name: "",
  code: "",
  description: "",
  minParticipants: "",
  maxParticipants: "",
  price: "",
  isFree: false,
  isActive: true,
  sortOrder: "",
  effectiveFrom: "",
}

export default function PricingTiers() {
  const { hasPermission } = usePlatformPermissions()
  const canManage = hasPermission(PLATFORM_PERMISSIONS.MANAGE_FINANCE)

  const [tiers, setTiers] = useState<PlatformPricingTier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<PlatformPricingTier | null>(null)
  const [form, setForm] = useState<TierForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<PlatformPricingTier | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

  const load = () => {
    setLoading(true)
    setError(null)
    platformService.getPricingTiers({ perPage: 100, includeArchived: true })
      .then((res) => {
        setTiers(res.items)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load pricing tiers.")
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visibleTiers = useMemo(() => {
    let list = showArchived ? tiers : tiers.filter((t) => !t.archivedAt)
    if (statusFilter !== "all") {
      list = list.filter((t) => (statusFilter === "active" ? t.isActive : !t.isActive))
    }
    return [...list].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [tiers, showArchived, statusFilter])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setSaveError(null)
    setShowModal(true)
  }

  const openEdit = (tier: PlatformPricingTier) => {
    setEditing(tier)
    setForm({
      name: tier.name,
      code: tier.code,
      description: tier.description ?? "",
      minParticipants: String(tier.minParticipants),
      maxParticipants: String(tier.maxParticipants),
      price: String(tier.price),
      isFree: tier.isFree,
      isActive: tier.isActive,
      sortOrder: String(tier.sortOrder),
      effectiveFrom: tier.effectiveFrom ? tier.effectiveFrom.slice(0, 10) : "",
    })
    setSaveError(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      min_participants: Number(form.minParticipants),
      max_participants: Number(form.maxParticipants),
      price: Number(form.price),
      is_free: form.isFree,
      is_active: form.isActive,
      sort_order: form.sortOrder ? Number(form.sortOrder) : undefined,
      effective_from: form.effectiveFrom || null,
    }
    try {
      if (editing) {
        await platformService.updatePricingTier(editing.uuid, payload)
      } else {
        await platformService.createPricingTier(payload)
      }
      setShowModal(false)
      load()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save tier.")
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (tier: PlatformPricingTier) => {
    setActionError(null)
    setTiers((prev) => prev.map((t) => (t.uuid === tier.uuid ? { ...t, isActive: !t.isActive } : t)))
    try {
      await platformService.togglePricingTier(tier.uuid, !tier.isActive)
    } catch (err) {
      setTiers((prev) => prev.map((t) => (t.uuid === tier.uuid ? { ...t, isActive: tier.isActive } : t)))
      setActionError(err instanceof Error ? err.message : "Failed to update pricing tier.")
    }
  }

  const handleArchive = async () => {
    if (!archiveTarget) return
    setActionError(null)
    try {
      await platformService.archivePricingTier(archiveTarget.uuid)
      setTiers((prev) => prev.map((t) => (t.uuid === archiveTarget.uuid ? { ...t, archivedAt: new Date().toISOString() } : t)))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to archive pricing tier.")
    }
    setArchiveTarget(null)
  }

  const handleRestore = async (tier: PlatformPricingTier) => {
    setActionError(null)
    setTiers((prev) => prev.map((t) => (t.uuid === tier.uuid ? { ...t, archivedAt: null } : t)))
    try {
      await platformService.restorePricingTier(tier.uuid)
    } catch (err) {
      setTiers((prev) => prev.map((t) => (t.uuid === tier.uuid ? { ...t, archivedAt: tier.archivedAt } : t)))
      setActionError(err instanceof Error ? err.message : "Failed to restore pricing tier.")
    }
  }

  const inputCls = "w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold placeholder:text-brand-text-disabled"
  const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1"

  return (
    <>
      <SeoHead meta={{ title: "Pricing Tiers — Platform | ORIVIS", noindex: true }} />
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Pricing Tiers" }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-brand-text-primary">Pricing Tiers</h1>
            <p className="text-sm text-brand-text-muted mt-1">Per event participant capacity brackets and prices.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="flex items-center gap-2 bg-brand-surface border border-brand-border hover:border-brand-gold/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
              <RefreshCw size={14} /> Refresh
            </button>
            {canManage && (
              <button onClick={openCreate} className="flex items-center gap-2 bg-brand-gold text-brand-black px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-gold-hover transition-all cursor-pointer">
                <Plus size={14} /> New Tier
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          <select name="status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} aria-label="Status filter"
            className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-[10px] font-mono text-brand-text-primary focus:outline-none focus:border-brand-gold cursor-pointer">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <label className="flex items-center gap-2 text-[10px] font-bold text-brand-text-muted cursor-pointer">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-brand-gold" />
            Show archived
          </label>
        </div>

        {actionError && (
          <div role="alert" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-status-error/10 border border-status-error/20 text-[10px] font-mono text-status-error">
            <AlertTriangle size={12} />
            <span className="flex-1">{actionError}</span>
            <button onClick={() => setActionError(null)} className="p-0.5 rounded hover:bg-black/5 cursor-pointer" aria-label="Dismiss"><X size={12} /></button>
          </div>
        )}

        {loading ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-16 border-b border-brand-border last:border-0 flex items-center gap-4 px-4">
                <div className="w-10 h-10 rounded-lg bg-brand-surface-elevated animate-pulse" />
                <div className="flex-1 h-3 bg-brand-surface-elevated animate-pulse rounded" />
                <div className="w-24 h-3 bg-brand-surface-elevated animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <AlertTriangle size={32} className="text-status-error mb-3" />
            <p className="text-brand-text-primary font-semibold">Failed to load pricing tiers</p>
            <p className="text-sm text-brand-text-muted mt-1">{error}</p>
            <button onClick={load} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : visibleTiers.length === 0 ? (
          <EmptyState icon={Inbox} title="No pricing tiers found" description="Create a tier to begin collecting per event payments." />
        ) : (
          <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
            {visibleTiers.map((tier) => (
              <div key={tier.uuid} className="flex flex-col md:flex-row md:items-center gap-3 px-4 py-3 border-b border-brand-border last:border-0 hover:bg-brand-surface-elevated/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-surface-elevated flex items-center justify-center shrink-0">
                    <Tag size={16} className={tier.isFree ? "text-status-success" : "text-brand-gold"} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-brand-text-primary truncate">{tier.name}</p>
                      <span className="text-[9px] font-mono uppercase text-brand-text-muted bg-brand-surface-elevated px-1.5 py-0.5 rounded">{tier.code}</span>
                      {tier.isFree && <span className="text-[9px] font-mono uppercase text-status-success bg-status-success/10 px-1.5 py-0.5 rounded">free</span>}
                      {tier.archivedAt && <span className="text-[9px] font-mono uppercase text-brand-text-muted bg-brand-surface-elevated px-1.5 py-0.5 rounded">archived</span>}
                    </div>
                    <p className="text-[11px] text-brand-text-muted truncate mt-0.5">
                      {formatRange(tier)} participants · {formatMoney(tier.price, tier.currency)}
                      {tier.effectiveFrom ? ` · effective ${tier.effectiveFrom.slice(0, 10)}` : ""}
                    </p>
                  </div>
                </div>
                {tier.description && (
                  <p className="text-[10px] text-brand-text-muted md:max-w-[220px] truncate">{tier.description}</p>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(tier)}
                    disabled={!canManage}
                    aria-label={tier.isActive ? "Deactivate tier" : "Activate tier"}
                    className="flex items-center gap-1.5 bg-brand-surface border border-brand-border rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-brand-text-muted hover:border-brand-gold/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {tier.isActive ? <ToggleRight size={14} className="text-status-success" /> : <ToggleLeft size={14} />}
                    {tier.isActive ? "Active" : "Inactive"}
                  </button>
                  {canManage && !tier.archivedAt && (
                    <>
                      <button onClick={() => openEdit(tier)} aria-label="Edit tier"
                        className="flex items-center gap-1.5 bg-brand-surface border border-brand-border rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-brand-text-muted hover:border-brand-gold/30 transition-colors cursor-pointer">
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => setArchiveTarget(tier)} aria-label="Archive tier"
                        className="flex items-center gap-1.5 bg-brand-surface border border-brand-border rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-status-error hover:border-status-error/40 transition-colors cursor-pointer">
                        <Archive size={12} /> Archive
                      </button>
                    </>
                  )}
                  {canManage && tier.archivedAt && (
                    <button onClick={() => handleRestore(tier)} aria-label="Restore tier"
                      className="flex items-center gap-1.5 bg-brand-surface border border-brand-border rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-brand-text-muted hover:border-brand-gold/30 transition-colors cursor-pointer">
                      <RotateCcw size={12} /> Restore
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setShowModal(false)} />
            <div className="relative w-full max-w-lg bg-brand-surface border border-brand-border rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
                <h2 className="text-sm font-bold text-brand-text-primary">{editing ? "Edit Pricing Tier" : "New Pricing Tier"}</h2>
                <button onClick={() => !saving && setShowModal(false)} aria-label="Close" className="text-brand-text-muted hover:text-brand-text-primary cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {saveError && (
                  <div className="bg-status-error/10 border border-status-error/30 rounded-xl px-3 py-2 text-[11px] text-status-error">{saveError}</div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls}>Name</label>
                    <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Growth" />
                  </div>
                  <div>
                    <label className={labelCls}>Code</label>
                    <input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="GROWTH" disabled={!!editing} />
                  </div>
                  <div>
                    <label className={labelCls}>Sort Order</label>
                    <input className={inputCls} type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} placeholder="10" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Min Participants</label>
                    <input className={inputCls} type="number" value={form.minParticipants} onChange={(e) => setForm({ ...form, minParticipants: e.target.value })} placeholder="20001" />
                  </div>
                  <div>
                    <label className={labelCls}>Max Participants</label>
                    <input className={inputCls} type="number" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })} placeholder="50000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Price</label>
                    <input className={inputCls} type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="45000" />
                  </div>
                  <div>
                    <label className={labelCls}>Effective From</label>
                    <input className={inputCls} type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-brand-text-primary cursor-pointer">
                    <input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked })} className="accent-brand-gold" />
                    Free tier (no charge)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-brand-text-primary cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-brand-gold" />
                    Active
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-brand-border">
                <button onClick={() => setShowModal(false)} disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer disabled:opacity-40">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 bg-brand-gold text-brand-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-gold-hover transition-all cursor-pointer disabled:opacity-50">
                  {saving ? "Saving…" : editing ? "Save Changes" : "Create Tier"}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!archiveTarget}
          onConfirm={handleArchive}
          onClose={() => setArchiveTarget(null)}
          title="Archive pricing tier"
          message={`Archive "${archiveTarget?.name}"? It will no longer be selectable for new events.`}
          confirmLabel="Archive"
          confirmVariant="danger"
        />
      </div>
    </>
  )
}