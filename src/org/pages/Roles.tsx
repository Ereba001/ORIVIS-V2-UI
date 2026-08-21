import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Shield, Plus, Pencil, Copy, Trash2, Users, ChevronDown, ChevronUp, Loader2, X,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import EmptyState from '../components/EmptyState'
import SeoHead from '../../components/SeoHead'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { useApiResource } from '../../hooks/useApiResource'
import { orgRolesService } from '../services/org-roles-service'
import type { OrgRole, OrgRoleInput, PermissionGroup } from '../services/org-roles-service'

type PanelMode = 'create' | 'edit' | null

function systemRoleNote(role: OrgRole): string {
  const haystack = `${role.name} ${role.slug}`.toLowerCase()
  if (/admin|owner|founder/.test(haystack)) return 'Full access — can manage everything in the workspace.'
  if (/manager/.test(haystack)) return 'Can manage events, voters, and results; no billing or workspace settings.'
  if (/officer/.test(haystack)) return 'Can create and manage events and candidates; limited admin access.'
  if (/viewer|auditor|observer/.test(haystack)) return 'Read-only access to events, reports, and audit logs.'
  return 'Built in system role with predefined permissions.'
}

export default function Roles() {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor

  const { data: roles, loading, error, reload } = useApiResource(async () => orgRolesService.listRoles())

  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(null)

  const [panelMode, setPanelMode] = useState<PanelMode>(null)
  const [editingRole, setEditingRole] = useState<OrgRole | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingRole, setLoadingRole] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<OrgRole | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [cloneTarget, setCloneTarget] = useState<OrgRole | null>(null)
  const [cloneName, setCloneName] = useState('')
  const [cloneError, setCloneError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    orgRolesService.permissionCatalog()
      .then((groups) => { if (active) setPermissionGroups(groups) })
      .catch((err: unknown) => {
        if (active) setCatalogError(err instanceof Error ? err.message : 'Failed to load permissions.')
      })
    return () => { active = false }
  }, [])

  const openCreate = () => {
    setPanelMode('create')
    setEditingRole(null)
    setFormName('')
    setFormDescription('')
    setFormActive(true)
    setSelectedKeys(new Set())
    setFormError(null)
  }

  const openEdit = async (role: OrgRole) => {
    setPanelMode('edit')
    setEditingRole(role)
    setFormName(role.name)
    setFormDescription(role.description ?? '')
    setFormActive(role.is_active)
    setSelectedKeys(new Set())
    setCollapsedGroups(new Set())
    setFormError(null)
    setLoadingRole(true)
    try {
      const detail = await orgRolesService.getRole(role.uuid)
      setSelectedKeys(new Set(detail.permissions))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to load role permissions.')
    } finally {
      setLoadingRole(false)
    }
  }

  const closePanel = () => {
    setPanelMode(null)
    setEditingRole(null)
    setFormError(null)
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError('Role name is required.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const input: OrgRoleInput = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        permissions: Array.from(selectedKeys),
        is_active: formActive,
      }
      if (panelMode === 'edit' && editingRole) {
        await orgRolesService.updateRole(editingRole.uuid, input)
      } else {
        await orgRolesService.createRole(input)
      }
      closePanel()
      reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = useCallback((role: OrgRole) => {
    setDeleteTarget(role)
    setDeleteError(null)
  }, [])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await orgRolesService.deleteRole(deleteTarget.uuid)
      setDeleteTarget(null)
      reload()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete role.')
    }
  }

  const handleClone = useCallback((role: OrgRole) => {
    setCloneTarget(role)
    setCloneName('')
    setCloneError(null)
  }, [])

  const confirmClone = async () => {
    if (!cloneTarget) return
    try {
      await orgRolesService.cloneRole(cloneTarget.uuid, { name: cloneName.trim() || `${cloneTarget.name} (copy)` })
      setCloneTarget(null)
      reload()
    } catch (err) {
      setCloneError(err instanceof Error ? err.message : 'Failed to clone role.')
    }
  }

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const groupAllSelected = (group: PermissionGroup) =>
    group.permissions.length > 0 && group.permissions.every((p) => selectedKeys.has(p.key))

  const toggleGroup = (group: PermissionGroup) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      const allSelected = group.permissions.every((p) => next.has(p.key))
      group.permissions.forEach((p) => {
        if (allSelected) next.delete(p.key)
        else next.add(p.key)
      })
      return next
    })
  }

  const toggleGroupCollapse = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const inputClass = 'w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all'

  if (loading) {
    return (
      <>
        <SeoHead meta={{ title: 'Roles & Permissions — Organization | ORIVIS', noindex: true }} />
        <div className="max-w-[1100px] mx-auto flex items-center justify-center py-28">
          <div className="flex items-center gap-3 text-brand-text-muted">
            <Loader2 size={20} className="animate-spin" style={{ color: pColor }} />
            <span className="text-xs font-bold uppercase tracking-wider">Loading roles...</span>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <SeoHead meta={{ title: 'Roles & Permissions — Organization | ORIVIS', noindex: true }} />
        <div className="max-w-[1100px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--org-primary)' }}>Roles &amp; Permissions</h1>
              <p className="text-sm text-brand-text-muted mt-1">Manage roles, assign permissions, and control access across your workspace.</p>
            </div>
          </div>
          <DashboardCard hover={false}>
            <EmptyState
              icon={Shield}
              title="Failed to load roles"
              description={error}
              action={{ label: 'Retry', onClick: reload }}
            />
          </DashboardCard>
        </div>
      </>
    )
  }

  const roleList = roles ?? []

  return (
    <>
      <SeoHead meta={{ title: 'Roles & Permissions — Organization | ORIVIS', noindex: true }} />
      <div className="max-w-[1100px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--org-primary)' }}>Roles &amp; Permissions</h1>
            <p className="text-sm text-brand-text-muted mt-1">Manage roles, assign permissions, and control access across your workspace.</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-white w-full sm:w-auto hover:opacity-90"
            style={{ backgroundColor: pColor }}>
            <Plus size={14} />
            <span>New Role</span>
          </button>
        </div>

        <AnimatePresence initial={false}>
          {panelMode && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-brand-surface border border-brand-border rounded-xl shadow-sm p-5"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  {panelMode === 'edit' ? <Pencil size={14} style={{ color: pColor }} /> : <Plus size={14} style={{ color: pColor }} />}
                  <h2 className="text-xs font-bold text-brand-text-primary">
                    {panelMode === 'edit' ? `Edit ${editingRole?.name ?? 'Role'}` : 'New Role'}
                  </h2>
                </div>
                <button onClick={closePanel} aria-label="Close panel" className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted">
                  <X size={16} />
                </button>
              </div>

              {formError && (
                <div role="alert" className="mb-4 p-3 rounded-xl bg-status-error/10 border border-status-error/20 text-[10px] font-mono text-status-error">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5" htmlFor="role-name">Role Name</label>
                    <input id="role-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Election Officer"
                      className={inputClass} />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center justify-between gap-3 w-full pb-1">
                      <span className="text-xs text-brand-text-primary">Active</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={formActive}
                        onClick={() => setFormActive(!formActive)}
                        className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${formActive ? 'bg-status-success' : 'bg-brand-border'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${formActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5" htmlFor="role-description">Description</label>
                  <textarea id="role-description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Describe this role's purpose..." rows={2}
                    className={`${inputClass} resize-none`} />
                </div>

                <div className="border-t border-brand-divider pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">Permissions</h3>
                    <span className="text-[9px] text-brand-text-muted">{selectedKeys.size} selected</span>
                  </div>

                  {loadingRole ? (
                    <div className="flex items-center gap-2 py-6 text-brand-text-muted">
                      <Loader2 size={14} className="animate-spin" style={{ color: pColor }} />
                      <span className="text-[10px]">Loading role permissions...</span>
                    </div>
                  ) : permissionGroups.length === 0 ? (
                    catalogError ? (
                      <p className="text-[10px] text-status-error" role="alert">{catalogError}</p>
                    ) : (
                      <p className="text-[10px] text-brand-text-muted">No permissions available.</p>
                    )
                  ) : (
                    <div className="space-y-4">
                      {permissionGroups.map((group) => {
                        const collapsed = collapsedGroups.has(group.group)
                        return (
                          <div key={group.group}>
                            <div className="flex items-center justify-between mb-2">
                              <button type="button" onClick={() => toggleGroupCollapse(group.group)} aria-expanded={!collapsed}
                                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-text-primary hover:text-brand-text-muted transition-colors">
                                {collapsed ? <ChevronDown size={12} className="text-brand-text-muted" /> : <ChevronUp size={12} className="text-brand-text-muted" />}
                                {group.group}
                              </button>
                              <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-bold text-brand-text-muted">
                                <input type="checkbox" checked={groupAllSelected(group)} onChange={() => toggleGroup(group)} aria-label={`Select all ${group.group} permissions`}
                                  className="w-3.5 h-3.5 rounded border-brand-border accent-[var(--org-primary)]" />
                                Select all
                              </label>
                            </div>
                            {!collapsed && (
                              <div className="flex flex-wrap gap-2">
                                {group.permissions.map((perm) => {
                                  const selected = selectedKeys.has(perm.key)
                                  return (
                                    <button key={perm.key} type="button" role="checkbox" aria-checked={selected} onClick={() => toggleKey(perm.key)}
                                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all border ${
                                        selected ? 'text-white border-transparent' : 'text-brand-text-muted border-brand-divider hover:border-brand-text-muted'
                                      }`}
                                      style={selected ? { backgroundColor: pColor } : undefined}>
                                      {selected ? null : <Plus size={10} />}
                                      {perm.label}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button onClick={closePanel}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-brand-text-muted hover:bg-brand-surface-interactive transition-all">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-white hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: pColor }}>
                    {saving && <Loader2 size={12} className="animate-spin" />}
                    {panelMode === 'edit' ? 'Save Changes' : 'Create Role'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DashboardCard hover={false}>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-brand-divider">
            <Shield size={16} style={{ color: pColor }} />
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">All Roles</h2>
            <span className="ml-auto text-[9px] text-brand-text-muted">{roleList.length} role{roleList.length !== 1 ? 's' : ''}</span>
          </div>

          {roleList.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No roles found"
              description="Create your first custom role to start assigning permissions."
              action={{ label: 'New Role', onClick: openCreate }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roleList.map((role) => (
                <div key={role.uuid} className="p-4 rounded-xl border border-brand-divider bg-brand-surface-elevated/20 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Shield size={14} style={{ color: pColor }} className="shrink-0" />
                      <span className="text-xs font-semibold text-brand-text-primary truncate">{role.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {role.is_system && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-brand-surface-elevated text-brand-text-muted border border-brand-divider">System</span>
                      )}
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border ${
                        role.is_active
                          ? 'bg-status-success/10 text-status-success border-status-success/20'
                          : 'bg-brand-surface-interactive text-brand-text-muted border-brand-divider'
                      }`}>
                        {role.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {role.description && (
                    <p className="text-[10px] text-brand-text-muted leading-relaxed">{role.description}</p>
                  )}

                  {role.is_system ? (
                    <div className="rounded-lg bg-brand-surface-elevated/40 border border-brand-divider px-3 py-2 space-y-1">
                      <p className="text-[10px] text-brand-text-muted leading-relaxed">{systemRoleNote(role)}</p>
                      <p className="text-[9px] text-brand-text-disabled">System role — built into ORIVIS. Permissions are predefined and can't be edited.</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-1">
                      <button onClick={() => openEdit(role)} title={`Edit ${role.name}`}
                        className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg border border-brand-divider hover:bg-brand-surface-interactive text-brand-text-muted transition-all">
                        <Pencil size={10} /> Edit
                      </button>
                      <button onClick={() => handleClone(role)} title={`Clone ${role.name}`}
                        className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg border border-brand-divider hover:bg-brand-surface-interactive text-brand-text-muted transition-all">
                        <Copy size={10} /> Clone
                      </button>
                      <button onClick={() => handleDelete(role)} title={`Delete ${role.name}`}
                        className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg border border-brand-divider hover:bg-brand-surface-interactive text-status-error transition-all">
                        <Trash2 size={10} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete role "${deleteTarget?.name ?? ''}"?`}
        message={deleteError ?? 'This action cannot be undone.'}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(null) }}
        variant="danger"
      />

      <AnimatePresence>
        {cloneTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
            onClick={() => setCloneTarget(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Clone role"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-surface border border-brand-border rounded-2xl p-6 w-full max-w-sm mx-4"
            >
              <h3 className="text-sm font-bold text-brand-text-primary mb-1">Clone role "{cloneTarget.name}"</h3>
              <p className="text-[10px] text-brand-text-muted mb-3">Enter a name for the new role.</p>
              {cloneError && <p className="text-[10px] text-status-error mb-2">{cloneError}</p>}
              <input
                autoFocus
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmClone(); if (e.key === 'Escape') setCloneTarget(null) }}
                placeholder={`${cloneTarget.name} (copy)`}
                className="w-full px-3 py-2 rounded-xl bg-brand-bg-secondary border border-brand-border text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-[var(--org-primary)] transition-colors mb-4"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setCloneTarget(null)}
                  className="px-4 py-2 rounded-xl text-[10px] font-bold text-brand-text-muted hover:bg-brand-surface-interactive transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClone}
                  className="px-4 py-2 rounded-xl text-[10px] font-bold text-white hover:opacity-90 transition-all"
                  style={{ backgroundColor: 'var(--org-primary)' }}
                >
                  Clone
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
