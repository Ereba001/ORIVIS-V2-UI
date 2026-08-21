import { useState, useMemo, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import SeoHead from "../../components/SeoHead"
import {
  Building2, Users, Shield, Activity, CalendarDays, HardDrive,
  FileText, Mail, Phone, MapPin, CreditCard, Clock, RefreshCw,
  CheckCircle2, AlertTriangle, XCircle, MessageSquare,
  Receipt, LifeBuoy, ScrollText, StickyNote, DollarSign,
  PauseCircle, PlayCircle, ExternalLink,
} from "lucide-react"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import TabNav from "../../components/platform/TabNav"
import StatusPill from "../../components/platform/StatusPill"
import EmptyState from "../../components/platform/EmptyState"
import StatsGrid from "../../components/platform/StatsGrid"
import ResponsiveTable, { ResponsiveColumn } from "../../components/platform/ResponsiveTable"
import WorkspaceAccessDialog from "../../components/platform/WorkspaceAccessDialog"
import { platformService, mapSubscription } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"
import type {
  OrganizationHealth,
  SubscriptionRecord,
  PlatformActivity,
  InternalNote,
  PlatformInvoice,
  SupportTicket,
  PlatformAuditLog,
} from "../../types/platform"
import { usePlatformGovernance } from "../../contexts/PlatformGovernanceContext"

type TabId = "overview" | "subscription" | "health" | "timeline" | "events" | "members" | "billing" | "support" | "audit" | "notes"

const STATUS_MAP: Record<string, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  PENDING: "warning",
  SUSPENDED: "danger",
}

const HEALTH_STYLES: Record<string, string> = {
  healthy: "text-status-success bg-status-success/10 border-status-success/20",
  attention: "text-status-warning bg-status-warning/10 border-status-warning/20",
  critical: "text-status-error bg-status-error/10 border-status-error/20",
}

const HEALTH_ICONS: Record<string, typeof CheckCircle2> = {
  healthy: CheckCircle2,
  attention: AlertTriangle,
  critical: XCircle,
}

const SEVERITY_COLORS: Record<string, string> = {
  info: "border-l-blue-400",
  warning: "border-l-amber-400",
  critical: "border-l-red-400",
}

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-blue-400",
  warning: "bg-amber-400",
  critical: "bg-red-400",
}

const SUB_PILL: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  ACTIVE: "success",
  TRIALING: "info",
  EXPIRING: "warning",
  RENEWED: "info",
  SUSPENDED: "danger",
  CANCELLED: "danger",
}

const TICKET_PILL: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  OPEN: "info",
  ASSIGNED: "warning",
  WAITING: "neutral",
  RESOLVED: "success",
  CLOSED: "neutral",
}

