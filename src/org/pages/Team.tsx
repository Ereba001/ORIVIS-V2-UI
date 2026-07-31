import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserPlus, Search, Shield, Crown, MoreHorizontal, X, CheckCircle2, AlertTriangle,
  Mail, ArrowUpDown, Settings, Plus, BookOpen, SlidersHorizontal, Package,
  Trash2, RefreshCw,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import WidgetPanel from '../components/WidgetPanel'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'
import { orgService } from '../../services/org-service'
import { useApiResource } from '../../hooks/useApiResource'
import type { TeamMember, Invitation, Role, PermissionGroup } from '../types'
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

  const { data, loading, error, reload } = useApiResource(async () => {
    const [team, invitations, roles, permissions, subscription] = await Promise.all([
      orgService.getTeam({ perPage: 100 }),
      orgService.getInvitations(),
      orgService.getRoles(),
      orgService.getPermissions(),
      orgService.getSubscriptionInfo(),
    ])
    return { team, invitations, roles, permissions, subscription }
  })

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

  const allRoles = [...SYSTEM_ROLES, ...CUSTOM_ROLES]
  const customRolesUsed = CUSTOM_ROLES.length
  const customRoleLimit = SUBSCRIPTION.seatsTotal

  return (
    <>
    <SeoHead meta={{ title: "Team — Organization | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black uppercase tracking-tight" style={{ color: 'var(--org-primary)' }}>Team Management</h1>
          <p className="text-sm text-brand-text-muted mt-1">Manage team members, roles, permissions, and invitations.</p>
        </div>
        {tab === 'members' && (
          <button onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-white"
            style={{ backgroundColor: pColor }}>
            <span>Invite</span>
          </button>
        )}
        {tab === 'roles' && (
          <button onClick={() => { setEditingRole(null); setShowRoleModal(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-white"
            style={{ backgroundColor: pColor }}>
            <span>Create Role</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 bg-brand-surface-elevated rounded-xl p-1 w-fit">
        {(['members', 'roles', 'invitations'] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); setSelectedIds(new Set()) }}
            className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
              tab === t ? 'text-white' : 'text-brand-text-muted hover:text-brand-text-primary'
            }`}
            style={tab === t ? { backgroundColor: pColor } : {}}>
            {t === 'members' ? 'Team Members' : t === 'roles' ? 'Roles & Permissions' : 'Invitations'}
          </button>
        ))}
      </div>

      {tab === 'members' && (
        <DashboardCard>
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..."
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all"
                style={{ borderColor: 'var(--org-primary)/30' }} />
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'active', 'invited', 'suspended'] as const).map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider font-bold transition-all ${
                    statusFilter === s ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
                  }`}
                  style={statusFilter === s ? { backgroundColor: pColor } : {}}>{s}</button>
              ))}
            </div>
          </div>

          {paged.length === 0 ? (
            <EmptyState icon={Users} title="No team members found" description="Try adjusting your search or filters."
              action={search || statusFilter !== 'all' ? undefined : { label: 'Invite Member', onClick: () => setShowInviteModal(true) }} />
          ) : (
            <>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-brand-surface-elevated/50">
                  <span className="text-[10px] font-mono text-brand-text-muted">{selectedIds.size} selected</span>
                  <button className="ml-auto p-1 rounded-lg hover:bg-brand-surface-interactive text-status-error"><Trash2 size={12} /></button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-brand-divider">
                      <th className="px-3 py-3 w-8">
                        <input type="checkbox" checked={selectedIds.size === paged.length && paged.length > 0} onChange={toggleSelectAll}
                          className="w-3.5 h-3.5 rounded border-brand-border accent-[var(--org-primary)]" />
                      </th>
                      {[{ key: 'name', label: 'Member' }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status' }, { key: 'lastActive', label: 'Last Active' }].map((col) => (
                        <th key={col.key} onClick={() => toggleSort(col.key as SortField)}
                          className="px-3 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold cursor-pointer hover:text-brand-text-primary">
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
                            <input type="checkbox" checked={selectedIds.has(member.id)} onChange={() => toggleSelect(member.id)}
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
                                <p className="text-[9px] font-mono text-brand-text-muted">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider font-bold"
                              style={{ color: pColor }}>
                              <RoleIcon size={10} />{member.role}
                            </span>
                            <p className="text-[8px] font-mono text-brand-text-muted mt-0.5">{member.department}</p>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[member.status]}`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-[10px] font-mono text-brand-text-muted">{member.lastActive}</td>
                          <td className="px-3 py-3">
                            <button className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted">
                              <MoreHorizontal size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-divider">
                  <span className="text-[9px] font-mono text-brand-text-muted">Page {page} of {totalPages}</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button key={i} onClick={() => setPage(i + 1)}
                        className={`w-7 h-7 rounded-lg text-[10px] font-mono font-bold transition-all ${
                          page === i + 1 ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
                        }`}
                        style={page === i + 1 ? { backgroundColor: pColor } : {}}>{i + 1}</button>
                    ))}
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
              <span className="text-[10px] font-mono text-brand-text-muted">
                Custom Roles: <strong style={{ color: pColor }}>{customRolesUsed} / {customRoleLimit}</strong> Used
              </span>
              <button className="ml-auto text-[9px] font-mono px-2 py-1 rounded-lg text-white" style={{ backgroundColor: pColor }}>
                Upgrade Package
              </button>
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-3">Default Roles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SYSTEM_ROLES.map((role) => (
                <div key={role.id} className="p-4 rounded-xl border border-brand-divider bg-brand-surface-elevated/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield size={14} style={{ color: pColor }} />
                      <span className="text-xs font-semibold text-brand-text-primary">{role.name}</span>
                    </div>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-brand-surface-elevated text-brand-text-disabled uppercase tracking-wider">System</span>
                  </div>
                  <p className="text-[10px] text-brand-text-muted mb-2">{role.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-brand-text-muted">{role.memberCount} member{role.memberCount !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1 text-[9px] font-mono text-status-success"><CheckCircle2 size={10} /> Active</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-3">Custom Roles</h3>
            {CUSTOM_ROLES.length === 0 ? (
              <EmptyState icon={Shield} title="No custom roles" description="Create custom roles with granular permissions."
                action={{ label: 'Create Role', onClick: () => { setEditingRole(null); setShowRoleModal(true) } }} />
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
                        <button onClick={() => { setEditingRole(role); setShowRoleModal(true) }}
                          className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted"><Settings size={12} /></button>
                        <button className="p-1 rounded-lg hover:bg-brand-surface-interactive text-status-error"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <p className="text-[10px] text-brand-text-muted mb-2">{role.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-brand-text-muted">{role.memberCount} member{role.memberCount !== 1 ? 's' : ''}</span>
                      <button className="text-[9px] font-mono font-bold" style={{ color: pColor }}>
                        Clone Role
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
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invitations..."
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
          </div>
          {pendingInvitations.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-2">Pending — {pendingInvitations.length}</h4>
              <div className="space-y-2">
                {pendingInvitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-brand-divider bg-brand-surface-elevated/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${pColor}15` }}>
                        <Mail size={14} style={{ color: pColor }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-brand-text-primary">{inv.email}</p>
                        <p className="text-[9px] font-mono text-brand-text-muted">{inv.role} · {inv.department} · Invited by {inv.invitedBy}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-brand-text-muted">{inv.sentAt}</span>
                      <button className="p-1 rounded-lg hover:bg-brand-surface-interactive text-status-success"><RefreshCw size={12} /></button>
                      <button className="p-1 rounded-lg hover:bg-brand-surface-interactive text-status-error"><X size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {otherInvitations.length > 0 && (
            <div>
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-2">History</h4>
              <div className="space-y-2">
                {otherInvitations.map((inv) => {
                  const StatusIcon = inv.status === 'accepted' ? CheckCircle2 : AlertTriangle
                  const statusColor = inv.status === 'accepted' ? 'text-status-success' : 'text-status-error'
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-brand-divider">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-surface-elevated">
                          <StatusIcon size={14} className={statusColor} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-brand-text-primary">{inv.email}</p>
                          <p className="text-[9px] font-mono text-brand-text-muted">{inv.role} · Invited by {inv.invitedBy}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-mono uppercase tracking-wider ${statusColor}`}>{inv.status}</span>
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

      <AnimatePresence>
        {showInviteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowInviteModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-surface border border-brand-border rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Invite Member</h2>
                <button onClick={() => setShowInviteModal(false)} className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Full Name</label>
                  <input placeholder="Enter full name"
                    className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Email Address</label>
                  <input placeholder="colleague@organization.com"
                    className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Role</label>
                  <select className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all">
                    <option>Election Manager</option>
                    <option>Election Officer</option>
                    <option>Observer</option>
                    <option>Finance Officer</option>
                    <option>Support Officer</option>
                    <option>Candidate Manager</option>
                    <option>Auditor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Department</label>
                  <select className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all">
                    <option>Elections</option>
                    <option>Administration</option>
                    <option>Finance</option>
                    <option>Support</option>
                    <option>Operations</option>
                    <option>Audit</option>
                    <option>Candidates</option>
                  </select>
                </div>
                <button onClick={() => setShowInviteModal(false)}
                  className="w-full rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all text-white"
                  style={{ backgroundColor: pColor }}>
                  Send Invitation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRoleModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowRoleModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-surface border border-brand-border rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">
                  {editingRole ? `Edit ${editingRole.name}` : 'Create Custom Role'}
                </h2>
                <button onClick={() => setShowRoleModal(false)} className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Role Name</label>
                  <input defaultValue={editingRole?.name || ''} placeholder="e.g. Department Head"
                    className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Description</label>
                  <textarea defaultValue={editingRole?.description || ''} placeholder="Describe this role's purpose..." rows={2}
                    className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all resize-none" />
                </div>
                <div className="border-t border-brand-divider pt-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-3">Permissions</h3>
                  <div className="space-y-4">
                    {PERMISSION_GROUPS.map((group) => (
                      <div key={group.id}>
                        <h4 className="text-[10px] font-semibold text-brand-text-primary mb-2 uppercase tracking-wider">{group.label}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {group.permissions.map((perm) => (
                            <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" defaultChecked={editingRole?.permissions
                                ?.find((g) => g.id === group.id)?.permissions.find((p) => p.id === perm.id)?.enabled ?? perm.enabled}
                                className="w-3.5 h-3.5 rounded border-brand-border accent-[var(--org-primary)]" />
                              <span className="text-[10px] font-mono text-brand-text-muted">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => setShowRoleModal(false)}
                  className="w-full rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all text-white"
                  style={{ backgroundColor: pColor }}>
                  {editingRole ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  )
}