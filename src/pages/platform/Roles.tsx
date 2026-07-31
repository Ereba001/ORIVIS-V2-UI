import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Plus, X, Shield, Star, Copy, Archive, Trash2,
  Edit3, ChevronDown,
  Settings2, ScrollText, HeadphonesIcon,
  Fingerprint, BarChart3, CreditCard, Lock,
  SlidersHorizontal, RotateCcw, AlertTriangle, RefreshCw,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import PageHeader from "../../components/platform/PageHeader"
import TabNav from "../../components/platform/TabNav"
import EmptyState from "../../components/platform/EmptyState"
import ConfirmDialog from "../../components/platform/ConfirmDialog"
import { platformService } from "../../services/platform-service"
import type { PlatformRole, Permission, PermissionGroup } from "../../types/platform"

const GROUP_LABELS: Record<PermissionGroup, string> = {
  PLATFORM: "Platform",
  EVENTS: "Events",
  SUPPORT: "Support",
  AUDIT: "Audit",
  ANALYTICS: "Analytics",
  FINANCE: "Finance",
  SECURITY: "Security",
  SETTINGS: "Settings",
}

const GROUP_ICONS: Record<PermissionGroup, LucideIcon> = {
  PLATFORM: Settings2,
  EVENTS: ScrollText,
  SUPPORT: HeadphonesIcon,
  AUDIT: Fingerprint,
  ANALYTICS: BarChart3,
  FINANCE: CreditCard,
  SECURITY: Lock,
  SETTINGS: SlidersHorizontal,
}

const GROUP_ORDER: PermissionGroup[] = [
  "PLATFORM", "EVENTS", "SUPPORT", "AUDIT", "ANALYTICS", "FINANCE", "SECURITY", "SETTINGS",
]

interface PermissionMatrixProps {
  selectedKeys: string[]
  onChange?: (keys: string[]) => void
  allPermissions: Permission[]
}

