import { Fragment, useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Users, Search, Shield, Crown, MoreHorizontal, X, CheckCircle2, AlertTriangle,
  Mail, ArrowUpDown, Settings, BookOpen, SlidersHorizontal, Package,
  Trash2, RefreshCw, Loader2, UserMinus, Copy,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { orgService } from '../../services/org-service'
import { orgRolesService } from '../services/org-roles-service'
import { useApiResource } from '../../hooks/useApiResource'
import type { Role } from '../types'
import SeoHead from "../../components/SeoHead"

type TabView = 'members' | 'roles' | 'invitations'
type SortField = 'name' | 'role' | 'status' | 'lastActive'
type FilterStatus = 'all' | 'active' | 'invited' | 'suspended'

const ROLE_ICONS: Record<string, typeof Shield> = {
  'Workspace Administrator': Crown, 'Election Manager': Shield, 'Election Officer': Shield,
  'Support Officer': Users, 'Finance Officer': Users, 'Election Observer': Users,
  'Candidate Manager': Users, 'Auditor': BookOpen, 'Participant Manager': Users,
}

const STATUS_STYLES = {
  active: 'bg-status-success/10 text-status-success border-status-success/20',
  invited: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  suspended: 'bg-status-error/10 text-status-error border-status-error/20',
}

export default function OrgTeam() {
  const navigate = useNavigate()
  const { branding } = useOrgBranding()
  const [tab, setTab] = useState<TabView>('members')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  // Invite modal state
  const [inviteFullName, setInviteFullName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviteDepartment, setInviteDepartment] = useState('Elections')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const inviteSubmittedRef = useRef(false)

  // Role modal state
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set())
  const [savingRole, setSavingRole] = useState(false)
  const [roleError, setRoleError] = useState<string | null>(null)
  const [loadingRolePerms, setLoadingRolePerms] = useState(false)

  // Member action dropdown
  const [openMemberActions, setOpenMemberActions] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)

  // Invitation action dropdown
  const [openInvitationActions, setOpenInvitationActions] = useState<string | null>(null)
  const invitationActionsRef = useRef<HTMLDivElement>(null)

  // Success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Loading states
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null)
  const [busyInvitationId, setBusyInvitationId] = useState<string | null>(null)
  const [busyRoleId, setBusyRoleId] = useState<string | null>(null)

  const [deleteRoleTarget, setDeleteRoleTarget] = useState<Role | null>(null)
  const [cloneRoleTarget, setCloneRoleTarget] = useState<Role | null>(null)
  const [cloneRoleName, setCloneRoleName] = useState('')
  const [removeMemberTarget, setRemoveMemberTarget] = useState<{ id: string; name: string } | null>(null)
  const [bulkRemoveTarget, setBulkRemoveTarget] = useState(false)

  const { data, loading, error, reload } = useApiResource(async () => {
    const [teamResult, invitationsResult, rolesResult, permissionsResult, subscriptionResult] = await Promise.allSettled([
      orgService.getTeam({ perPage: 100 }),
      orgService.getInvitations(),
      orgService.getRoles(),
      orgService.getPermissions(),
      orgService.getSubscriptionInfo(),
    ])
    const team = teamResult.status === 'fulfilled' ? teamResult.value : { items: [] as Array<{ id: string; displayName: string; email: string; role: string; status: string; department: string; lastActive: string }> }
    const invitations = invitationsResult.status === 'fulfilled' ? invitationsResult.value : []
    const roles = rolesResult.status === 'fulfilled' ? rolesResult.value : []
    const permissions = permissionsResult.status === 'fulfilled' ? permissionsResult.value : []
    const subscription = subscriptionResult.status === 'fulfilled' ? subscriptionResult.value : null
    const rolesWithCounts = roles.map((r: Role) => ({
      ...r,
      memberCount: team.items.filter((m: { role: string }) => m.role === r.name).length,
    }))
    return { team, invitations, roles: rolesWithCounts, permissions, subscription }
  })

  // Close invitation actions dropdown on outside click
  useEffect(() => {
    if (!openInvitationActions) return
    const handleClick = (e: MouseEvent) => {
      if (invitationActionsRef.current && !invitationActionsRef.current.contains(e.target as Node)) {
        setOpenInvitationActions(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openInvitationActions])

  // Set default invite role to first available role
  useEffect(() => {
    if (data?.roles?.length && !inviteRole) {
      setInviteRole(data.roles[0].slug)
    }
  }, [data, inviteRole])

  const handleDeleteRole = useCallback((role: Role) => {
    setDeleteRoleTarget(role)
  }, [])

  const handleCloneRole = useCallback((role: Role) => {
    setCloneRoleTarget(role)
    setCloneRoleName(`${role.name} (copy)`)
  }, [])

  const handleBulkDelete = useCallback(() => {
    setBulkRemoveTarget(true)
  }, [])

  const handleRemoveMember = useCallback((id: string, name: string) => {
    setRemoveMemberTarget({ id, name })
  }, [])

  if (loading) {
    return (
      <>
        <SeoHead meta={{ title: "Team — Organization | ORIVIS", noindex: true }} />
        <div className="space-y-6">
          <div className="animate-pulse h-10 w-64 bg-brand-surface-elevated rounded-2xl" />
          <div className="animate-pulse h-10 w-96 bg-brand-surface-elevated rounded-xl" />
          <SkeletonLoader rows={5} variant="card" />
        </div>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <SeoHead meta={{ title: "Team — Organization | ORIVIS", noindex: true }} />
        <EmptyState
          icon={Users}
          title="Failed to load team"
          description={error ?? 'Something went wrong loading your team.'}
          action={{ label: 'Retry', onClick: reload }}
        />
      </>
    )
  }

  const TEAM_MEMBERS = data.team.items
  const INVITATIONS = data.invitations
  const SYSTEM_ROLES = data.roles.filter((r) => r.type === 'system')
  const CUSTOM_ROLES = data.roles.filter((r) => r.type === 'custom')
  const PERMISSION_GROUPS = data.permissions
  const SUBSCRIPTION = data.subscription

  const perPage = 8
  const filtered = TEAM_MEMBERS.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false
    if (search && !m.displayName.toLowerCase().includes(search.toLowerCase()) && !m.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    const dir = sortAsc ? 1 : -1
    if (sortField === 'name') return a.displayName.localeCompare(b.displayName) * dir
    if (sortField === 'role') return a.role.localeCompare(b.role) * dir
    if (sortField === 'status') return a.status.localeCompare(b.status) * dir
    return a.lastActive.localeCompare(b.lastActive) * dir
  })
  const totalPages = Math.ceil(filtered.length / perPage)
  const pageNumbers = Array.from(new Set([1, totalPages, page - 1, page, page + 1]))
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc)
    else { setSortField(field); setSortAsc(true) }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedIds(next)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(paged.map((m) => m.id)))
  }

  const pColor = branding.primaryColor

  const filteredInvitations = INVITATIONS.filter((i) =>
    !search || i.email.toLowerCase().includes(search.toLowerCase())
  )

  const pendingInvitations = filteredInvitations.filter((i) => i.status === 'pending')
  const otherInvitations = filteredInvitations.filter((i) => i.status !== 'pending')

  const customRolesUsed = CUSTOM_ROLES.length
  const seatsTotal = SUBSCRIPTION?.seatsTotal ?? 0
  const customRoleLimit = seatsTotal

  // --- Handlers ---

  const handleInvite = async () => {
    if (inviteSubmittedRef.current) return
    if (!inviteEmail.trim()) { setInviteError('Email is required.'); return }
    const sentEmail = inviteEmail.trim()
    const sentRole = inviteRole
    const sentDepartment = inviteDepartment
    inviteSubmittedRef.current = true
    setInviting(true)
    setInviteError(null)
    try {
      await orgService.inviteMember({
        email: sentEmail,
        name: inviteFullName.trim() || undefined,
        role: sentRole,
        department: sentDepartment,
      })
      setShowInviteModal(false)
      setInviteFullName('')
      setInviteEmail('')
      setInviteRole(data?.roles?.[0]?.slug ?? '')
      setInviteDepartment('Elections')
      setSuccessMessage(`Invitation sent to ${sentEmail}`)
      setTimeout(() => setSuccessMessage(null), 5000)
      reload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send invitation.'
      setInviteError(msg)
    } finally {
      setInviting(false)
      inviteSubmittedRef.current = false
    }
  }

  const openRoleModal = async (role?: Role) => {
    setEditingRole(role ?? null)
    setRoleName(role?.name || '')
    setRoleDescription(role?.description || '')
    setRoleError(null)
    setRolePermissions(new Set())
    if (role) {
      setLoadingRolePerms(true)
      try {
        const detail = await orgRolesService.getRole(role.id)
        setRolePermissions(new Set(detail.permissions))
      } catch {
        // permissions failed to load
      } finally {
        setLoadingRolePerms(false)
      }
    }
    setShowRoleModal(true)
  }

  const handleRoleSave = async () => {
    if (!roleName.trim()) { setRoleError('Role name is required.'); return }
    setSavingRole(true)
    setRoleError(null)
    try {
      const input = { name: roleName.trim(), description: roleDescription.trim() || null, permissions: Array.from(rolePermissions), is_active: true }
      if (editingRole) {
        await orgRolesService.updateRole(editingRole.id, input)
      } else {
        await orgRolesService.createRole(input)
      }
      setShowRoleModal(false)
      reload()
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'Failed to save role.')
    } finally {
      setSavingRole(false)
    }
  }

  const confirmDeleteRole = async () => {
    if (!deleteRoleTarget) return
    setBusyRoleId(deleteRoleTarget.id)
    try {
      await orgRolesService.deleteRole(deleteRoleTarget.id)
      setDeleteRoleTarget(null)
      reload()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete role.')
    } finally {
      setBusyRoleId(null)
    }
  }

  const confirmCloneRole = async () => {
    if (!cloneRoleTarget) return
    setBusyRoleId(cloneRoleTarget.id)
    try {
      await orgRolesService.cloneRole(cloneRoleTarget.id, { name: cloneRoleName.trim() || `${cloneRoleTarget.name} (copy)` })
      setCloneRoleTarget(null)
      reload()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to clone role.')
    } finally {
      setBusyRoleId(null)
    }
  }

  const confirmBulkDelete = async () => {
    setBulkRemoveTarget(false)
    const ids = Array.from(selectedIds)
    for (const id of ids) {
      try { await orgService.removeMember(id) } catch { /* continue */ }
    }
    setSelectedIds(new Set())
    reload()
  }

  const confirmRemoveMember = async () => {
    if (!removeMemberTarget) return
    setBusyMemberId(removeMemberTarget.id)
    try {
      await orgService.removeMember(removeMemberTarget.id)
      setOpenMemberActions(null)
      setRemoveMemberTarget(null)
      reload()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to remove member.')
    } finally {
      setBusyMemberId(null)
    }
  }

  const handleChangeRole = async (id: string, newRole: string) => {
    setBusyMemberId(id)
    try {
      await orgService.updateMemberRole(id, newRole)
      setOpenMemberActions(null)
      reload()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update role.')
    } finally {
      setBusyMemberId(null)
    }
  }

  const handleResendInvitation = async (inv: { id: string; email: string }) => {
    setOpenInvitationActions(null)
    setBusyInvitationId(inv.id)
    try {
      await orgService.resendInvitation(inv.id)
      setSuccessMessage(`Invitation resent to ${inv.email}`)
      setTimeout(() => setSuccessMessage(null), 5000)
      reload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend invitation.'
      setErrorMessage(msg)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setBusyInvitationId(null)
    }
  }

  const handleRevokeInvitation = async (inv: { id: string; email: string }) => {
    setOpenInvitationActions(null)
    setBusyInvitationId(inv.id)
    try {
      await orgService.revokeInvitation(inv.id)
      setSuccessMessage(`Invitation for ${inv.email} has been revoked`)
      setTimeout(() => setSuccessMessage(null), 5000)
      reload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to revoke invitation.'
      setErrorMessage(msg)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setBusyInvitationId(null)
    }
  }

  return (
    <>
    <SeoHead meta={{ title: "Team — Organization | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--org-primary)' }}>Team Management</h1>
          <p className="text-sm text-brand-text-muted mt-1">Manage team members, roles, permissions, and invitations.</p>
        </div>
        {tab === 'members' && (
          <button onClick={() => { setInviteError(null); setShowInviteModal(true) }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-white w-full sm:w-auto"
            style={{ backgroundColor: pColor }}>
            <span>Invite</span>
          </button>
        )}
        {tab === 'roles' && (
          <button onClick={() => openRoleModal()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-white w-full sm:w-auto"
            style={{ backgroundColor: pColor }}>
            <span>Create Role</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 bg-brand-surface-elevated rounded-xl p-1 w-fit max-w-full overflow-x-auto">
        {(['members', 'roles', 'invitations'] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); setSelectedIds(new Set()) }}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${
              tab === t ? 'text-white' : 'text-brand-text-muted hover:text-brand-text-primary'
            }`}
            style={tab === t ? { backgroundColor: pColor } : {}}>
            {t === 'members' ? 'Team Members' : t === 'roles' ? 'Roles & Permissions' : 'Invitations'}
          </button>
        ))}
      </div>

      {tab === 'members' && (
        <DashboardCard>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." aria-label="Search members"
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all"
                style={{ borderColor: 'var(--org-primary)/30' }} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'active', 'invited', 'suspended'] as const).map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all ${
                    statusFilter === s ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
                  }`}
                  style={statusFilter === s ? { backgroundColor: pColor } : {}}>{s}</button>
              ))}
            </div>
          </div>

          {paged.length === 0 ? (
            <EmptyState icon={Users} title="No team members found" description="Try adjusting your search or filters."
              action={search || statusFilter !== 'all' ? undefined : { label: 'Invite Member', onClick: () => { setInviteError(null); setShowInviteModal(true) } }} />
          ) : (
            <>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-brand-surface-elevated/50">
                  <span className="text-[10px] text-brand-text-muted">{selectedIds.size} selected</span>
                  <button onClick={handleBulkDelete}
                    className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-brand-surface-interactive text-status-error text-[9px] font-bold">
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              )}
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-brand-divider">
                      <th className="px-3 py-3 w-8">
                        <input type="checkbox" name="selectAll" checked={selectedIds.size === paged.length && paged.length > 0} onChange={toggleSelectAll} aria-label="Select all members"
                          className="w-3.5 h-3.5 rounded border-brand-border accent-[var(--org-primary)]" />
                      </th>
                      {[{ key: 'name', label: 'Member' }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status' }, { key: 'lastActive', label: 'Last Active' }].map((col) => (
                        <th key={col.key} onClick={() => toggleSort(col.key as SortField)}
                          className="px-3 py-3 text-[9px] text-brand-text-muted font-bold cursor-pointer hover:text-brand-text-primary">
                          <span className="inline-flex items-center gap-1">
                            {col.label}
                            {sortField === col.key && <ArrowUpDown size={10} className={sortAsc ? '' : 'rotate-180'} />}
                          </span>
                        </th>
                      ))}
                      <th className="px-3 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((member) => {
                      const RoleIcon = ROLE_ICONS[member.role] || Users
                      return (
                        <tr key={member.id} className="border-b border-brand-divider last:border-0 hover:bg-brand-surface-interactive/30 transition-colors">
                          <td className="px-3 py-3">
                            <input type="checkbox" name="selectMember" checked={selectedIds.has(member.id)} onChange={() => toggleSelect(member.id)} aria-label="Select member"
                              className="w-3.5 h-3.5 rounded border-brand-border accent-[var(--org-primary)]" />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
                                style={{ backgroundColor: pColor }}>
                                {member.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-brand-text-primary">{member.displayName}</p>
                                <p className="text-[9px] text-brand-text-muted">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold"
                              style={{ color: pColor }}>
                              <RoleIcon size={10} />{member.role}
                            </span>
                            <p className="text-[8px] text-brand-text-muted mt-0.5">{member.department}</p>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full border ${(STATUS_STYLES as Record<string, string>)[member.status] ?? STATUS_STYLES.active}`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-[10px] text-brand-text-muted">{member.lastActive}</td>
                          <td className="px-3 py-3 relative">
                            <button onClick={(e) => {
                              if (openMemberActions === member.id) {
                                setOpenMemberActions(null); setMenuPos(null)
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect()
                                setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                                setOpenMemberActions(member.id)
                              }
                            }}
                              className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer">
                              <MoreHorizontal size={14} />
                            </button>
                            {openMemberActions === member.id && menuPos && createPortal(
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => { setOpenMemberActions(null); setMenuPos(null) }} />
                                <div className="fixed z-50 w-44 bg-brand-surface border border-brand-border rounded-xl shadow-lg py-1" style={{ top: menuPos.top, right: menuPos.right }}>
                                <div className="px-3 py-2 border-b border-brand-divider">
                                  <p className="text-[9px] text-brand-text-muted font-bold">Change Role</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {data.roles.map((r) => (
                                      <button key={r.id} onClick={() => handleChangeRole(member.id, r.slug)}
                                        disabled={busyMemberId === member.id || member.role === r.name}
                                        className={`text-[8px] px-2 py-0.5 rounded border transition-all ${
                                          member.role === r.name
                                            ? 'border-[var(--org-primary)] text-white'
                                            : 'border-brand-border text-brand-text-muted hover:border-[var(--org-primary)]/50'
                                        }`}
                                        style={member.role === r.name ? { backgroundColor: pColor } : {}}>
                                        {r.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <button onClick={() => handleRemoveMember(member.id, member.displayName)}
                                  disabled={busyMemberId === member.id}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] text-status-error hover:bg-brand-surface-interactive">
                                  {busyMemberId === member.id ? <Loader2 size={12} className="animate-spin" /> : <UserMinus size={12} />}
                                  Remove Member
                                </button>
                              </div>
                              </>,
                              document.body
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden divide-y divide-brand-divider">
                {paged.map((member) => {
                  const RoleIcon = ROLE_ICONS[member.role] || Users
                  return (
                    <div key={member.id} className="px-3 py-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
                            style={{ backgroundColor: pColor }}>
                            {member.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-brand-text-primary truncate">{member.displayName}</p>
                            <p className="text-[9px] text-brand-text-muted truncate">{member.email}</p>
                          </div>
                        </div>
                        <div className="relative shrink-0">
                          <button onClick={(e) => {
                            if (openMemberActions === member.id) {
                              setOpenMemberActions(null); setMenuPos(null)
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                              setOpenMemberActions(member.id)
                            }
                          }}
                            className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer">
                            <MoreHorizontal size={14} />
                          </button>
                          {openMemberActions === member.id && menuPos && createPortal(
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => { setOpenMemberActions(null); setMenuPos(null) }} />
                              <div className="fixed z-50 w-44 bg-brand-surface border border-brand-border rounded-xl shadow-lg py-1" style={{ top: menuPos.top, right: menuPos.right }}>
                                <div className="px-3 py-2 border-b border-brand-divider">
                                  <p className="text-[9px] text-brand-text-muted font-bold">Change Role</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {data.roles.map((r) => (
                                      <button key={r.id} onClick={() => handleChangeRole(member.id, r.slug)}
                                        disabled={busyMemberId === member.id || member.role === r.name}
                                        className={`text-[8px] px-2 py-0.5 rounded border transition-all ${
                                          member.role === r.name
                                            ? 'border-[var(--org-primary)] text-white'
                                            : 'border-brand-border text-brand-text-muted hover:border-[var(--org-primary)]/50'
                                        }`}
                                        style={member.role === r.name ? { backgroundColor: pColor } : {}}>
                                        {r.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <button onClick={() => handleRemoveMember(member.id, member.displayName)}
                                  disabled={busyMemberId === member.id}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] text-status-error hover:bg-brand-surface-interactive">
                                  {busyMemberId === member.id ? <Loader2 size={12} className="animate-spin" /> : <UserMinus size={12} />}
                                  Remove Member
                                </button>
                              </div>
                            </>,
                            document.body
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-12">
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold" style={{ color: pColor }}>
                          <RoleIcon size={10} />{member.role}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border ${(STATUS_STYLES as Record<string, string>)[member.status] ?? STATUS_STYLES.active}`}>
                          {member.status}
                        </span>
                        <span className="text-[9px] text-brand-text-muted ml-auto">{member.lastActive}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-brand-divider">
                  <span className="text-[9px] text-brand-text-muted">Page {page} of {totalPages}</span>
                  <div className="flex flex-wrap items-center gap-1 max-w-full">
                    {pageNumbers.map((n, idx, arr) => {
                      const prev = arr[idx - 1]
                      return (
                        <Fragment key={n}>
                          {prev !== undefined && n - prev > 1 && (
                            <span className="w-7 h-7 flex items-center justify-center text-[10px] text-brand-text-muted">…</span>
                          )}
                          <button onClick={() => setPage(n)}
                            className={`w-7 h-7 min-w-7 rounded-lg text-[10px] font-bold transition-all ${
                              page === n ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
                            }`}
                            style={page === n ? { backgroundColor: pColor } : {}}>{n}</button>
                        </Fragment>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </DashboardCard>
      )}

      {tab === 'roles' && (
        <div className="space-y-6">
          <DashboardCard>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-brand-divider">
              <Package size={16} style={{ color: pColor }} />
              <span className="text-[10px] text-brand-text-muted">
                Custom Roles: <strong style={{ color: pColor }}>{customRolesUsed} / {customRoleLimit}</strong> Used
              </span>
              <button onClick={() => navigate('/org/billing')}
                className="ml-auto text-[9px] px-2 py-1 rounded-lg text-white hover:opacity-90 transition-all" style={{ backgroundColor: pColor }}>
                Upgrade Package
              </button>
            </div>
            <h3 className="text-xs font-bold text-brand-text-primary mb-3">Default Roles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SYSTEM_ROLES.map((role) => (
                <div key={role.id} className="p-4 rounded-xl border border-brand-divider bg-brand-surface-elevated/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield size={14} style={{ color: pColor }} />
                      <span className="text-xs font-semibold text-brand-text-primary">{role.name}</span>
                    </div>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-brand-surface-elevated text-brand-text-disabled ">System</span>
                  </div>
                  <p className="text-[10px] text-brand-text-muted mb-2">{role.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-brand-text-muted">{role.memberCount} member{role.memberCount !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1 text-[9px] text-status-success"><CheckCircle2 size={10} /> Active</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard>
            <h3 className="text-xs font-bold text-brand-text-primary mb-3">Custom Roles</h3>
            {CUSTOM_ROLES.length === 0 ? (
              <EmptyState icon={Shield} title="No custom roles" description="Create custom roles with granular permissions."
                action={{ label: 'Create Role', onClick: () => openRoleModal() }} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CUSTOM_ROLES.map((role) => (
                  <div key={role.id} className="p-4 rounded-xl border border-brand-divider hover:border-[var(--org-primary)]/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal size={14} style={{ color: pColor }} />
                        <span className="text-xs font-semibold text-brand-text-primary">{role.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openRoleModal(role)}
                          className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted"><Settings size={12} /></button>
                        <button onClick={() => handleDeleteRole(role)}
                          disabled={busyRoleId === role.id}
                          className="p-1 rounded-lg hover:bg-brand-surface-interactive text-status-error">
                          {busyRoleId === role.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-brand-text-muted mb-2">{role.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-brand-text-muted">{role.memberCount} member{role.memberCount !== 1 ? 's' : ''}</span>
                      <button onClick={() => handleCloneRole(role)}
                        disabled={busyRoleId === role.id}
                        className="flex items-center gap-1 text-[9px] font-bold" style={{ color: pColor }}>
                        <Copy size={10} /> Clone
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>
        </div>
      )}

      {tab === 'invitations' && (
        <DashboardCard>
          <div className="relative max-w-md mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invitations..." aria-label="Search invitations"
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
          </div>
          {pendingInvitations.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[10px] text-brand-text-muted font-bold mb-2">Pending — {pendingInvitations.length}</h4>
              <div className="space-y-2">
                {pendingInvitations.map((inv) => (
                  <div key={inv.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl border border-brand-divider bg-brand-surface-elevated/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${pColor}15` }}>
                        <Mail size={14} style={{ color: pColor }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-brand-text-primary">{inv.email}</p>
                        <p className="text-[9px] text-brand-text-muted">{inv.role} · {inv.department} · Invited by {inv.invitedBy}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-brand-text-muted">{inv.sentAt}</span>
                      <div className="relative overflow-visible" ref={openInvitationActions === inv.id ? invitationActionsRef : undefined}>
                        <button onClick={() => setOpenInvitationActions(openInvitationActions === inv.id ? null : inv.id)}
                          disabled={busyInvitationId === inv.id}
                          className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted transition-colors disabled:opacity-50"
                          title="More actions">
                          {busyInvitationId === inv.id ? <Loader2 size={14} className="animate-spin" /> : <MoreHorizontal size={14} />}
                        </button>
                        <AnimatePresence>
                          {openInvitationActions === inv.id && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-full mt-1 z-[999] w-44 bg-brand-surface border border-brand-border rounded-xl shadow-xl overflow-hidden">
                              <button onClick={() => handleResendInvitation(inv)}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-medium text-brand-text-primary hover:bg-brand-surface-interactive transition-colors text-left">
                                <RefreshCw size={12} className="text-status-success" />
                                Resend invitation
                              </button>
                              <div className="border-t border-brand-divider" />
                              <button onClick={() => handleRevokeInvitation(inv)}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-medium text-status-error hover:bg-status-error/10 transition-colors text-left">
                                <Trash2 size={12} />
                                Delete invitation
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {otherInvitations.length > 0 && (
            <div>
              <h4 className="text-[10px] text-brand-text-muted font-bold mb-2">History</h4>
              <div className="space-y-2">
                {otherInvitations.map((inv) => {
                  const StatusIcon = inv.status === 'accepted' ? CheckCircle2 : AlertTriangle
                  const statusColor = inv.status === 'accepted' ? 'text-status-success' : 'text-status-error'
                  return (
                    <div key={inv.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl border border-brand-divider">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-surface-elevated">
                          <StatusIcon size={14} className={statusColor} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-brand-text-primary">{inv.email}</p>
                          <p className="text-[9px] text-brand-text-muted">{inv.role} · Invited by {inv.invitedBy}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] ${statusColor}`}>{inv.status}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {filteredInvitations.length === 0 && (
            <EmptyState icon={Mail} title="No invitations" description="No invitations match your search." />
          )}
        </DashboardCard>
      )}

      {/* Success Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-status-success/10 border border-status-success/20 text-status-success rounded-xl px-4 py-3 text-xs font-semibold shadow-lg">
            <CheckCircle2 size={14} />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-status-error/10 border border-status-error/20 text-status-error rounded-xl px-4 py-3 text-xs font-semibold shadow-lg">
            <AlertTriangle size={14} />
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => !inviting && setShowInviteModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md mx-4 relative overflow-hidden">
              {/* Loading Overlay */}
              {inviting && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-brand-surface/90 rounded-2xl">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={28} className="animate-spin text-brand-gold" />
                    <span className="text-sm font-semibold text-brand-text-primary">Sending invitation...</span>
                  </div>
                </div>
              )}
              {/* Error Banner - TOP of modal, impossible to miss */}
              {inviteError && (
                <div className="bg-status-error text-white px-4 py-3 flex items-center gap-2.5">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span className="text-[12px] font-bold leading-snug">{inviteError}</span>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-bold text-brand-text-primary">Invite Member</h2>
                  <button onClick={() => !inviting && setShowInviteModal(false)} className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted disabled:opacity-30" disabled={inviting}><X size={16} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="inviteFullName">Full Name</label>
                    <input id="inviteFullName" name="fullName" placeholder="Enter full name" value={inviteFullName} onChange={(e) => setInviteFullName(e.target.value)} disabled={inviting}
                      className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="inviteEmail">Email Address</label>
                    <input id="inviteEmail" name="email" type="email" placeholder="Enter their work email address" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} disabled={inviting}
                      className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="inviteRole">Role</label>
                    <select id="inviteRole" name="role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} disabled={inviting}
                      className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all disabled:opacity-50">
                      {SYSTEM_ROLES.length > 0 && (
                        <optgroup label="System Roles">
                          {SYSTEM_ROLES.map((r) => (
                            <option key={r.id} value={r.slug}>{r.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {CUSTOM_ROLES.length > 0 && (
                        <optgroup label="Custom Roles">
                          {CUSTOM_ROLES.map((r) => (
                            <option key={r.id} value={r.slug}>{r.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="inviteDepartment">Department</label>
                    <select id="inviteDepartment" name="department" value={inviteDepartment} onChange={(e) => setInviteDepartment(e.target.value)} disabled={inviting}
                      className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all disabled:opacity-50">
                      <option>Events</option>
                      <option>Administration</option>
                      <option>Finance</option>
                      <option>Support</option>
                      <option>Operations</option>
                      <option>Audit</option>
                      <option>Candidates</option>
                    </select>
                  </div>
                  <button onClick={handleInvite} disabled={inviting}
                    className="w-full rounded-xl py-3 text-xs font-bold transition-all text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: pColor }}>
                    {inviting && <Loader2 size={12} className="animate-spin" />}
                    {inviting ? 'Sending Invitation...' : 'Send Invitation'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowRoleModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-surface border border-brand-border rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-bold text-brand-text-primary">
                  {editingRole ? `Edit ${editingRole.name}` : 'Create Custom Role'}
                </h2>
                <button onClick={() => setShowRoleModal(false)} className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="roleName">Role Name</label>
                  <input id="roleName" name="roleName" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Name this role (e.g. Election Manager)"
                    className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="roleDescription">Description</label>
                  <textarea id="roleDescription" name="roleDescription" value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} placeholder="Describe this role's purpose..." rows={2}
                    className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all resize-none" />
                </div>
                <div className="border-t border-brand-divider pt-4">
                  <h3 className="text-[10px] text-brand-text-muted font-bold mb-3">Permissions</h3>
                  {loadingRolePerms ? (
                    <div className="flex items-center justify-center py-4"><Loader2 size={16} className="animate-spin text-brand-text-muted" /></div>
                  ) : (
                    <div className="space-y-4">
                      {PERMISSION_GROUPS.map((group) => (
                        <div key={group.id}>
                          <h4 className="text-[10px] font-semibold text-brand-text-primary mb-2 ">{group.label}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {group.permissions.map((perm) => (
                              <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="permission"
                                  checked={rolePermissions.has(perm.key)}
                                  onChange={() => {
                                    setRolePermissions((prev) => {
                                      const next = new Set(prev)
                                      if (next.has(perm.key)) next.delete(perm.key); else next.add(perm.key)
                                      return next
                                    })
                                  }}
                                  aria-label="Permission"
                                  className="w-3.5 h-3.5 rounded border-brand-border accent-[var(--org-primary)]" />
                                <span className="text-[10px] text-brand-text-muted">{perm.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {roleError && (
                  <p className="text-[10px] text-status-error bg-status-error/10 border border-status-error/20 rounded-xl px-3 py-2">{roleError}</p>
                )}
                <button onClick={handleRoleSave} disabled={savingRole}
                  className="w-full rounded-xl py-3 text-xs font-bold transition-all text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: pColor }}>
                  {savingRole && <Loader2 size={12} className="animate-spin" />}
                  {savingRole ? 'Saving...' : editingRole ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteRoleTarget !== null}
        title={`Delete role "${deleteRoleTarget?.name ?? ''}"?`}
        message="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDeleteRole}
        onCancel={() => setDeleteRoleTarget(null)}
        variant="danger"
      />

      <ConfirmDialog
        open={bulkRemoveTarget}
        title={`Remove ${selectedIds.size} member(s)?`}
        message="This cannot be undone."
        confirmLabel="Remove"
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkRemoveTarget(false)}
        variant="danger"
      />

      <ConfirmDialog
        open={removeMemberTarget !== null}
        title={`Remove "${removeMemberTarget?.name ?? ''}" from the team?`}
        message=""
        confirmLabel="Remove"
        onConfirm={confirmRemoveMember}
        onCancel={() => setRemoveMemberTarget(null)}
        variant="danger"
      />

      <AnimatePresence>
        {cloneRoleTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
            onClick={() => setCloneRoleTarget(null)}
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
              <h3 className="text-sm font-bold text-brand-text-primary mb-1">Clone "{cloneRoleTarget.name}"</h3>
              <p className="text-[10px] text-brand-text-muted mb-3">Enter a name for the new role.</p>
              <input
                autoFocus
                value={cloneRoleName}
                onChange={(e) => setCloneRoleName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmCloneRole(); if (e.key === 'Escape') setCloneRoleTarget(null) }}
                className="w-full px-3 py-2 rounded-xl bg-brand-bg-secondary border border-brand-border text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-[var(--org-primary)] transition-colors mb-4"
              />
              <div className="flex items-center gap-2 justify-end">
                <button onClick={() => setCloneRoleTarget(null)} className="px-4 py-2 rounded-xl text-[10px] font-bold text-brand-text-muted hover:bg-brand-surface-interactive transition-all">Cancel</button>
                <button onClick={confirmCloneRole} className="px-4 py-2 rounded-xl text-[10px] font-bold text-white hover:opacity-90 transition-all" style={{ backgroundColor: 'var(--org-primary)' }}>Clone</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  )
}
