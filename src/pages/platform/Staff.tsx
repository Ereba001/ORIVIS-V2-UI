import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Plus, X, Mail, Calendar, Shield,
  Activity, Building2, Code, HeadphonesIcon,
  CreditCard, Lock, FileCheck, ShoppingCart,
  Megaphone, Settings2, Clock, LogIn,
  User, Check, Sparkles, AlertTriangle, RefreshCw,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import PageHeader from "../../components/platform/PageHeader"
import SearchInput from "../../components/platform/SearchInput"
import TabNav from "../../components/platform/TabNav"
import StatusPill from "../../components/platform/StatusPill"
import EmptyState from "../../components/platform/EmptyState"
import { platformService } from "../../services/platform-service"
import type { PlatformStaff, Permission, StaffDepartment, StaffRole } from "../../types/platform"

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

const ROLE_LABELS: Record<StaffRole, string> = {
  FOUNDER: "Founder",
  PLATFORM_ADMINISTRATOR: "Platform Admin",
  CUSTOMER_SUCCESS: "Customer Success",
  TECHNICAL_SUPPORT: "Tech Support",
  FINANCE: "Finance",
  SECURITY: "Security",
  COMPLIANCE: "Compliance",
  AUDITOR: "Auditor",
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  ACTIVE: "success",
  INVITED: "warning",
  SUSPENDED: "danger",
  DEACTIVATED: "neutral",
}

const MOCK_LOGIN_ACTIVITY: Record<string, { recent: string; location: string }> = {
  "staff-001": { recent: "Logged in 15 minutes ago", location: "Last login from Port Harcourt, NG" },
  "staff-002": { recent: "Logged in 2 hours ago", location: "Last login from Abuja, NG" },
  "staff-003": { recent: "Logged in 45 minutes ago", location: "Last login from Lagos, NG" },
  "staff-004": { recent: "Logged in 5 hours ago", location: "Last login from Enugu, NG" },
  "staff-005": { recent: "Logged in 1 hour ago", location: "Last login from Ibadan, NG" },
  "staff-006": { recent: "Logged in 10 minutes ago", location: "Last login from Lagos, NG" },
  "staff-007": { recent: "Never logged in", location: "Invitation pending" },
  "staff-008": { recent: "Logged in 3 hours ago", location: "Last login from Kano, NG" },
  "staff-009": { recent: "Logged in 5 minutes ago", location: "Last login from Abuja, NG" },
  "staff-010": { recent: "Logged in 1 day ago", location: "Last login from Calabar, NG" },
  "staff-011": { recent: "Logged in 3 days ago", location: "Last login from Jos, NG" },
  "staff-012": { recent: "Logged in 10 days ago", location: "Last login from Lagos, NG" },
}

const MOCK_RECENT_ACTIONS: Record<string, string[]> = {
  "staff-001": ["Updated platform configuration", "Deployed v2.4.0 to production", "Modified security policies"],
  "staff-002": ["Approved organization registration: Lagos State University", "Modified staff permissions", "Reviewed compliance report"],
  "staff-003": ["Assigned support tickets to team", "Escalated billing issue to finance", "Updated SLA documentation"],
  "staff-004": ["Resolved support ticket #1245", "Responded to live chat inquiry", "Added internal note on AfriTech account"],
  "staff-005": ["Handled voter bulk upload request", "Assisted with multi-session configuration", "Scheduled follow-up with LASU"],
  "staff-006": ["Resolved bulk upload timeout issue", "Assisted RSU with organization setup", "Documented FAQ update"],
  "staff-007": [],
  "staff-008": ["Processed refund for Greenpeace Africa", "Generated invoice INV-2026-0912", "Updated billing records for Access Bank"],
  "staff-009": ["Resolved security incident — brute force attempt", "Updated 2FA enforcement policy", "Reviewed access logs"],
  "staff-010": ["Performed compliance audit on Edo State Q1", "Rejected policy-violating event submission", "Submitted quarterly audit report"],
  "staff-011": ["Generated audit report for Finance", "Exported analytics for Global Tech", "Reviewed financial statements"],
  "staff-012": [],
}