function PermissionMatrix({ selectedKeys, onChange, allPermissions }: PermissionMatrixProps) {
  const selected = new Set(selectedKeys)
  const readonly = !onChange

  const permissionsByGroup = GROUP_ORDER.map(group => ({
    group,
    label: GROUP_LABELS[group],
    icon: GROUP_ICONS[group],
    permissions: allPermissions.filter(p => p.group === group),
  }))

  const toggle = (key: string) => {
    if (!onChange) return
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange(Array.from(next))
  }

  const allSelected = (perms: Permission[]) => perms.every(p => selected.has(p.key))

  const toggleGroup = (groupPerms: Permission[]) => {
    if (!onChange) return
    const allOn = allSelected(groupPerms)
    const next = new Set(selected)
    groupPerms.forEach(p => {
      if (allOn) next.delete(p.key)
      else next.add(p.key)
    })
    onChange(Array.from(next))
  }

  return (
    <div className="space-y-4">
      {permissionsByGroup.map(({ group, label, icon: Icon, permissions: perms }) => {
        const groupAllSelected = allSelected(perms)
        const groupSomeSelected = perms.some(p => selected.has(p.key)) && !groupAllSelected
        return (
          <div key={group} className="bg-brand-bg-secondary/30 rounded-xl border border-brand-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
              <div className="flex items-center gap-2.5">
                <Icon size={14} className="text-brand-text-muted" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-text-primary">{label}</span>
                <span className="text-[9px] font-mono text-brand-text-muted">{perms.length}</span>
              </div>
              {onChange && (
                <button
                  onClick={() => toggleGroup(perms)}
                  className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                    groupAllSelected
                      ? "bg-brand-gold/10 text-brand-gold border-brand-gold/20"
                      : groupSomeSelected
                      ? "bg-status-warning/10 text-status-warning border-status-warning/20"
                      : "bg-brand-surface-interactive text-brand-text-muted border-brand-border"
                  }`}
                >
                  {groupAllSelected ? "All On" : groupSomeSelected ? "Partial" : "All Off"}
                </button>
              )}
            </div>
            <div className="p-2 space-y-0.5">
              {perms.map(perm => {
                const isOn = selected.has(perm.key)
                return (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-brand-surface-interactive/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-5 rounded-full transition-colors relative flex-shrink-0 ${readonly ? "" : "cursor-pointer"} ${isOn ? "bg-brand-gold" : "bg-brand-surface-interactive"}`}
                        onClick={() => !readonly && toggle(perm.key)}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isOn ? "translate-x-3.5" : "translate-x-0.5"}`} />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-brand-text-primary">{perm.label}</span>
                        <p className="text-[9px] text-brand-text-muted mt-0.5">{perm.description}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-mono uppercase text-brand-text-disabled">{perm.key}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface RoleCardProps {
  role: PlatformRole
  onEdit?: (role: PlatformRole) => void
  onClone?: (role: PlatformRole) => void
  onArchive?: (role: PlatformRole) => void
  onUnarchive?: (role: PlatformRole) => void
  onDelete?: (role: PlatformRole) => void
  expanded?: boolean
  onToggleExpand?: () => void
  allPermissions: Permission[]
}

function RoleCard({ role, onEdit, onClone, onArchive, onUnarchive, onDelete, expanded, onToggleExpand, allPermissions }: RoleCardProps) {
  const isSystem = role.type === "SYSTEM"
  const isArchived = role.isArchived

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSystem ? "bg-brand-gold/10 text-brand-gold" : "bg-brand-surface-elevated text-brand-text-muted"}`}>
              {isSystem ? <Shield size={16} /> : <Star size={16} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-brand-text-primary">{role.name}</h3>
                {role.isProtected && (
                  <span className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-status-info/10 text-status-info border border-status-info/20">
                    Protected
                  </span>
                )}
                {isArchived && (
                  <span className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-surface-interactive text-brand-text-muted border border-brand-border">
                    Archived
                  </span>
                )}
              </div>
              <p className="text-[10px] text-brand-text-muted mt-0.5 line-clamp-1">{role.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="text-brand-text-muted">Staff</span>
            <span className="font-mono font-bold text-brand-text-primary">{role.staffCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-brand-text-muted">Permissions</span>
            <span className="font-mono font-bold text-brand-text-primary">{role.permissions.length}</span>
          </div>
          {!isSystem && (
            <div className="flex items-center gap-1.5">
              <span className="text-brand-text-muted">Updated</span>
              <span className="font-mono text-brand-text-muted">{new Date(role.updatedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {!isArchived && (
          <div className="flex items-center gap-1.5 mt-3">
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
            >
              <span>{expanded ? "Hide Permissions" : "View Permissions"}</span>
              <ChevronDown size={10} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}

        {!isArchived && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-brand-border">
            {onEdit && (
              <button
                onClick={() => onEdit(role)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-lg bg-brand-surface-interactive text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
              >
                <Edit3 size={10} />
                Edit
              </button>
            )}
            {onClone && (
              <button
                onClick={() => onClone(role)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-lg bg-brand-surface-interactive text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
              >
                <Copy size={10} />
                Clone
              </button>
            )}
            {onArchive && (
              <button
                onClick={() => onArchive(role)}
                disabled={role.isProtected}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-lg bg-brand-surface-interactive text-brand-text-muted hover:text-status-warning transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Archive size={10} />
                Archive
              </button>
            )}
            {onUnarchive && (
              <button
                onClick={() => onUnarchive(role)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-lg bg-brand-surface-interactive text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
              >
                <RotateCcw size={10} />
                Restore
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(role)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-lg bg-brand-surface-interactive text-status-error/60 hover:text-status-error transition-colors cursor-pointer"
              >
                <Trash2 size={10} />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-brand-border overflow-hidden"
          >
            <div className="p-4 bg-brand-bg-secondary/20">
              <PermissionMatrix selectedKeys={role.permissions} allPermissions={allPermissions} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface RoleFormData {
  name: string
  description: string
  permissions: string[]
}

function emptyForm(): RoleFormData {
  return { name: "", description: "", permissions: [] }
}

export default function PlatformRoles() {
  const [tab, setTab] = useState("system")
  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRole, setEditingRole] = useState<PlatformRole | null>(null)
  const [cloneSourceRole, setCloneSourceRole] = useState<PlatformRole | null>(null)
  const [roleForm, setRoleForm] = useState<RoleFormData>(emptyForm())
  const [showCloneDropdown, setShowCloneDropdown] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<PlatformRole | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PlatformRole | null>(null)
  const [roles, setRoles] = useState<PlatformRole[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([platformService.getRoles(), platformService.getPermissions()])
      .then(([roleRes, permRes]) => {
        setRoles(roleRes)
        setPermissions(permRes)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load roles.')
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const systemRoles = useMemo(() => roles.filter(r => r.type === "SYSTEM" && !r.isArchived), [roles])
  const customRoles = useMemo(() => roles.filter(r => r.type === "CUSTOM" && !r.isArchived), [roles])
  const archivedRoles = useMemo(() => roles.filter(r => r.isArchived), [roles])

  const handleCreateOrUpdate = () => {
    if (editingRole) {
      setRoles(prev => prev.map(r =>
        r.id === editingRole.id
          ? { ...r, name: roleForm.name, description: roleForm.description, permissions: roleForm.permissions, updatedAt: new Date().toISOString() }
          : r
      ))
    } else {
      const newRole: PlatformRole = {
        id: `role-cus-${Date.now()}`,
        name: roleForm.name,
        description: roleForm.description,
        type: "CUSTOM",
        isProtected: false,
        isArchived: false,
        permissions: roleForm.permissions,
        staffCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setRoles(prev => [...prev, newRole])
    }
    setShowCreateModal(false)
    setEditingRole(null)
    setCloneSourceRole(null)
    setRoleForm(emptyForm())
  }

  const openEdit = (role: PlatformRole) => {
    setEditingRole(role)
    setRoleForm({ name: role.name, description: role.description, permissions: [...role.permissions] })
    setShowCreateModal(true)
  }

  const openClone = (role: PlatformRole) => {
    setCloneSourceRole(role)
    setRoleForm({ name: `${role.name} (Copy)`, description: role.description, permissions: [...role.permissions] })
    setShowCreateModal(true)
  }

  const handleArchive = () => {
    if (!archiveTarget) return
    setRoles(prev => prev.map(r =>
      r.id === archiveTarget.id ? { ...r, isArchived: true } : r
    ))
    setArchiveTarget(null)
  }

  const handleUnarchive = (role: PlatformRole) => {
    setRoles(prev => prev.map(r =>
      r.id === role.id ? { ...r, isArchived: false } : r
    ))
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setRoles(prev => prev.filter(r => r.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <>
    <SeoHead meta={{ title: "Roles & Permissions — Platform | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Roles" }]} />

      <PageHeader
        title="Roles & Permissions"
        description="Control ORIVIS platform staff access."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingRole(null)
                setCloneSourceRole(null)
                setRoleForm(emptyForm())
                setShowCreateModal(true)
              }}
              className="flex items-center gap-2 bg-brand-gold hover:bg-[#e6b800] text-brand-bg-secondary px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Create Role</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowCloneDropdown(!showCloneDropdown)}
                className="flex items-center gap-2 bg-brand-surface-elevated border border-brand-border hover:bg-brand-surface-interactive text-brand-text-muted hover:text-brand-text-primary px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <Copy size={14} />
                <span>Clone Role</span>
                <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {showCloneDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 w-56 bg-brand-surface-elevated border border-brand-border rounded-xl shadow-lg z-10 overflow-hidden"
                  >
                    {customRoles.length === 0 ? (
                      <div className="p-3 text-xs text-brand-text-muted text-center">No custom roles to clone</div>
                    ) : (
                      customRoles.map(role => (
                        <button
                          key={role.id}
                          onClick={() => {
                            openClone(role)
                            setShowCloneDropdown(false)
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-brand-text-primary hover:bg-brand-surface-interactive transition-colors text-left cursor-pointer"
                        >
                          <Copy size={12} className="text-brand-text-muted" />
                          {role.name}
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        }
      />

      <TabNav
        tabs={[
          { id: "system", label: "System Roles", count: systemRoles.length },
          { id: "custom", label: "Custom Roles", count: customRoles.length },
          { id: "archived", label: "Archived", count: archivedRoles.length },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-brand-surface border border-brand-border rounded-2xl p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-brand-surface-elevated animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-40 bg-brand-surface-elevated animate-pulse rounded" />
                  <div className="h-2.5 w-52 bg-brand-surface-elevated animate-pulse rounded" />
                </div>
              </div>
              <div className="h-3 w-32 bg-brand-surface-elevated animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={32} className="text-status-error mb-3" />
          <p className="text-brand-text-primary font-semibold">Failed to load roles</p>
          <p className="text-sm text-brand-text-muted mt-1">{error}</p>
          <button onClick={load} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : (
      <>
      {tab === "system" && (
        systemRoles.length === 0 ? (
          <EmptyState icon={Shield} title="No system roles" description="All system roles are accounted for." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemRoles.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                allPermissions={permissions}
                expanded={expandedRole === role.id}
                onToggleExpand={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                onClone={role.isProtected ? undefined : openClone}
              />
            ))}
          </div>
        )
      )}

      {tab === "custom" && (
        customRoles.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No custom roles"
            description="Create custom roles to tailor permissions for your team."
            action={{ label: "Create Role", onClick: () => { setRoleForm(emptyForm()); setShowCreateModal(true) } }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customRoles.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                allPermissions={permissions}
                expanded={expandedRole === role.id}
                onToggleExpand={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                onEdit={openEdit}
                onClone={openClone}
                onArchive={setArchiveTarget}
              />
            ))}
          </div>
        )
      )}

      {tab === "archived" && (
        archivedRoles.length === 0 ? (
          <EmptyState icon={Archive} title="No archived roles" description="Archived roles will appear here." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedRoles.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                allPermissions={permissions}
                onUnarchive={handleUnarchive}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )
      )}
      </>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              className="glass-strong rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-brand-lg"
            >
              <div className="sticky top-0 bg-brand-surface border-b border-brand-border p-6 flex items-center justify-between z-10 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/10 flex items-center justify-center">
                    {cloneSourceRole ? <Copy size={18} className="text-brand-gold" /> : editingRole ? <Edit3 size={18} className="text-brand-gold" /> : <Plus size={18} className="text-brand-gold" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-text-primary">
                      {cloneSourceRole ? "Clone Role" : editingRole ? "Edit Role" : "Create Role"}
                    </h3>
                    <p className="text-[10px] text-brand-text-muted">
                      {cloneSourceRole ? `Cloning from "${cloneSourceRole.name}"` : editingRole ? `Editing "${editingRole.name}"` : "Define a new custom role"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowCreateModal(false); setEditingRole(null); setCloneSourceRole(null); setRoleForm(emptyForm()) }}
                  className="p-2 rounded-xl hover:bg-brand-surface-interactive text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5">Role Name</label>
                    <input
                      value={roleForm.name}
                      onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Senior Support Agent"
                      className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5">Staff Count</label>
                    <div className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text-disabled">
                      {editingRole ? editingRole.staffCount : 0} (auto)
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5">Description</label>
                  <input
                    value={roleForm.description}
                    onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the role's purpose and responsibilities"
                    className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">Permission Matrix</label>
                    <span className="text-[10px] font-mono text-brand-text-muted">{roleForm.permissions.length} selected</span>
                  </div>
                  <PermissionMatrix
                    selectedKeys={roleForm.permissions}
                    allPermissions={permissions}
                    onChange={(keys) => setRoleForm(f => ({ ...f, permissions: keys }))}
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-brand-surface border-t border-brand-border p-4 flex items-center justify-end gap-3 rounded-b-2xl">
                <button
                  onClick={() => { setShowCreateModal(false); setEditingRole(null); setCloneSourceRole(null); setRoleForm(emptyForm()) }}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary bg-brand-surface-interactive rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrUpdate}
                  disabled={!roleForm.name || !roleForm.description}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider bg-brand-gold text-brand-bg-secondary rounded-xl hover:bg-[#e6b800] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {editingRole ? "Save Changes" : cloneSourceRole ? "Clone Role" : "Create Role"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Archive Role"
        message={`Are you sure you want to archive "${archiveTarget?.name}"? Staff with this role will lose their permissions. You can restore it later from the Archived tab.`}
        confirmLabel="Archive"
        confirmVariant="primary"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Permanently Delete Role"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
    </>
  )
}
