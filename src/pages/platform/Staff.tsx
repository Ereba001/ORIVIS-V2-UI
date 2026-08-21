import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Plus, X, Mail, Calendar,
  Code, Building2, HeadphonesIcon,
  CreditCard, Lock, FileCheck, ShoppingCart,
  Megaphone, Settings2, Clock,
  User, Check, Sparkles, AlertTriangle, RefreshCw,
  MoreHorizontal, ShieldCheck, ShieldOff, Trash2, Send,
  Ban,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import PageHeader from "../../components/platform/PageHeader"
import SearchInput from "../../components/platform/SearchInput"
import TabNav from "../../components/platform/TabNav"
import StatusPill from "../../components/platform/StatusPill"
import EmptyState from "../../components/platform/EmptyState"
import ResponsiveTable, { ResponsiveColumn } from "../../components/platform/ResponsiveTable"
import ConfirmDialog from "../../components/platform/ConfirmDialog"
import { platformService } from "../../services/platform-service"
import type { PlatformStaff, PlatformRole, Permission, StaffDepartment, StaffRole } from "../../types/platform"

function relativeTime(iso: string): string {
  const now = Date.now()
  const date = new Date(iso).getTime()
  const diffSec = Math.floor((now - date) / 1000)
  if (diffSec < 60) return "Just now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 30) return `${diffDay}d ago`
  return new Date(iso).toLocaleDateString()
}

const DEPT_ICONS: Record<StaffDepartment, LucideIcon> = {
  ENGINEERING: Code,
  CUSTOMER_SUCCESS: HeadphonesIcon,
  TECHNICAL_SUPPORT: HeadphonesIcon,
  FINANCE: CreditCard,
  SECURITY: Lock,
  COMPLIANCE: FileCheck,
  SALES: ShoppingCart,
  MARKETING: Megaphone,
  OPERATIONS: Settings2,
}

const DEPT_LABELS: Record<StaffDepartment, string> = {
  ENGINEERING: "Engineering",
  CUSTOMER_SUCCESS: "Customer Success",
  TECHNICAL_SUPPORT: "Tech Support",
  FINANCE: "Finance",
  SECURITY: "Security",
  COMPLIANCE: "Compliance",
  SALES: "Sales",
  MARKETING: "Marketing",
  OPERATIONS: "Operations",
}

const ROLE_LABELS: Record<string, string> = {
  FOUNDER: "Founder",
  PLATFORM_ADMINISTRATOR: "Platform Admin",
  CUSTOMER_SUCCESS: "Customer Success",
  TECHNICAL_SUPPORT: "Tech Support",
  FINANCE: "Finance",
  SECURITY: "Security",
  COMPLIANCE: "Compliance",
  AUDITOR: "Auditor",
}

function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  ACTIVE: "success",
  INVITED: "warning",
  SUSPENDED: "danger",
  DEACTIVATED: "neutral",
}

const DEPARTMENTS: { value: StaffDepartment; label: string }[] = [
  { value: "ENGINEERING", label: "Engineering" },
  { value: "CUSTOMER_SUCCESS", label: "Customer Success" },
  { value: "TECHNICAL_SUPPORT", label: "Tech Support" },
  { value: "FINANCE", label: "Finance" },
  { value: "SECURITY", label: "Security" },
  { value: "COMPLIANCE", label: "Compliance" },
  { value: "SALES", label: "Sales" },
  { value: "MARKETING", label: "Marketing" },
  { value: "OPERATIONS", label: "Operations" },
]

const ROLES: { value: StaffRole; label: string }[] = [
  { value: "FOUNDER", label: "Founder" },
  { value: "PLATFORM_ADMINISTRATOR", label: "Platform Admin" },
  { value: "CUSTOMER_SUCCESS", label: "Customer Success" },
  { value: "TECHNICAL_SUPPORT", label: "Tech Support" },
  { value: "FINANCE", label: "Finance" },
  { value: "SECURITY", label: "Security" },
  { value: "COMPLIANCE", label: "Compliance" },
  { value: "AUDITOR", label: "Auditor" },
]