const MOCK_ASSIGNED_ORGS: Record<string, string[]> = {
  "staff-001": ["All Organizations"],
  "staff-002": ["All Organizations"],
  "staff-003": ["Rivers State University", "Meranos Ltd.", "Lagos State University"],
  "staff-004": ["Rivers State University", "Global Tech Innovators", "Access Bank PLC"],
  "staff-005": ["Greenpeace Africa", "Edo State Government", "AfriTech Solutions"],
  "staff-006": ["Rivers State University", "Multilancer Ltd.", "TechBridge Academy"],
  "staff-007": [],
  "staff-008": ["Greenpeace Africa", "Access Bank PLC", "Meranos Ltd."],
  "staff-009": ["All Organizations"],
  "staff-010": ["Rivers State University", "Edo State Government", "Lagos State University"],
  "staff-011": ["Global Tech Innovators", "Kenya Revenue Authority"],
  "staff-012": [],
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

function TableSkeleton() {
  return (
    <>
    <SeoHead meta={{ title: "Staff — Platform | ORIVIS", noindex: true }} />
    <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
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
    </>
  )
}

export default function PlatformStaff() {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("all")
  const [selectedStaff, setSelectedStaff] = useState<PlatformStaff | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", department: "ENGINEERING" as StaffDepartment, role: "CUSTOMER_SUCCESS" as StaffRole })
  const [staff, setStaff] = useState<PlatformStaff[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([platformService.getStaff(), platformService.getPermissions()])
      .then(([staffRes, perms]) => {
        setStaff(staffRes.items)
        setPermissions(perms)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load staff.')
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(() => ({
    all: staff.length,
    active: staff.filter(s => s.status === "ACTIVE").length,
    invited: staff.filter(s => s.status === "INVITED").length,
    suspended: staff.filter(s => s.status === "SUSPENDED").length,
  }), [staff])

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

  const handleInvite = () => {
    setInviteSuccess(true)
    setTimeout(() => {
      setShowInvite(false)
      setInviteSuccess(false)
      setInviteForm({ name: "", email: "", department: "ENGINEERING", role: "CUSTOMER_SUCCESS" })
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Staff" }]} />

      <PageHeader
        title="Staff Management"
        description="Manage internal platform team members."
        actions={
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 bg-brand-gold hover:bg-[#e6b800] text-brand-bg-secondary px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Invite Staff</span>
          </button>
        }
      />

      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-56">
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
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={User}
          title="No staff found"
          description={search ? "Try a different search term." : "No team members in this category."}
        />
      ) : (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-border">
                {["Staff Member", "Department", "Role", "Email", "Status", "Last Active"].map(h => (
                  <th key={h} className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((staff) => {
                const DeptIcon = DEPT_ICONS[staff.department]
                return (
                  <motion.tr
                    key={staff.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-b border-brand-border last:border-0 hover:bg-brand-surface-interactive/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedStaff(staff)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-surface-elevated flex items-center justify-center text-xs font-bold text-brand-text-primary uppercase">
                          {staff.avatarUrl ? (
                            <img src={staff.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            staff.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                          )}
                        </div>
                        <span className="text-xs font-semibold text-brand-text-primary">{staff.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <DeptIcon size={12} className="text-brand-text-muted" />
                        <span className="text-xs text-brand-text-muted">{DEPT_LABELS[staff.department]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-brand-text-primary">{ROLE_LABELS[staff.role]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-text-muted">{staff.email}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={staff.status} variant={STATUS_VARIANT[staff.status]} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-brand-text-muted">
                        <Clock size={11} />
                        {relativeTime(staff.lastActive)}
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

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
                      <span className="text-[10px] font-semibold text-brand-gold uppercase tracking-wider">{ROLE_LABELS[selectedStaff.role]}</span>
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
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-3">Permissions</h3>
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
                </section>

                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-3">Login Activity</h3>
                  <div className="space-y-2">
                    {(() => {
                      const loginData = MOCK_LOGIN_ACTIVITY[selectedStaff.id]
                      if (!loginData) return null
                      return (
                        <>
                          <div className="flex items-center gap-3 text-xs">
                            <LogIn size={14} className="text-status-success shrink-0" />
                            <span className="text-brand-text-primary">{loginData.recent}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <Shield size={14} className="text-brand-text-muted shrink-0" />
                            <span className="text-brand-text-primary">{loginData.location}</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-3">Recent Actions</h3>
                  {MOCK_RECENT_ACTIONS[selectedStaff.id]?.length ? (
                    <div className="space-y-2">
                      {MOCK_RECENT_ACTIONS[selectedStaff.id].map((action, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <Activity size={14} className="text-brand-text-muted shrink-0" />
                          <span className="text-brand-text-primary">{action}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-brand-text-muted">No recent actions recorded.</p>
                  )}
                </section>

                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-3">Assigned Organizations</h3>
                  {MOCK_ASSIGNED_ORGS[selectedStaff.id]?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {MOCK_ASSIGNED_ORGS[selectedStaff.id].map((org, i) => (
                        <span key={i} className="text-[10px] px-2.5 py-1 rounded-lg bg-brand-surface-elevated border border-brand-border text-brand-text-secondary font-medium">
                          {org}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-brand-text-muted">No organizations assigned.</p>
                  )}
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5">Full Name</label>
                      <input
                        value={inviteForm.name}
                        onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Jane Doe"
                        className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5">Email Address</label>
                      <input
                        value={inviteForm.email}
                        onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="e.g. jane@orivis.io"
                        type="email"
                        className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5">Department</label>
                      <select
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
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5">Role</label>
                      <select
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
                      className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider bg-brand-gold text-brand-bg-secondary rounded-xl hover:bg-[#e6b800] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
    </div>
  )
}