const AUDIT_SEV: Record<string, string> = {
  Info: "text-blue-400 bg-blue-400/10",
  Warning: "text-status-warning bg-status-warning/10",
  Critical: "text-status-error bg-status-error/10",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function OrganizationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { enterInspection, hasPermission } = usePlatformGovernance()
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const canManage = hasPermission("intervene")
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false)
  const { data, loading, error, reload } = useApiResource(() => platformService.getOrganization(id ?? ""), [id])

  useEffect(() => {
    if (!showWorkspaceModal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowWorkspaceModal(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [showWorkspaceModal])

  const org = useMemo<OrganizationHealth | undefined>(() => data?.organization, [data])

  const subscription = useMemo<SubscriptionRecord | undefined>(() => {
    if (!data?.subscription) return undefined
    return mapSubscription(data.subscription)
  }, [data])

  const orgActivities = useMemo<PlatformActivity[]>(() => data?.activities ?? [], [data])

  const invoices = useMemo<PlatformInvoice[]>(
    () => data?.subscription ? [mapSubscription(data.subscription)].map((sub) => ({
      id: sub.id,
      org: sub.organizationName,
      plan: sub.plan.charAt(0) + sub.plan.slice(1).toLowerCase(),
      amount: sub.price,
      status: sub.status === 'ACTIVE' || sub.status === 'TRIALING' ? 'Paid' as const : sub.status === 'SUSPENDED' ? 'Pending' as const : 'Free' as const,
      date: sub.startedAt,
    })) : [],
    [data]
  )

  const tickets = useMemo<SupportTicket[]>(() => data?.tickets ?? [], [data])

  const auditLogs = useMemo<PlatformAuditLog[]>(() => data?.auditLogs ?? [], [data])

  const memberships = useMemo(
    () => data?.memberships ?? [],
    [data]
  )

  const orgNotes = useMemo<InternalNote[]>(() => [], [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Organizations", href: "/platform/organizations" }, { label: "Loading" }]} />
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-surface-elevated animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-72 bg-brand-surface-elevated animate-pulse rounded" />
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

  if (error || !org) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Organizations", href: "/platform/organizations" }, { label: error ? "Error" : "Not Found" }]} />
        {error ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <AlertTriangle size={32} className="text-status-error mb-3" />
            <p className="text-brand-text-primary font-semibold">Failed to load organization</p>
            <p className="text-sm text-brand-text-muted mt-1">{error}</p>
            <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="Organization not found"
            description="The organization you're looking for doesn't exist or has been removed."
            action={{ label: "Back to Organizations", onClick: () => navigate("/platform/organizations") }}
          />
        )}
      </div>
    )
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "subscription", label: "Subscription" },
    { id: "health", label: "Health" },
    { id: "timeline", label: "Timeline", count: orgActivities.length },
    { id: "events", label: "Events", count: org.activeEvents },
    { id: "members", label: "Members" },
    { id: "billing", label: "Billing", count: invoices.length },
    { id: "support", label: "Support", count: tickets.length },
    { id: "audit", label: "Audit", count: auditLogs.length },
    { id: "notes", label: "Notes", count: orgNotes.length },
  ]

  // ── Overview ────────────────────────────────────────────────
  const renderOverviewTab = () => {
    const HealthIcon = HEALTH_ICONS[org.workspaceStatus] || CheckCircle2
    return (
      <div className="space-y-6">
        <StatsGrid
          items={[
            { label: "Members", value: org.members.toLocaleString(), icon: Users, color: "text-brand-gold" },
            { label: "Admins", value: org.admins.toLocaleString(), icon: Shield, color: "text-blue-400" },
            { label: "Active Events", value: org.activeEvents.toString(), icon: FileText, color: "text-emerald-400" },
            {
              label: "Storage",
              value: `${org.storageUsed} GB / ${org.storageTotal} GB`,
              icon: HardDrive,
              color: "text-amber-400",
            },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">
              Organization Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileField icon={Mail} label="Email" value={org.email ?? "—"} />
              <ProfileField icon={Phone} label="Phone" value={org.phone ?? "—"} />
              <ProfileField icon={MapPin} label="Location" value={org.country} />
              <ProfileField icon={CalendarDays} label="Created" value={formatDate(org.dateJoined)} />
            </div>

            {/* Subscription Summary */}
            <div className="pt-3 border-t border-brand-border space-y-2">
              <h4 className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">
                Subscription
              </h4>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-brand-text-primary">
                <span className="font-mono text-brand-text-muted">{org.plan}</span>
                <StatusPill status={org.subscription} variant={org.subscription === "Active" ? "success" : org.subscription === "Expiring" ? "warning" : org.subscription === "Cancelled" ? "danger" : "info"} />
              </div>
            </div>

            {/* Workspace Health Summary */}
            <div className="pt-3 border-t border-brand-border">
              <h4 className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-2">
                Workspace Health
              </h4>
              <span className={`inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border ${HEALTH_STYLES[org.workspaceStatus] || HEALTH_STYLES.healthy}`}>
                <HealthIcon size={10} />
                {org.workspaceStatus}
              </span>
            </div>
          </div>

          {/* Quick Info */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">
              Quick Overview
            </h3>
            <div className="space-y-3">
              <QuickRow label="Plan" value={org.plan} />
              <QuickRow label="Status" value={org.status} />
              <QuickRow label="Members" value={org.members.toLocaleString()} />
              <QuickRow label="Admins" value={org.admins.toLocaleString()} />
              <QuickRow label="Active Events" value={org.activeEvents.toString()} />
              <QuickRow label="Storage" value={`${org.storageUsed} GB / ${org.storageTotal} GB`} />
              <div className="w-full bg-brand-surface rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-gold transition-all"
                  style={{ width: `${Math.min((org.storageUsed / (org.storageTotal || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Subscription ────────────────────────────────────────────
  const renderSubscriptionTab = () => {
    if (!subscription) {
      return (
        <EmptyState
          icon={CreditCard}
          title="No subscription data"
          description="Subscription record not found for this organization."
        />
      )
    }
    const sub = subscription
    return (
      <div className="max-w-2xl glass-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">
            Subscription Details
          </h3>
          <StatusPill status={sub.status} variant={SUB_PILL[sub.status] || "neutral"} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SubRow icon={CreditCard} label="Plan" value={sub.plan} />
          <SubRow icon={Users} label="Max Participants" value={sub.maxVoters.toLocaleString()} />
          <SubRow icon={DollarSign} label="Price" value={sub.price} />
          <SubRow icon={CalendarDays} label="Started" value={formatDate(sub.startedAt)} />
          <SubRow icon={CalendarDays} label="Expires" value={formatDate(sub.expiresAt)} />
          {sub.renewedAt && <SubRow icon={RefreshCw} label="Last Renewed" value={formatDate(sub.renewedAt)} />}
          {sub.cancelledAt && <SubRow icon={XCircle} label="Cancelled" value={formatDate(sub.cancelledAt)} />}
          <SubRow icon={CreditCard} label="Payment Method" value={sub.paymentMethod} />
        </div>
      </div>
    )
  }

  // ── Health ──────────────────────────────────────────────────
  const renderHealthTab = () => {
    const pct = Math.round((org.storageUsed / (org.storageTotal || 1)) * 100)
    const HealthIcon = HEALTH_ICONS[org.workspaceStatus] || CheckCircle2
    return (
      <div className="max-w-xl space-y-6">
        <div className="glass-card rounded-2xl p-6 text-center space-y-4">
          <div className={`inline-flex p-4 rounded-full ${HEALTH_STYLES[org.workspaceStatus] || HEALTH_STYLES.healthy}`}>
            <HealthIcon size={40} />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-brand-text-primary uppercase">{org.workspaceStatus}</p>
            <p className="text-xs text-brand-text-muted mt-1">Workspace Health</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-brand-text-muted">
            <Clock size={12} />
            <span>Last checked {timeAgo(org.lastActivity)}</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h4 className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">
            Resource Usage
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-brand-text-muted mb-1">
                <span>Storage</span>
                <span>{org.storageUsed} GB / {org.storageTotal} GB</span>
              </div>
              <div className="w-full bg-brand-surface rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${
                  pct > 80 ? "bg-status-error" : pct > 60 ? "bg-status-warning" : "bg-status-success"
                }`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2">
          <h4 className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">
            Status Badges
          </h4>
          <div className="flex flex-wrap gap-2">
            <StatusPill status={org.status} variant={STATUS_MAP[org.status] || "neutral"} />
            <StatusPill status={org.workspaceStatus} variant={org.workspaceStatus === "healthy" ? "success" : org.workspaceStatus === "attention" ? "warning" : "danger"} />
            <StatusPill status={org.subscription} variant={SUB_PILL[Object.keys(SUB_PILL).find(k => k === org.subscription.toUpperCase()) as keyof typeof SUB_PILL] || "neutral"} />
          </div>
        </div>
      </div>
    )
  }

  // ── Timeline ────────────────────────────────────────────────
  const renderTimelineTab = () => (
    <div className="space-y-4">
      {orgActivities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No timeline activity"
          description="This organization has no recorded activity yet."
        />
      ) : (
        <div className="space-y-3">
          {orgActivities.map((act, i) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className={`glass-card rounded-2xl p-4 border-l-4 ${SEVERITY_COLORS[act.severity] || "border-l-brand-border"} flex items-start gap-3`}
            >
              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-brand-text-muted" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-brand-text-primary">{act.actor}</span>
                  <span className="text-[9px] font-mono text-brand-text-muted">{act.action}</span>
                </div>
                <p className="text-[10px] font-mono text-brand-text-muted mt-0.5">{act.target}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[act.severity] || "bg-brand-text-muted"}`} />
                <span className="text-[9px] font-mono text-brand-text-muted">{timeAgo(act.timestamp)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )

  // ── Events ──────────────────────────────────────────────────
  const renderEventsTab = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <motion.div
        key="active"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -2 }}
        className="glass-card rounded-2xl p-5 text-center"
      >
        <p className="text-3xl font-bold font-mono text-brand-text-primary">{org.activeEvents}</p>
        <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted mt-2">Active Events</p>
        <div className="mt-3">
          <StatusPill status="Active" variant="success" />
        </div>
      </motion.div>
    </div>
  )

  // ── Members ─────────────────────────────────────────────────
  const renderMembersTab = () => {
    const counts = [
      { label: "Members", value: org.members.toLocaleString(), icon: Users, color: "text-brand-gold" },
      { label: "Admins", value: org.admins.toLocaleString(), icon: Shield, color: "text-blue-400" },
      { label: "Invitations", value: memberships.filter((m) => m.status === "Pending").length.toString(), icon: MessageSquare, color: "text-amber-400" },
    ]
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {counts.map((stat) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`glass-card rounded-2xl p-5 ${stat.color}`}
              >
                <div className="w-10 h-10 rounded-xl bg-brand-surface-elevated flex items-center justify-center mb-3">
                  <Icon size={20} />
                </div>
                <p className="text-2xl font-bold font-mono text-brand-text-primary">{stat.value}</p>
                <p className="text-xs text-brand-text-muted mt-1">{stat.label}</p>
              </motion.div>
            )
          })}
        </div>
        {memberships.length > 0 && (
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">
              Recent Members
            </h4>
            <div className="space-y-2">
              {memberships.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0">
                  <div>
                    <p className="text-xs font-semibold text-brand-text-primary">{m.user}</p>
                    <p className="text-[10px] font-mono text-brand-text-muted">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-brand-text-muted">{m.role}</span>
                    <StatusPill status={m.status} variant={m.status === "Active" ? "success" : m.status === "Pending" ? "warning" : "danger"} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Billing ─────────────────────────────────────────────────
  const renderBillingTab = () => (
    <div className="space-y-4">
      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No billing records"
          description="No invoices found for this organization."
        />
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <ResponsiveTable
            columns={[
              {
                key: "date",
                label: "Date",
                mobileOrder: 1,
                render: (inv) => (
                  <span className="text-xs text-brand-text-primary">{inv.date}</span>
                ),
              },
              {
                key: "id",
                label: "Invoice",
                mobileOrder: 2,
                render: (inv) => (
                  <span className="text-xs font-mono text-brand-text-primary">{inv.id}</span>
                ),
              },
              {
                key: "plan",
                label: "Plan",
                mobileOrder: 3,
                render: (inv) => (
                  <span className="text-xs text-brand-text-muted">{inv.plan}</span>
                ),
              },
              {
                key: "amount",
                label: "Amount",
                mobileOrder: 4,
                render: (inv) => (
                  <span className="text-xs font-mono text-brand-text-primary">{inv.amount}</span>
                ),
              },
              {
                key: "status",
                label: "Status",
                mobileOrder: 5,
                render: (inv) => (
                  <StatusPill status={inv.status} variant={inv.status === "Paid" ? "success" : inv.status === "Pending" ? "warning" : "neutral"} />
                ),
              },
            ] as ResponsiveColumn<any>[]}
            data={invoices}
            keyExtractor={(inv) => inv.id}
          />
        </div>
      )}
    </div>
  )

  // ── Support ─────────────────────────────────────────────────
  const renderSupportTab = () => (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No support tickets"
          description="This organization has no support tickets."
        />
      ) : (
        tickets.map((ticket, i) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card rounded-2xl p-5 space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-brand-text-primary">{ticket.subject}</span>
                  <StatusPill status={ticket.status} variant={TICKET_PILL[ticket.status] || "neutral"} />
                </div>
                <p className="text-[10px] font-mono text-brand-text-muted line-clamp-2">{ticket.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[9px] font-mono text-brand-text-muted block">{ticket.priority}</span>
                <span className="text-[9px] font-mono text-brand-text-muted">{ticket.category}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-mono text-brand-text-muted">
              <span>By: {ticket.createdBy}</span>
              {ticket.assignedToName && <span>Assigned: {ticket.assignedToName}</span>}
              <span>{timeAgo(ticket.createdAt)}</span>
            </div>
          </motion.div>
        ))
      )}
    </div>
  )

  // ── Audit ───────────────────────────────────────────────────
  const renderAuditTab = () => (
    <div className="space-y-4">
      {auditLogs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit entries"
          description="No audit log entries found for this organization."
        />
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <ResponsiveTable
            columns={[
              {
                key: "action",
                label: "Action",
                mobileOrder: 1,
                render: (log) => (
                  <span className="text-xs text-brand-text-primary">{log.action}</span>
                ),
              },
              {
                key: "user",
                label: "User",
                mobileOrder: 2,
                render: (log) => (
                  <span className="text-xs font-mono text-brand-text-muted">{log.user}</span>
                ),
              },
              {
                key: "category",
                label: "Category",
                mobileOrder: 3,
                render: (log) => (
                  <span className="text-[10px] font-mono text-brand-text-muted">{log.category}</span>
                ),
              },
              {
                key: "severity",
                label: "Severity",
                mobileOrder: 4,
                render: (log) => (
                  <span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${AUDIT_SEV[log.severity] || "text-brand-text-muted bg-brand-surface-elevated"}`}>
                    {log.severity}
                  </span>
                ),
              },
              {
                key: "timestamp",
                label: "Time",
                mobileOrder: 5,
                render: (log) => (
                  <span className="text-[10px] font-mono text-brand-text-muted">{log.timestamp}</span>
                ),
              },
            ] as ResponsiveColumn<any>[]}
            data={auditLogs}
            keyExtractor={(log) => log.id}
          />
        </div>
      )}
    </div>
  )

  // ── Notes ───────────────────────────────────────────────────
  const renderNotesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-brand-text-muted">{orgNotes.length} note{orgNotes.length !== 1 ? "s" : ""}</p>
      </div>
      {orgNotes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No internal notes"
          description="There are no internal notes for this organization."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orgNotes.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-gold/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-brand-gold">{note.author.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-brand-text-primary">{note.author}</span>
                    <span className="text-[9px] font-mono text-brand-text-muted">{timeAgo(note.createdAt)}</span>
                  </div>
                  <p className="text-xs text-brand-text-muted leading-relaxed">{note.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview": return renderOverviewTab()
      case "subscription": return renderSubscriptionTab()
      case "health": return renderHealthTab()
      case "timeline": return renderTimelineTab()
      case "events": return renderEventsTab()
      case "members": return renderMembersTab()
      case "billing": return renderBillingTab()
      case "support": return renderSupportTab()
      case "audit": return renderAuditTab()
      case "notes": return renderNotesTab()
      default: return null
    }
  }

  return (
    <>
      <SeoHead meta={{ title: `${org.organizationName} — Platform Console | ORIVIS`, noindex: true }} />
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Organizations", href: "/platform/organizations" },
            { label: org.organizationName },
          ]}
        />

        {/* Header */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-brand-surface-elevated flex items-center justify-center shrink-0">
                <Building2 size={28} className="text-brand-gold" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-brand-text-primary">
                    {org.organizationName}
                  </h1>
                  <StatusPill status={org.status} variant={STATUS_MAP[org.status] || "neutral"} />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-brand-text-muted">
                  <span>{org.slug}</span>
                  <span className="w-1 h-1 rounded-full bg-brand-text-disabled" />
                  <span>{org.plan}</span>
                </div>
              </div>
            </div>

            {/* Platform Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowWorkspaceModal(true)}
                className="flex items-center gap-1.5 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>Enter Workspace</span>
              </motion.button>
              {(org.status === "ACTIVE" || org.status === "PENDING") && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1.5 bg-status-error/10 hover:bg-status-error/20 text-status-error border border-status-error/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <PauseCircle size={14} />
                  <span>Suspend</span>
                </motion.button>
              )}
              {org.status === "SUSPENDED" && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1.5 bg-status-success/10 hover:bg-status-success/20 text-status-success border border-status-success/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <PlayCircle size={14} />
                  <span>Reactivate</span>
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/platform/audit")}
                className="flex items-center gap-1.5 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/30 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <ScrollText size={14} />
                <span>View Audit</span>
              </motion.button>
            </div>
          </div>
        </div>

        <TabNav tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

        {renderTabContent()}
      </div>

      <WorkspaceAccessDialog
        open={showWorkspaceModal}
        organizationName={org.organizationName}
        onClose={() => setShowWorkspaceModal(false)}
        onAccess={(mode, options) => {
          setShowWorkspaceModal(false)
          enterInspection(org.organizationId, org.organizationName, mode, options)
        }}
        canFullControl={canManage}
      />
    </>
  )
}

// ── Small helpers ─────────────────────────────────────────────
function ProfileField({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated flex items-center justify-center text-brand-text-muted">
        <Icon size={14} />
      </div>
      <div>
        <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">{label}</p>
        <p className="text-xs text-brand-text-primary">{value}</p>
      </div>
    </div>
  )
}

function QuickRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono text-brand-text-muted">{label}</span>
      <span className="text-xs font-bold text-brand-text-primary">{value}</span>
    </div>
  )
}

function SubRow({ icon: Icon, label, value }: { icon: typeof CreditCard; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated flex items-center justify-center text-brand-text-muted shrink-0">
        <Icon size={14} />
      </div>
      <div>
        <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">{label}</p>
        <p className="text-xs text-brand-text-primary">{value}</p>
      </div>
    </div>
  )
}
