import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { User, Shield, Calendar, Activity, Clock, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Mail, ShieldCheck, ShieldOff, Check } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import { platformService } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"
import ConfirmDialog from "../../components/platform/ConfirmDialog"
import type { PlatformUser } from "../../types/platform"

export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useApiResource<PlatformUser | null>(() => platformService.getUser(id ?? ""), [id])
  const [resetSending, setResetSending] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    variant: "danger" | "warning"
    onConfirm: () => void
  }>({ open: false, title: "", description: "", variant: "danger", onConfirm: () => {} })

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleToggleStatus = () => {
    if (!user || !id) return
    const newStatus = user.status === "Active" ? "suspended" : "active"
    const label = newStatus === "active" ? "Activate" : "Suspend"
    setConfirmDialog({
      open: true,
      title: `${label} User`,
      description: `Are you sure you want to ${label.toLowerCase()} ${user.name}? ${newStatus === "suspended" ? "They will lose access to their account." : "They will regain access to their account."}`,
      variant: newStatus === "suspended" ? "danger" : "warning",
      onConfirm: () => {
        setActionLoading(true)
        platformService.setUserStatus(id, newStatus)
          .then(() => {
            showToast("success", `${user!.name} has been ${newStatus === "active" ? "activated" : "suspended"}.`)
            reload()
          })
          .catch((err) => {
            showToast("error", err instanceof Error ? err.message : `Failed to ${label.toLowerCase()} user.`)
          })
          .finally(() => setActionLoading(false))
      },
    })
  }

  const user = data ?? null

  const handleSendResetPassword = async () => {
    if (!id) return
    setResetSending(true)
    setResetError("")
    setResetSent(false)
    try {
      await platformService.sendPasswordReset(id)
      setResetSent(true)
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to send reset link.")
    } finally {
      setResetSending(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Staff", href: "/platform/staff" }, { label: "Detail" }]} />
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-surface-elevated animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-64 bg-brand-surface-elevated animate-pulse rounded" />
              <div className="h-3 w-48 bg-brand-surface-elevated animate-pulse rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-brand-surface-elevated rounded-xl p-4 h-24 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Staff", href: "/platform/staff" }, { label: "Detail" }]} />
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={32} className="text-status-error mb-3" />
          <p className="text-brand-text-primary font-semibold">Failed to load user</p>
          <p className="text-sm text-brand-text-muted mt-1">{error ?? "User not found."}</p>
          <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
    {/* Toast */}
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 z-[300] flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg ${
            toast.type === "success"
              ? "bg-status-success text-white"
              : "bg-status-error text-white"
          }`}
        >
          {toast.type === "success" ? <Check size={14} /> : <AlertTriangle size={14} />}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>

    <SeoHead meta={{ title: "User Details — Platform | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Staff", href: "/platform/staff" }, { label: "Detail" }]} />
      <button onClick={() => navigate("/platform/staff")}
        className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer">
        <span>Back</span>
      </button>

      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-surface-elevated flex items-center justify-center">
            <User size={28} className="text-brand-gold" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-brand-text-primary">{user.name}</h1>
              <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                user.status === "Active" ? "bg-status-success/10 text-status-success" :
                user.status === "Suspended" ? "bg-status-error/10 text-status-error" :
                "bg-status-warning/10 text-status-warning"
              }`}>{user.status}</span>
            </div>
            <p className="text-xs text-brand-text-muted">{user.email}</p>
            <p className="text-[10px] font-mono text-brand-text-muted mt-2">ID: {id} &middot; {user.org}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Role", value: user.role, icon: Shield },
            { label: "Last Login", value: user.lastLogin, icon: Clock },
            { label: "Joined", value: user.joined, icon: Calendar },
            { label: "Lifecycle", value: user.lifecycleState, icon: Activity },
          ].map((stat) => (
            <div key={stat.label} className="bg-brand-surface-elevated rounded-xl p-4 text-center">
              <stat.icon size={16} className="mx-auto text-brand-gold mb-2" />
              <p className="text-lg font-bold font-mono text-brand-text-primary">{stat.value}</p>
              <p className="text-[10px] font-mono text-brand-text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-brand-surface-elevated rounded-xl p-4 space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">Security</h3>
            <div className="flex items-center justify-between text-xs">
              <span className="text-brand-text-muted">Email Verified</span>
              {user.emailVerified ? <CheckCircle2 size={14} className="text-status-success" /> : <XCircle size={14} className="text-status-error" />}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-brand-text-muted">MFA Enabled</span>
              {user.mfaEnabled ? <CheckCircle2 size={14} className="text-status-success" /> : <XCircle size={14} className="text-status-error" />}
            </div>
            <div className="pt-2 border-t border-brand-border">
              {resetSent ? (
                <div className="flex items-center gap-2 text-status-success text-[11px] font-semibold">
                  <CheckCircle2 size={14} />
                  Reset link sent to {user.email}
                </div>
              ) : (
                <>
                  <button
                    onClick={handleSendResetPassword}
                    disabled={resetSending}
                    className="flex items-center gap-2 text-[11px] font-semibold text-brand-gold hover:text-brand-gold-hover transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Mail size={14} />
                    {resetSending ? "Sending..." : "Send Password Reset Link"}
                  </button>
                  {resetError && (
                    <p className="text-[10px] text-status-error mt-1">{resetError}</p>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="bg-brand-surface-elevated rounded-xl p-4 space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">Account Actions</h3>
            <div className="space-y-2">
              {user.status === "Active" ? (
                <button
                  onClick={handleToggleStatus}
                  disabled={actionLoading}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-status-warning/30 hover:bg-status-warning/5 text-xs text-status-warning transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ShieldOff size={14} />
                  {actionLoading ? "Processing..." : "Suspend Account"}
                </button>
              ) : (
                <button
                  onClick={handleToggleStatus}
                  disabled={actionLoading}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-status-success/30 hover:bg-status-success/5 text-xs text-status-success transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck size={14} />
                  {actionLoading ? "Processing..." : "Activate Account"}
                </button>
              )}
            </div>
          </div>
          <div className="bg-brand-surface-elevated rounded-xl p-4">
            <h3 className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-3">Recent Activity</h3>
            {[
              { action: "Logged in from Lagos, Nigeria", time: "2h ago" },
              { action: "Created election 'Board of Directors'", time: "1d ago" },
              { action: "Updated organization branding", time: "3d ago" },
            ].map((act, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <Activity size={10} className="text-brand-text-muted" />
                <span className="text-xs text-brand-text-primary">{act.action}</span>
                <span className="text-[9px] font-mono text-brand-text-muted ml-auto">{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Confirm Dialog */}
    <ConfirmDialog
      open={confirmDialog.open}
      title={confirmDialog.title}
      message={confirmDialog.description}
      confirmVariant={confirmDialog.variant === "danger" ? "danger" : "primary"}
      onConfirm={confirmDialog.onConfirm}
      onClose={() => setConfirmDialog(d => ({ ...d, open: false }))}
    />
    </>
  )
}