interface Invitation {
  id: string
  email: string
  role: string | null
  status: string
  expires_at: string | null
  created_at: string
}

function TableSkeleton() {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-brand-border">
            {["Staff Member", "Department", "Role", "Email", "Status", "Last Active"].map(h => (
              <th key={h} className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-brand-border last:border-0">
              {Array.from({ length: 6 }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <div className="h-4 bg-brand-surface-interactive rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

export default function PlatformStaff() {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("all")
  const [selectedStaff, setSelectedStaff] = useState<PlatformStaff | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", department: "ENGINEERING" as StaffDepartment, role: "CUSTOMER_SUCCESS" as StaffRole })
  const [staff, setStaff] = useState<PlatformStaff[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roles, setRoles] = useState<PlatformRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    variant: "danger" | "warning"
    onConfirm: () => void
  }>({ open: false, title: "", description: "", variant: "danger", onConfirm: () => {} })
  const [permissionBreakdown, setPermissionBreakdown] = useState<{
    role_permissions: string[]
    granted: string[]
    revoked: string[]
    effective: string[]
  } | null>(null)
  const [showRoleChange, setShowRoleChange] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState("")
  const [showAddPermission, setShowAddPermission] = useState(false)
  const [addPermKey, setAddPermKey] = useState("")

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      platformService.getStaff(),
      platformService.getPermissions(),
      platformService.getStaffInvitations(),
      platformService.getRoles(),
    ])
      .then(([staffRes, perms, invits, rolesRes]) => {
        setStaff(staffRes.items)
        setPermissions(perms)
        setInvitations(invits)
        setRoles(rolesRes)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load staff.')
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
  }, [])

  // Load permission breakdown when a staff member is selected
  useEffect(() => {
    if (!selectedStaff) {
      setPermissionBreakdown(null)
      return
    }
    let cancelled = false
    platformService.getStaffPermissionBreakdown(selectedStaff.id)
      .then((bd) => { if (!cancelled) setPermissionBreakdown(bd) })
      .catch(() => { if (!cancelled) setPermissionBreakdown(null) })
    return () => { cancelled = true }
  }, [selectedStaff?.id])

  const counts = useMemo(() => ({
    all: staff.length,
    active: staff.filter(s => s.status === "ACTIVE").length,
    invited: invitations.filter(i => i.status === "pending").length,
    suspended: staff.filter(s => s.status === "SUSPENDED").length,
  }), [staff, invitations])

  const filtered = useMemo(() => {
    let result = staff
    if (tab !== "all") {
      result = result.filter(s => s.status.toLowerCase() === tab)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        DEPT_LABELS[s.department].toLowerCase().includes(q)
      )
    }
    return result
  }, [search, tab, staff])

  const filteredInvitations = useMemo(() => {
    if (search) {
      const q = search.toLowerCase()
      return invitations.filter(i => i.email.toLowerCase().includes(q))
    }
    return invitations
  }, [search, invitations])

  const handleInvite = async () => {
    setInviteError(null)
    try {
      const selectedRole = roles.find(r => r.name === inviteForm.role)
      await platformService.inviteStaff({
        name: inviteForm.name,
        email: inviteForm.email,
        role_id: selectedRole?.id,
        department: inviteForm.department,
      })
      setInviteSuccess(true)
      load()
      showToast("success", `Invitation sent to ${inviteForm.email}.`)
      setTimeout(() => {
        setShowInvite(false)
        setInviteSuccess(false)
        setInviteForm({ name: "", email: "", department: "ENGINEERING", role: "CUSTOMER_SUCCESS" })
      }, 1500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send the invitation. Please try again."
      if (msg.includes("already exists") || msg.includes("pending invitation")) {
        showToast("error", "A pending invitation already exists for this email.")
      } else {
        setInviteError(msg)
      }
    }
  }

  const handleToggleStatus = (s: PlatformStaff) => {
    const newStatus = s.status === "ACTIVE" ? "inactive" : "active"
    const label = newStatus === "active" ? "Activate" : "Deactivate"
    setConfirmDialog({
      open: true,
      title: `${label} Staff Member`,
      description: `Are you sure you want to ${label.toLowerCase()} ${s.name}? ${newStatus === "inactive" ? "They will lose access to the platform console." : "They will regain access to the platform console."}`,
      variant: newStatus === "inactive" ? "warning" : "danger",
      onConfirm: () => {
        setActionLoading(s.id)
        platformService.setStaffStatus(s.id, newStatus)
          .then(() => {
            showToast("success", `${s.name} has been ${newStatus === "active" ? "activated" : "deactivated"}.`)
            load()
            if (selectedStaff?.id === s.id) setSelectedStaff(null)
          })
          .catch((err) => {
            showToast("error", err instanceof Error ? err.message : `Failed to ${label.toLowerCase()} staff member.`)
          })
          .finally(() => setActionLoading(null))
      },
    })
  }

  const handleRemove = (s: PlatformStaff) => {
    setConfirmDialog({
      open: true,
      title: "Remove Staff Member",
      description: `Are you sure you want to remove ${s.name} from the platform team? This action cannot be undone. They will lose all platform staff access.`,
      variant: "danger",
      onConfirm: () => {
        setActionLoading(s.id)
        platformService.deleteStaff(s.id)
          .then(() => {
            showToast("success", `${s.name} has been removed from the platform team.`)
            load()
            setSelectedStaff(null)
          })
          .catch((err) => {
            showToast("error", err instanceof Error ? err.message : "Failed to remove staff member.")
          })
          .finally(() => setActionLoading(null))
      },
    })
  }

  const handleSendPasswordReset = async (s: PlatformStaff) => {
    try {
      setActionLoading(s.id)
      await platformService.sendStaffPasswordReset(s.id)
      showToast("success", `Password reset link sent to ${s.email}.`)
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to send password reset link.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleResendInvitation = async (inv: Invitation) => {
    try {
      setActionLoading(inv.id)
      await platformService.resendStaffInvitation(inv.id)
      showToast("success", `Invitation resent to ${inv.email}.`)
      load()
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to resend invitation.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangeRole = async () => {
    if (!selectedStaff || !selectedRoleId) return
    try {
      setActionLoading(selectedStaff.id)
      await platformService.updateStaff(selectedStaff.id, { role_id: selectedRoleId })
      showToast("success", `Role updated for ${selectedStaff.name}.`)
      setShowRoleChange(false)
      load()
      setSelectedStaff(null)
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to update role.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleGrantPermission = async () => {
    if (!selectedStaff || !addPermKey) return
    try {
      setActionLoading(selectedStaff.id)
      await platformService.grantStaffPermission(selectedStaff.id, addPermKey)
      showToast("success", "Permission granted.")
      setShowAddPermission(false)
      setAddPermKey("")
      // Refresh breakdown
      const bd = await platformService.getStaffPermissionBreakdown(selectedStaff.id)
      setPermissionBreakdown(bd)
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to grant permission.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemovePermissionOverride = async (permKey: string) => {
    if (!selectedStaff) return
    try {
      setActionLoading(selectedStaff.id)
      await platformService.removeStaffPermissionOverride(selectedStaff.id, permKey)
      showToast("success", "Override removed. Permission reverted to role default.")
      const bd = await platformService.getStaffPermissionBreakdown(selectedStaff.id)
      setPermissionBreakdown(bd)
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to remove override.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevokeInvitation = (inv: Invitation) => {
    setConfirmDialog({
      open: true,
      title: "Revoke Invitation",
      description: `Are you sure you want to revoke the invitation sent to ${inv.email}? They will no longer be able to accept it.`,
      variant: "danger",
      onConfirm: () => {
        setActionLoading(inv.id)
        platformService.revokeStaffInvitation(inv.id)
          .then(() => {
            showToast("success", `Invitation to ${inv.email} has been revoked.`)
            load()
          })
          .catch((err) => {
            showToast("error", err instanceof Error ? err.message : "Failed to revoke invitation.")
          })
          .finally(() => setActionLoading(null))
      },
    })
  }

  return (
    <div className="space-y-6">
      <SeoHead meta={{ title: "Staff Management — Platform | ORIVIS", noindex: true }} />
      <Breadcrumbs items={[{ label: "Staff" }]} />

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

      <PageHeader
        title="Staff Management"
        description="Manage internal platform team members."
        actions={
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Invite Staff</span>
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-full sm:w-56">
          <SearchInput value={search} onChange={setSearch} placeholder="Search staff..." />
        </div>
        <TabNav
          tabs={[
            { id: "all", label: "All", count: counts.all },
            { id: "active", label: "Active", count: counts.active },
            { id: "invited", label: "Invited", count: counts.invited },
            { id: "suspended", label: "Suspended", count: counts.suspended },
          ]}
          activeTab={tab}
          onChange={setTab}
        />
      </div>

      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={32} className="text-status-error mb-3" />
          <p className="text-brand-text-primary font-semibold">Failed to load staff</p>
          <p className="text-sm text-brand-text-muted mt-1">{error}</p>
          <button onClick={load} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : tab === "invited" ? (
        filteredInvitations.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No pending invitations"
            description={search ? "Try a different search term." : "No pending invitations to display."}
          />
        ) : (
          <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
            <ResponsiveTable
              columns={[
                {
                  key: "email",
                  label: "Email",
                  mobileOrder: 1,
                  render: (inv: Invitation) => (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-surface-elevated flex items-center justify-center">
                        <Mail size={14} className="text-brand-text-muted" />
                      </div>
                      <span className="text-xs font-semibold text-brand-text-primary">{inv.email}</span>
                    </div>
                  ),
                },
                {
                  key: "role",
                  label: "Role",
                  mobileOrder: 2,
                  render: (inv: Invitation) => (
                    <span className="text-xs text-brand-text-muted">{inv.role ?? "—"}</span>
                  ),
                },
                {
                  key: "status",
                  label: "Status",
                  mobileOrder: 3,
                  render: (inv: Invitation) => (
                    <StatusPill status={inv.status} variant={inv.status === "pending" ? "warning" : "neutral"} />
                  ),
                },
                {
                  key: "expires_at",
                  label: "Expires",
                  mobileOrder: 4,
                  render: (inv: Invitation) => (
                    <span className="text-[10px] font-mono text-brand-text-muted">
                      {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : "—"}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  label: "",
                  mobileOrder: 5,
                  render: (inv: Invitation) => (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleResendInvitation(inv) }}
                        disabled={actionLoading === inv.id}
                        className="p-1.5 rounded-lg hover:bg-status-success/10 text-status-success transition-colors cursor-pointer disabled:opacity-50"
                        title="Resend invitation"
                      >
                        <Send size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRevokeInvitation(inv) }}
                        disabled={actionLoading === inv.id}
                        className="p-1.5 rounded-lg hover:bg-status-error/10 text-status-error transition-colors cursor-pointer disabled:opacity-50"
                        title="Revoke invitation"
                      >
                        <Ban size={13} />
                      </button>
                    </div>
                  ),
                },
              ] as ResponsiveColumn<Invitation>[]}
              data={filteredInvitations}
              keyExtractor={(inv) => inv.id}
            />
          </div>
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={User}
          title="No staff found"
          description={search ? "Try a different search term." : "No team members in this category."}
        />
      ) : (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          <ResponsiveTable
            columns={[
              {
                key: "name",
                label: "Staff Member",
                mobileOrder: 1,
                render: (s: PlatformStaff) => (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-surface-elevated flex items-center justify-center text-xs font-bold text-brand-text-primary uppercase">
                      {s.avatarUrl ? (
                        <img src={s.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        s.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)
                      )}
                    </div>
                    <span className="text-xs font-semibold text-brand-text-primary">{s.name}</span>
                  </div>
                ),
              },
              {
                key: "department",
                label: "Department",
                mobileOrder: 3,
                render: (s: PlatformStaff) => {
                  const DeptIcon = DEPT_ICONS[s.department]
                  return (
                    <div className="flex items-center gap-2">
                      <DeptIcon size={12} className="text-brand-text-muted" />
                      <span className="text-xs text-brand-text-muted">{DEPT_LABELS[s.department]}</span>
                    </div>
                  )
                },
              },
              {
                key: "role",
                label: "Role",
                mobileOrder: 4,
                render: (s: PlatformStaff) => (
                  <span className="text-xs font-semibold text-brand-text-primary">{getRoleLabel(s.role)}</span>
                ),
              },
              {
                key: "email",
                label: "Email",
                mobileOrder: 2,
                render: (s: PlatformStaff) => (
                  <span className="text-xs text-brand-text-muted">{s.email}</span>
                ),
              },
              {
                key: "status",
                label: "Status",
                mobileOrder: 5,
                render: (s: PlatformStaff) => (
                  <StatusPill status={s.status} variant={STATUS_VARIANT[s.status]} />
                ),
              },
              {
                key: "lastActive",
                label: "Last Active",
                mobileOrder: 6,
                render: (s: PlatformStaff) => (
                  <div className="flex items-center gap-1.5 text-xs text-brand-text-muted">
                    <Clock size={11} />
                    {relativeTime(s.lastActive)}
                  </div>
                ),
              },
              {
                key: "actions",
                label: "",
                mobileOrder: 7,
                render: (s: PlatformStaff) => (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedStaff(s)}
                      className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted transition-colors cursor-pointer"
                      title="View details"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                ),
              },
            ] as ResponsiveColumn<PlatformStaff>[]}
            data={filtered}
            keyExtractor={(s) => s.id}
            onRowClick={(s) => setSelectedStaff(s)}
          />
        </div>
      )}

      {/* Staff Detail Slide-over */}
      <AnimatePresence>
        {selectedStaff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedStaff(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-brand-surface border-l border-brand-border overflow-y-auto"
            >
              <div className="sticky top-0 bg-brand-surface border-b border-brand-border p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-surface-elevated flex items-center justify-center text-sm font-bold text-brand-text-primary uppercase">
                    {selectedStaff.avatarUrl ? (
                      <img src={selectedStaff.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      selectedStaff.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-brand-text-primary">{selectedStaff.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-semibold text-brand-gold uppercase tracking-wider">{getRoleLabel(selectedStaff.role)}</span>
                      <StatusPill status={selectedStaff.status} variant={STATUS_VARIANT[selectedStaff.status]} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="p-2 rounded-xl hover:bg-brand-surface-interactive text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-3">Personal Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs">
                      <Mail size={14} className="text-brand-text-muted shrink-0" />
                      <span className="text-brand-text-primary">{selectedStaff.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Building2 size={14} className="text-brand-text-muted shrink-0" />
                      <span className="text-brand-text-primary">{DEPT_LABELS[selectedStaff.department]}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Calendar size={14} className="text-brand-text-muted shrink-0" />
                      <span className="text-brand-text-primary">Joined {new Date(selectedStaff.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">Permissions (Role + Staff Overrides)</h3>
                    <button
                      onClick={() => setShowAddPermission(!showAddPermission)}
                      className="text-[9px] font-mono uppercase tracking-wider text-brand-gold hover:text-brand-gold-hover transition-colors cursor-pointer"
                    >
                      {showAddPermission ? "Cancel" : "+ Grant"}
                    </button>
                  </div>

                  {showAddPermission && (
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-xl bg-brand-bg-secondary/30 border border-brand-border">
                      <select
                        value={addPermKey}
                        onChange={e => setAddPermKey(e.target.value)}
                        className="flex-1 bg-brand-bg-secondary/50 border border-brand-border rounded-lg px-2.5 py-1.5 text-[10px] text-brand-text-primary focus:outline-none focus:border-brand-gold"
                      >
                        <option value="">Select permission...</option>
                        {permissions
                          .filter(p => !permissionBreakdown?.effective.includes(p.key))
                          .map(p => (
                            <option key={p.id} value={p.key}>{p.label} ({p.key})</option>
                          ))}
                      </select>
                      <button
                        onClick={handleGrantPermission}
                        disabled={!addPermKey || actionLoading === selectedStaff.id}
                        className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider bg-status-success text-white rounded-lg hover:bg-status-success/80 transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        Grant
                      </button>
                    </div>
                  )}

                  {permissionBreakdown ? (
                    <div className="space-y-3">
                      {permissionBreakdown.granted.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-status-success mb-1.5">Individually Granted</p>
                          <div className="flex flex-wrap gap-1.5">
                            {permissionBreakdown.granted.map(key => {
                              const perm = permissions.find(p => p.key === key)
                              return (
                                <span key={key} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-status-success/10 text-status-success border border-status-success/20 font-medium">
                                  {perm?.label ?? key}
                                  <button
                                    onClick={() => handleRemovePermissionOverride(key)}
                                    disabled={actionLoading === selectedStaff.id}
                                    className="ml-0.5 text-status-success/60 hover:text-status-error transition-colors cursor-pointer"
                                    title="Remove override (revert to role default)"
                                  >
                                    <X size={10} />
                                  </button>
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {permissionBreakdown.revoked.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-status-error mb-1.5">Individually Revoked</p>
                          <div className="flex flex-wrap gap-1.5">
                            {permissionBreakdown.revoked.map(key => {
                              const perm = permissions.find(p => p.key === key)
                              return (
                                <span key={key} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-status-error/10 text-status-error border border-status-error/20 font-medium line-through">
                                  {perm?.label ?? key}
                                  <button
                                    onClick={() => handleRemovePermissionOverride(key)}
                                    disabled={actionLoading === selectedStaff.id}
                                    className="ml-0.5 text-status-error/60 hover:text-status-error transition-colors cursor-pointer"
                                    title="Remove override (revert to role default)"
                                  >
                                    <X size={10} />
                                  </button>
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5">Effective Permissions ({permissionBreakdown.effective.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {permissionBreakdown.effective.slice(0, 20).map((key: string) => {
                            const perm = permissions.find(p => p.key === key)
                            const isFromGrant = permissionBreakdown.granted.includes(key)
                            return (
                              <span key={key} className={`text-[10px] px-2 py-1 rounded-lg font-medium ${
                                isFromGrant
                                  ? "bg-status-success/10 text-status-success border border-status-success/20"
                                  : "bg-brand-surface-interactive text-brand-text-secondary"
                              }`}>
                                {perm?.label ?? key}
                              </span>
                            )
                          })}
                          {permissionBreakdown.effective.length > 20 && (
                            <span className="text-[10px] px-2 py-1 text-brand-text-muted">+{permissionBreakdown.effective.length - 20} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {permissions.filter(p => selectedStaff.permissions.includes(p.key)).map(perm => (
                        <span key={perm.id} className="text-[10px] px-2 py-1 rounded-lg bg-brand-surface-interactive text-brand-text-secondary font-medium">
                          {perm.label}
                        </span>
                      ))}
                      {permissions.filter(p => selectedStaff.permissions.includes(p.key)).length === 0 && (
                        <span className="text-xs text-brand-text-muted">No permissions assigned.</span>
                      )}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-3">Login Activity</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs">
                      <Clock size={14} className="text-status-success shrink-0" />
                      <span className="text-brand-text-primary">Last active {relativeTime(selectedStaff.lastActive)}</span>
                    </div>
                  </div>
                </section>

                {/* Management Actions */}
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-3">Management Actions</h3>
                  <div className="space-y-2">
                    {/* Change Role */}
                    <div>
                      {!showRoleChange ? (
                        <button
                          onClick={() => {
                            setShowRoleChange(true)
                            setSelectedRoleId(roles.find(r => r.name === selectedStaff.role)?.id ?? "")
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-brand-border hover:bg-brand-surface-interactive text-xs text-brand-text-secondary transition-colors cursor-pointer"
                        >
                          <ShieldCheck size={14} className="text-brand-text-muted" />
                          Change Role
                        </button>
                      ) : (
                        <div className="p-3 rounded-xl border border-brand-border bg-brand-bg-secondary/30 space-y-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-brand-text-muted">Select New Role</p>
                          <select
                            value={selectedRoleId}
                            onChange={e => setSelectedRoleId(e.target.value)}
                            className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-lg px-2.5 py-2 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold"
                          >
                            {roles.map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowRoleChange(false)}
                              className="flex-1 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary bg-brand-surface-interactive rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleChangeRole}
                              disabled={!selectedRoleId || actionLoading === selectedStaff.id}
                              className="flex-1 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider bg-brand-gold text-brand-bg-secondary rounded-lg hover:bg-brand-gold-hover transition-colors disabled:opacity-40 cursor-pointer"
                            >
                              Save Role
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleSendPasswordReset(selectedStaff)}
                      disabled={actionLoading === selectedStaff.id}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-brand-border hover:bg-brand-surface-interactive text-xs text-brand-text-secondary transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Mail size={14} className="text-brand-text-muted" />
                      Send Password Reset Link
                    </button>

                    {selectedStaff.status === "ACTIVE" ? (
                      <button
                        onClick={() => handleToggleStatus(selectedStaff)}
                        disabled={actionLoading === selectedStaff.id}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-status-warning/30 hover:bg-status-warning/5 text-xs text-status-warning transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <ShieldOff size={14} />
                        Deactivate Account
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(selectedStaff)}
                        disabled={actionLoading === selectedStaff.id}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-status-success/30 hover:bg-status-success/5 text-xs text-status-success transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <ShieldCheck size={14} />
                        Activate Account
                      </button>
                    )}

                    <button
                      onClick={() => handleRemove(selectedStaff)}
                      disabled={actionLoading === selectedStaff.id}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-status-error/30 hover:bg-status-error/5 text-xs text-status-error transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Remove from Team
                    </button>
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !inviteSuccess && setShowInvite(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              className="glass-strong rounded-2xl p-6 w-full max-w-md shadow-brand-lg"
            >
              {inviteSuccess ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-2xl bg-status-success/10 flex items-center justify-center mx-auto mb-4">
                    <Check size={24} className="text-status-success" />
                  </div>
                  <h3 className="text-sm font-bold text-brand-text-primary mb-1">Invitation Sent</h3>
                  <p className="text-xs text-brand-text-muted">An invitation email has been sent to {inviteForm.email}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-gold/10 flex items-center justify-center">
                        <Sparkles size={18} className="text-brand-gold" />
                      </div>
                      <h3 className="text-sm font-bold text-brand-text-primary">Invite Staff Member</h3>
                    </div>
                    <button
                      onClick={() => setShowInvite(false)}
                      className="text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="inviteFullName" className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5">Full Name</label>
                      <input
                        name="fullName"
                        id="inviteFullName"
                        value={inviteForm.name}
                        onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Enter the staff member's full name"
                        className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="inviteEmail" className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5">Email Address</label>
                      <input
                        name="email"
                        id="inviteEmail"
                        value={inviteForm.email}
                        onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="Enter their work email address"
                        type="email"
                        className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="inviteDepartment" className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5">Department</label>
                      <select
                        name="department"
                        id="inviteDepartment"
                        value={inviteForm.department}
                        onChange={e => setInviteForm(f => ({ ...f, department: e.target.value as StaffDepartment }))}
                        className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all appearance-none cursor-pointer"
                      >
                        {DEPARTMENTS.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="inviteRole" className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5">Role</label>
                      <select
                        name="role"
                        id="inviteRole"
                        value={inviteForm.role}
                        onChange={e => setInviteForm(f => ({ ...f, role: e.target.value as StaffRole }))}
                        className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all appearance-none cursor-pointer"
                      >
                        {ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {inviteError && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-status-error/10 border border-status-error/20 px-3 py-2 text-xs text-status-error">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{inviteError}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 justify-end mt-6">
                    <button
                      onClick={() => setShowInvite(false)}
                      className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary bg-brand-surface-interactive rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInvite}
                      disabled={!inviteForm.name || !inviteForm.email}
                      className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider bg-brand-gold text-brand-bg-secondary rounded-xl hover:bg-brand-gold-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Send Invitation
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.description}
        confirmVariant={confirmDialog.variant === "danger" ? "danger" : "primary"}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(d => ({ ...d, open: false }))}
      />
    </div>
  )
}
