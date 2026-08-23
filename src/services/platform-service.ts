import { getApiClient, unwrapPayload, readOrNull, type ApiResponseWithMeta } from '../lib/api-client';
import { API } from '../constants/api';
import { formatMoney } from '../lib/currency';
import type {
  OrganizationHealth,
  PlatformActivity,
  PlatformAuditLog,
  PlatformCommercialOverview,
  PlatformElection,
  PlatformFinanceAnalytics,
  PlatformFreeEventFlag,
  PlatformInvoice,
  PlatformMembership,
  PlatformNotification,
  PlatformPayment,
  PlatformPlan,
  PlatformPricingTier,
  PlatformRole,
  PlatformStaff,
  PlatformSystemHealth,
  PlatformUser,
  Permission,
  SupportTicket,
  SubscriptionRecord,
  TicketMessage,
  WorkspaceSession,
  WorkspaceSessionMode,
  WorkspaceView,
  TelemetryMetric,
  TelemetrySummary,
  HealthIncident,
  DependencyMap,
} from '../types/platform';

function timeAgo(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const QUICK_ACTIONS: DashboardQuickAction[] = [
  { id: 'q1', label: 'View Organizations', description: 'Monitor active organizations', icon: 'Building2', path: '/platform/organizations', color: 'text-brand-gold' },
  { id: 'q2', label: 'View Reports', description: 'Analytics and platform reports', icon: 'BarChart3', path: '/platform/analytics', color: 'text-status-info' },
  { id: 'q3', label: 'View Subscriptions', description: 'Billing and subscription plans', icon: 'CreditCard', path: '/platform/subscriptions', color: 'text-brand-text-muted' },
  { id: 'q4', label: 'System Settings', description: 'Configure platform preferences', icon: 'SlidersHorizontal', path: '/platform/settings', color: 'text-status-info' },
];

// ---------------------------------------------------------------------------
// Raw API shapes (mirror backend model serialization)
// ---------------------------------------------------------------------------

interface RawUser {
  id: number;
  uuid: string;
  name: string;
  email: string;
  username: string | null;
  display_name: string;
  phone: string | null;
  avatar_url: string | null;
  status: string;
  user_type: string;
  theme: string;
  last_login_at: string | null;
  organization_id: number | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  organizations?: RawOrgWithPivot[];
  platform_staff?: RawPlatformStaff | null;
}

interface RawOrgWithPivot extends RawOrganization {
  pivot: {
    organization_id: number;
    user_id: number;
    role: string;
    status: string;
    joined_at: string | null;
    created_at: string;
    updated_at: string;
  };
}

interface RawOrganization {
  id: number;
  uuid: string;
  orivis_id?: string;
  name: string;
  slug: string;
  registration_number: string | null;
  email: string;
  phone: string | null;
  type: string;
  country: string | null;
  state: string | null;
  city: string | null;
  website: string | null;
  address: string | null;
  logo_url: string | null;
  cover_url: string | null;
  timezone: string;
  locale: string;
  status: string;
  visibility: string;
  trial_ends_at: string | null;
  email_verified_at: string | null;
  provisioned_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  users_count?: number;
  elections_count?: number;
  support_tickets_count?: number;
  subscription?: RawSubscription | null;
  owner?: RawUser | null;
}

interface RawPlan {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  is_active: boolean;
  is_free: boolean;
  sort_order: number;
  features: string[] | null;
  limits: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface RawSubscription {
  id: number;
  uuid: string;
  organization_id: number;
  plan_id: number;
  status: string;
  renewal_state: string;
  starts_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  seats: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  organization?: RawOrganization | null;
  plan?: RawPlan | null;
}

interface RawPlatformStaff {
  id: number;
  uuid: string;
  user_id: number;
  role_id: number | null;
  status: string;
  joined_at: string | null;
  last_active_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  user?: RawUser | null;
  role?: RawRole | null;
}

interface RawRole {
  id: number;
  uuid: string;
  organization_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  staff_count?: number;
  permissions_count?: number;
}

interface RawPermissionGroup {
  group: string;
  permissions: { key: string; label: string }[];
}

interface RawSupportTicket {
  id: number;
  uuid: string;
  organization_id: number | null;
  user_id: number;
  reference: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: number | null;
  accepted_by: number | null;
  accepted_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  first_response_at: string | null;
  created_at: string;
  updated_at: string;
  user?: RawUser | null;
  organization?: RawOrganization | null;
  assignee?: RawUser | null;
  accepted_by_user?: RawUser | null;
  acceptedBy?: RawUser | null;
  messages?: RawTicketMessage[];
}

interface RawTicketMessage {
  id: number;
  uuid: string;
  ticket_id: number;
  user_id: number | null;
  body: string;
  is_internal: boolean;
  message_type: string | null;
  file_path: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  voice_duration: number | null;
  created_at: string;
  updated_at: string;
  user?: RawUser | null;
}

interface RawNotification {
  id: number;
  uuid: string;
  organization_id: number | null;
  user_id: number | null;
  type: string;
  priority: string;
  level: string | null;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  action_type: string | null;
  action_id: string | null;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
  organization?: RawOrganization | null;
  user?: RawUser | null;
}

interface RawAuditLog {
  id: number;
  organization_id: number | null;
  user_id: number | null;
  event: string;
  auditable_type: string | null;
  auditable_id: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  user?: RawUser | null;
}

interface RawFreeEventFlag {
  id: number;
  uuid: string;
  severity: 'low' | 'medium' | 'high';
  reason: string | null;
  signals: Record<string, unknown> | null;
  is_blocked: boolean;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  organization?: { id: number; uuid: string; name: string; slug: string; email: string; status: string } | null;
  election?: { id: number; uuid: string; title: string; estimated_participants: number | null; lifecycle_state: string } | null;
}

interface RawPlatformPayment {
  id: number;
  uuid: string;
  provider: string;
  reference: string;
  provider_reference: string | null;
  status: 'pending' | 'verified' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  verified_at: string | null;
  paid_at: string | null;
  created_at: string;
  organization?: { id: number; uuid: string; name: string } | null;
  election?: { id: number; uuid: string; title: string } | null;
}

interface RawPricingTier {
  id: number;
  uuid: string;
  name: string;
  code: string;
  description: string | null;
  min_participants: number;
  max_participants: number;
  price: number;
  currency: string;
  is_free: boolean;
  is_active: boolean;
  sort_order: number;
  effective_from: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// UI-facing derived shapes
// ---------------------------------------------------------------------------

export interface DashboardStatCard {
  id: string;
  label: string;
  value: number;
  insight: string;
  prefix?: string;
  suffix?: string;
  formattedValue?: string;
  trend?: number;
  trendLabel?: string;
  icon: string;
}

export interface DashboardActivity {
  id: string;
  event: string;
  time: string;
  type: 'create' | 'publish' | 'import' | 'system' | 'alert';
}

export interface DashboardNotification {
  id: string;
  title: string;
  preview: string;
  time: string;
  read: boolean;
  type: 'system' | 'org' | 'election' | 'alert';
}

export interface DashboardQuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  path: string;
  color: string;
}

export interface PlatformDashboardData {
  stats: DashboardStatCard[];
  activities: DashboardActivity[];
  notifications: DashboardNotification[];
  quickActions: DashboardQuickAction[];
  activityTrend: { date: string; count: number }[];
  orgStatus: { name: string; value: number; color: string }[];
  subscriptions: { total: number; active: number; trialing: number; expired: number; mrr: number; upcomingRenewals: number; currency: string };
  revenue: { byCurrency: Record<string, number> } | null;
  elections: { total: number; active: number; live: number; completed: number };
  organizations: { total: number; active: number; suspended: number; archived: number; newThisMonth: number };
  activity: { today: number; last7Days: number };
}

export interface PlatformOrganizationDetail {
  organization: OrganizationHealth;
  counts: { users: number; elections: number; supportTickets: number };
  subscription: RawSubscription | null;
  workspace: { workspaceName: string; setupProgress: number; hasBranding: boolean } | null;
  storage: { bytes: number; megabytes: number };
  lastActivity: { event: string; at: string; actor: string } | null;
  activities: PlatformActivity[];
  auditLogs: PlatformAuditLog[];
  tickets: SupportTicket[];
  memberships: PlatformMembership[];
}

export interface PlatformList<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface ListQuery {
  search?: string;
  status?: string;
  category?: string;
  type?: string;
  priority?: string;
  severity?: string;
  isBlocked?: boolean;
  resolved?: boolean;
  page?: number;
  perPage?: number;
}

export interface PlatformAnalyticsData {
  stats: {
    votes: { total: number; thisMonth: number; lastMonth: number };
    voters: { total: number; verified: number };
    turnout: number;
    electionsCompleted: number;
  };
  electionBreakdown: {
    total: number;
    active: number;
    live: number;
    completed: number;
    byStatus: { status: string; count: number }[];
  };
  activity: { last30Days: number; prior30Days: number };
  growth: { month: string; organizations: number; users: number; votes: number }[];
  deviceDistribution: { label: string; percentage: number }[];
  topOrganizations: { name: string; users: number; elections: number }[];
  recentOrganizations: { uuid: string; name: string; status: string; created_at: string }[];
}

export interface PlatformBillingData {
  summary: {
    mrr: number;
    currency: string;
    activeSubscriptions: number;
    avgRevenuePerOrg: number;
    pendingInvoices: number;
    outstandingAmount: number;
    churnRate: number;
  };
  revenueByPlan: { plan: string; currency: string; revenue: number; percent: number; subscribers: number }[];
  topCustomers: { name: string; revenue: number; currency: string; initials: string }[];
  outstanding: { org: string; amount: number; currency: string; status: string; ends_at: string | null }[];
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function toStatus(status: string | undefined, fallback: string): string {
  if (!status) return fallback;
  const map: Record<string, string> = {
    active: 'ACTIVE',
    suspended: 'SUSPENDED',
    banned: 'SUSPENDED',
    pending: 'PENDING',
    provisioning: 'PROVISIONING',
    inactive: 'INACTIVE',
    invited: 'INVITED',
    deactivated: 'DEACTIVATED',
    open: 'OPEN',
    assigned: 'ASSIGNED',
    in_progress: 'IN_PROGRESS',
    waiting: 'WAITING',
    resolved: 'RESOLVED',
    closed: 'CLOSED',
    trialing: 'TRIALING',
    canceled: 'CANCELLED',
    expired: 'EXPIRED',
    past_due: 'PAST_DUE',
  };
  return map[status] ?? status;
}

function orgHealthStatus(status: string | undefined): string {
  if (!status) return 'UNKNOWN';
  const map: Record<string, string> = {
    active: 'ACTIVE',
    suspended: 'SUSPENDED',
    trial: 'TRIAL',
    expired: 'EXPIRED',
  };
  return map[status] ?? status;
}

function workspaceStatus(status: string | undefined): OrganizationHealth['workspaceStatus'] {
  if (status === 'suspended') return 'critical';
  if (status === 'trial') return 'attention';
  return 'healthy';
}

function severityOf(event: string): 'info' | 'warning' | 'critical' {
  const lower = event.toLowerCase();
  if (lower.includes('suspend') || lower.includes('delete') || lower.includes('archive') || lower.includes('reject') || lower.includes('fail') || lower.includes('denied')) return 'critical';
  if (lower.includes('update') || lower.includes('approve') || lower.includes('close') || lower.includes('cancel')) return 'warning';
  return 'info';
}

function mapOrganization(raw: RawOrganization): OrganizationHealth {
  const sub = raw.subscription;
  return {
    organizationId: raw.uuid,
    organizationName: raw.name,
    orivisId: raw.orivis_id,
    slug: raw.slug,
    logoUrl: raw.logo_url,
    status: orgHealthStatus(raw.status),
    subscription: sub ? toStatus(sub.status, sub.status) : 'NONE',
    plan: sub?.plan?.name ?? (sub?.plan_id ? 'Subscribed' : '—'),
    activeEvents: raw.elections_count ?? 0,
    members: raw.users_count ?? 0,
    admins: 0,
    email: raw.email,
    phone: raw.phone,
    storageUsed: 0,
    storageTotal: 0,
    lastActivity: raw.updated_at,
    country: raw.country ?? '—',
    dateJoined: raw.created_at,
    workspaceStatus: workspaceStatus(raw.status),
    assistedEventsEnabled: (raw as any).assisted_events_enabled ?? false,
  };
}

function mapUser(raw: RawUser): PlatformUser {
  const primaryOrg = raw.organizations?.[0];
  return {
    id: raw.uuid,
    name: raw.display_name || raw.name,
    email: raw.email,
    role: primaryOrg?.pivot?.role ?? '—',
    status: toStatus(raw.status, 'Active') as PlatformUser['status'],
    org: primaryOrg?.name ?? '—',
    joined: raw.created_at,
    lastLogin: raw.last_login_at ?? 'Never',
    emailVerified: raw.email_verified_at !== null,
    mfaEnabled: false,
    lifecycleState: raw.status,
  };
}

function mapStaff(raw: RawPlatformStaff): PlatformStaff {
  const user = raw.user;
  return {
    id: raw.uuid,
    name: user?.display_name || user?.name || 'Unknown',
    email: user?.email ?? '—',
    avatarUrl: user?.avatar_url ?? null,
    department: 'TECHNICAL_SUPPORT',
    role: (raw.role?.name ?? 'Support').toUpperCase().replace(/ /g, '_') as PlatformStaff['role'],
    status: toStatus(raw.status, 'ACTIVE') as PlatformStaff['status'],
    lastActive: raw.last_active_at ?? raw.joined_at ?? raw.updated_at,
    joinedAt: raw.joined_at ?? raw.created_at,
    permissions: [],
  };
}

function mapRole(raw: RawRole): PlatformRole {
  return {
    id: raw.uuid,
    name: raw.name,
    description: raw.description ?? '',
    type: raw.is_system ? 'SYSTEM' : 'CUSTOM',
    isProtected: raw.is_system,
    isArchived: !raw.is_active,
    permissions: [],
    permissionCount: raw.permissions_count ?? 0,
    staffCount: raw.staff_count ?? 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

const PERMISSION_GROUP_MAP: Record<string, Permission['group']> = {
  Dashboard: 'PLATFORM',
  Organizations: 'PLATFORM',
  Users: 'PLATFORM',
  Staff: 'PLATFORM',
  'Roles & Permissions': 'PLATFORM',
  Subscriptions: 'FINANCE',
  Audit: 'AUDIT',
  Notifications: 'PLATFORM',
  Support: 'SUPPORT',
  Reports: 'ANALYTICS',
  Elections: 'EVENTS',
  Candidates: 'EVENTS',
  Voters: 'EVENTS',
  Participants: 'EVENTS',
  Voting: 'EVENTS',
  Results: 'EVENTS',
  Team: 'PLATFORM',
  Settings: 'SETTINGS',
  Workspace: 'PLATFORM',
  Finance: 'FINANCE',
  Security: 'SECURITY',
};

function mapPermissions(groups: RawPermissionGroup[]): Permission[] {
  return groups.flatMap((g) =>
    g.permissions.map((p) => ({
      id: p.key,
      key: p.key,
      label: p.label,
      group: PERMISSION_GROUP_MAP[g.group] ?? 'PLATFORM',
      description: p.label,
    })),
  );
}

function mapTicket(raw: RawSupportTicket): SupportTicket {
  const msgToView = (m: RawTicketMessage): TicketMessage => ({
    id: m.uuid,
    author: m.user?.display_name || m.user?.name || 'Unknown',
    authorRole: m.is_internal ? 'STAFF' : 'ORGANIZATION',
    content: m.body,
    messageType: (m.message_type as TicketMessage['messageType']) || 'text',
    fileUrl: m.file_url ?? m.file_path ?? null,
    fileName: m.file_name ?? null,
    fileSize: m.file_size ?? null,
    fileType: m.file_type ?? null,
    voiceDuration: m.voice_duration ?? null,
    createdAt: m.created_at,
  });
  return {
    id: raw.uuid,
    subject: raw.subject,
    description: raw.description,
    status: toStatus(raw.status, 'OPEN') as SupportTicket['status'],
    priority: toStatus(raw.priority, 'MEDIUM') as SupportTicket['priority'],
    category: (raw.category === 'feature_request' ? 'FEATURE_REQUEST' : raw.category === 'bug' || raw.category === 'security' ? 'OTHER' : toStatus(raw.category, 'OTHER')) as SupportTicket['category'],
    organizationName: raw.organization?.name ?? '—',
    organizationId: raw.organization?.uuid ?? '',
    assignedTo: raw.assignee?.uuid ?? null,
    assignedToName: raw.assignee?.display_name || raw.assignee?.name || null,
    acceptedBy: raw.acceptedBy?.uuid ?? raw.accepted_by_user?.uuid ?? null,
    acceptedByName: raw.acceptedBy?.display_name || raw.acceptedBy?.name || raw.accepted_by_user?.display_name || raw.accepted_by_user?.name || null,
    acceptedAt: raw.accepted_at,
    createdBy: raw.user?.display_name || raw.user?.name || 'Unknown',
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    messages: raw.messages?.map(msgToView) ?? [],
  };
}

const NOTIF_TYPE_MAP: Record<string, PlatformNotification['type']> = {
  org_announcement: 'ORG_REGISTRATION',
  event: 'EVENT_PUBLISH_REQUEST',
  platform_alert: 'SECURITY_ALERT',
  security_alert: 'SECURITY_ALERT',
  platform_announcement: 'PLATFORM_ANNOUNCEMENT',
  system: 'PLATFORM_ANNOUNCEMENT',
};

const NOTIF_PRIORITY_MAP: Record<string, PlatformNotification['priority']> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  critical: 'critical',
};

const NOTIF_LEVEL_MAP: Record<string, PlatformNotification['level']> = {
  info: 'normal',
  success: 'normal',
  warning: 'important',
  critical: 'critical',
};

function mapNotification(raw: RawNotification): PlatformNotification {
  return {
    id: raw.uuid,
    type: NOTIF_TYPE_MAP[raw.type] ?? 'PLATFORM_ANNOUNCEMENT',
    title: raw.title,
    description: raw.body ?? '',
    read: raw.read_at !== null,
    actionable: raw.data !== null && raw.data !== undefined,
    actionPath: raw.action_type === 'election' && raw.action_id && raw.organization_id
      ? `/platform/organizations/${raw.organization_id}/workspace`
      : undefined,
    priority: NOTIF_PRIORITY_MAP[raw.priority] ?? 'info',
    level: (raw.level as PlatformNotification['level']) ?? NOTIF_LEVEL_MAP[raw.priority] ?? 'normal',
    createdAt: raw.created_at,
  };
}

function mapAuditLog(raw: RawAuditLog): PlatformAuditLog {
  const category = raw.event.split('.')[0] ?? 'system';
  return {
    id: String(raw.id),
    action: raw.event,
    user: raw.user?.display_name || raw.user?.name || 'System',
    category,
    severity: severityOf(raw.event) === 'critical' ? 'Critical' : severityOf(raw.event) === 'warning' ? 'Warning' : 'Info',
    timestamp: raw.created_at,
    oldValues: raw.old_values ?? null,
    newValues: raw.new_values ?? null,
    ipAddress: raw.ip_address ?? null,
    userAgent: raw.user_agent ?? null,
    auditableType: raw.auditable_type ?? null,
    auditableId: raw.auditable_id ?? null,
    organizationId: raw.organization_id ?? null,
    userId: raw.user_id ?? null,
  };
}

function mapFreeEventFlag(raw: RawFreeEventFlag): PlatformFreeEventFlag {
  return {
    id: String(raw.id),
    uuid: raw.uuid,
    severity: raw.severity,
    reason: raw.reason,
    signals: raw.signals,
    isBlocked: raw.is_blocked,
    resolved: raw.resolved,
    resolvedAt: raw.resolved_at,
    createdAt: raw.created_at,
    organization: raw.organization ?? null,
    election: raw.election
      ? {
          id: raw.election.id,
          uuid: raw.election.uuid,
          title: raw.election.title,
          estimatedParticipants: raw.election.estimated_participants,
          lifecycleState: raw.election.lifecycle_state,
        }
      : null,
  };
}

function mapPlatformPayment(raw: RawPlatformPayment): PlatformPayment {
  return {
    id: raw.id,
    uuid: raw.uuid,
    provider: raw.provider,
    reference: raw.reference,
    providerReference: raw.provider_reference,
    status: raw.status,
    amount: raw.amount,
    currency: raw.currency,
    verifiedAt: raw.verified_at,
    paidAt: raw.paid_at,
    createdAt: raw.created_at,
    organization: raw.organization ?? null,
    election: raw.election ?? null,
  };
}

function mapPricingTier(raw: RawPricingTier): PlatformPricingTier {
  return {
    id: raw.id,
    uuid: raw.uuid,
    name: raw.name,
    code: raw.code,
    description: raw.description,
    minParticipants: raw.min_participants,
    maxParticipants: raw.max_participants,
    price: Number(raw.price),
    currency: raw.currency,
    isFree: raw.is_free,
    isActive: raw.is_active,
    sortOrder: raw.sort_order,
    effectiveFrom: raw.effective_from,
    archivedAt: raw.archived_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapPlan(raw: RawPlan): PlatformPlan {
  return {
    id: raw.uuid,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    price: Number(raw.price),
    currency: raw.currency,
    interval: raw.interval,
    isActive: raw.is_active,
    isFree: raw.is_free,
    sortOrder: raw.sort_order,
    features: raw.features ?? null,
    limits: raw.limits ?? null,
  };
}

function mapActivity(raw: RawAuditLog): PlatformActivity {
  return {
    id: String(raw.id),
    actor: raw.user?.display_name || raw.user?.name || 'System',
    action: raw.event,
    target: raw.auditable_type ? raw.auditable_type.split('\\').pop() ?? '' : '',
    targetType: raw.auditable_type ?? '',
    organizationId: raw.organization_id ? String(raw.organization_id) : undefined,
    timestamp: raw.created_at,
    severity: severityOf(raw.event),
  };
}

export function mapSubscription(raw: RawSubscription): SubscriptionRecord {
  const priceValue = Number(raw.plan?.price ?? 0)
  const currency = raw.plan?.currency ?? 'NGN'
  return {
    id: raw.uuid,
    organizationId: raw.organization?.uuid ?? String(raw.organization_id),
    organizationName: raw.organization?.name ?? '—',
    plan: (raw.plan?.name ?? 'CUSTOM').toUpperCase().replace(/[^A-Z0-9]/g, '') as SubscriptionRecord['plan'],
    status: toStatus(raw.status, 'ACTIVE') as SubscriptionRecord['status'],
    maxVoters: raw.seats,
    price: raw.plan ? formatMoney(priceValue, currency) : '—',
    priceValue,
    currency,
    startedAt: raw.starts_at ?? raw.created_at,
    expiresAt: raw.ends_at ?? '—',
    renewedAt: raw.updated_at,
    cancelledAt: raw.cancelled_at ?? undefined,
    paymentMethod: '—',
  };
}

function mapElection(raw: Record<string, unknown>): PlatformElection {
  const statusMap: Record<string, string> = {
    draft: 'Draft',
    created: 'Created',
    pending_review: 'Pending Review',
    approved: 'Upcoming',
    scheduled: 'Upcoming',
    published: 'Upcoming',
    live: 'Live',
    paused: 'Live',
    ended: 'Concluded',
    closed: 'Concluded',
    certified: 'Concluded',
    archived: 'Concluded',
    cancelled: 'Concluded',
  };
  return {
    id: String(raw.uuid ?? raw.reference ?? ''),
    name: String(raw.title ?? raw.name ?? 'Untitled'),
    org: String(raw.organization ?? '—'),
    status: statusMap[String(raw.status ?? '')] ?? String(raw.status ?? 'Unknown'),
    voters: Number(raw.voters ?? 0),
    turnout: Number(raw.turnout_pct ?? 0),
    created: String(raw.created_at ?? ''),
  };
}

function mapMembership(raw: RawUser): PlatformMembership {
  const primaryOrg = raw.organizations?.[0];
  return {
    id: primaryOrg ? `m-${raw.uuid}-${primaryOrg.uuid}` : `m-${raw.uuid}`,
    user: raw.display_name || raw.name,
    email: raw.email,
    org: primaryOrg?.name ?? '—',
    role: primaryOrg?.pivot?.role ?? '—',
    status: primaryOrg ? (toStatus(primaryOrg.pivot.status, 'Active') as PlatformMembership['status']) : 'Pending',
    joined: primaryOrg?.pivot?.joined_at ?? raw.created_at,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const platformService = {
  // --- Dashboard ---
  async getDashboard(): Promise<PlatformDashboardData> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.DASHBOARD);
    const raw = unwrapPayload<{
      organizations: { total: number; active: number; suspended: number; archived: number; newThisMonth: number };
      elections: { total: number; active: number; live: number; completed: number };
      subscriptions: { total: number; active: number; trialing: number; expired: number; mrr: number; upcomingRenewals: number; currency: string };
      activity: { today: number; last7Days: number };
    }>(data);

    const s = raw;
    const sub = {
      total: s.subscriptions?.total ?? 0,
      active: s.subscriptions?.active ?? 0,
      trialing: s.subscriptions?.trialing ?? 0,
      expired: s.subscriptions?.expired ?? 0,
      mrr: s.subscriptions?.mrr ?? 0,
      upcomingRenewals: s.subscriptions?.upcomingRenewals ?? 0,
      currency: s.subscriptions?.currency ?? 'NGN',
    };

    const revenueEntries: [string, number][] = [];
    const [activityRes, notifRes, commercialRes] = await Promise.allSettled([
      getApiClient().get<unknown>(`${API.ENDPOINTS.PLATFORM.AUDIT_LOGS}?per_page=100`),
      getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.NOTIFICATIONS),
      getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.COMMERCIAL_OVERVIEW),
    ]);

    let verifiedPayments = 0;
    if (commercialRes.status === 'fulfilled') {
      const commercial = unwrapPayload<PlatformCommercialOverview>(commercialRes.value.data);
      revenueEntries.push(...Object.entries(commercial.revenue?.byCurrency ?? {}).filter(([, v]) => Number(v) > 0));
      verifiedPayments = commercial.payments?.verified ?? 0;
    }

    const revenueStat: DashboardStatCard = revenueEntries.length === 1
      ? { id: 'revenue', label: 'Collected Revenue', value: Math.round(Number(revenueEntries[0][1])), formattedValue: formatMoney(Number(revenueEntries[0][1]), revenueEntries[0][0]), insight: `${verifiedPayments} verified payments`, icon: 'TrendingUp' }
      : revenueEntries.length > 1
        ? { id: 'revenue', label: 'Collected Revenue', value: revenueEntries.length, formattedValue: `${revenueEntries.length} currencies`, insight: 'Revenue tracked per currency', icon: 'TrendingUp' }
        : { id: 'revenue', label: 'Collected Revenue', value: 0, formattedValue: commercialRes.status === 'fulfilled' ? '—' : 'Unavailable', insight: commercialRes.status === 'fulfilled' ? 'No verified payments yet' : 'Revenue data could not be loaded', icon: 'TrendingUp' };

    const stats: DashboardStatCard[] = [
      { id: 'orgs', label: 'Total Organizations', value: s.organizations.total, insight: `${s.organizations.active} active workspaces`, trend: s.organizations.newThisMonth > 0 ? s.organizations.newThisMonth : 0, trendLabel: 'new this month', icon: 'Building2' },
      revenueStat,
      { id: 'events', label: 'Active Elections', value: s.elections.active, insight: `${s.elections.live} live right now`, trend: s.elections.live > 0 ? 12 : 0, suffix: '', trendLabel: 'live', icon: 'Vote' },
      { id: 'renewals', label: 'Renewals Due', value: sub.upcomingRenewals, insight: 'within the next 30 days', icon: 'CalendarCheck2' },
      { id: 'uptime', label: 'Completed Elections', value: s.elections.completed, insight: `${Math.max(0, s.elections.total - s.elections.completed)} remaining`, icon: 'CheckCircle' },
      { id: 'activity', label: 'Today Activity', value: s.activity.today, insight: `${s.activity.last7Days} actions in 7 days`, icon: 'Activity' },
    ];

    let activities: DashboardActivity[] = [];
    let activityLogs: RawAuditLog[] = [];
    if (activityRes.status === 'fulfilled') {
      const logs = unwrapPayload<RawAuditLog[]>(activityRes.value.data);
      activityLogs = logs;
      activities = logs.slice(0, 6).map((log) => ({
        id: String(log.id),
        event: log.event,
        time: timeAgo(log.created_at),
        type: log.event?.toLowerCase().includes('suspend') ? 'alert' : log.event?.toLowerCase().includes('import') ? 'import' : 'create',
      }));
    }

    let notifications: DashboardNotification[] = [];
    if (notifRes.status === 'fulfilled') {
      const notes = unwrapPayload<RawNotification[]>(notifRes.value.data);
      notifications = notes.slice(0, 5).map((n) => {
        const mapped = mapNotification(n);
        const typeMap: Record<string, DashboardNotification['type']> = {
          SECURITY_ALERT: 'alert',
          ORG_REGISTRATION: 'org',
          EVENT_PUBLISH_REQUEST: 'election',
          PLATFORM_ANNOUNCEMENT: 'system',
        };
        return {
          id: mapped.id,
          title: mapped.title,
          preview: mapped.description,
          time: timeAgo(n.created_at),
          read: mapped.read,
          type: typeMap[mapped.type] ?? 'system',
        };
      });
    }

    const activityTrend = (() => {
      const days: { date: string; count: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const count = activityLogs.filter((log) => {
          const t = new Date(log.created_at);
          return !isNaN(t.getTime()) && t.toDateString() === d.toDateString();
        }).length;
        days.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count,
        });
      }
      return days;
    })();

    const orgStatus = [
      { name: 'Active', value: s.organizations.active, color: 'var(--color-status-success)' },
      { name: 'Suspended', value: s.organizations.suspended, color: 'var(--color-status-danger)' },
      { name: 'Archived', value: s.organizations.archived, color: 'var(--color-brand-text-muted)' },
    ].filter((d) => d.value > 0);

    return {
      stats,
      activities,
      notifications,
      quickActions: QUICK_ACTIONS,
      activityTrend,
      orgStatus,
      subscriptions: sub,
      revenue: commercialRes.status === 'fulfilled'
        ? { byCurrency: Object.fromEntries(revenueEntries) }
        : null,
      elections: s.elections,
      organizations: s.organizations,
      activity: s.activity,
    };
  },

  // --- Analytics ---
  async getAnalytics(): Promise<PlatformAnalyticsData> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.ANALYTICS);
    const payload = unwrapPayload<{
      stats: {
        votes: { total: number; thisMonth: number; lastMonth: number };
        voters: { total: number; verified: number };
        turnout: number;
        electionsCompleted: number;
      };
      electionBreakdown: {
        total: number; active: number; live: number; completed: number;
        byStatus: { status: string; count: number }[];
      };
      activity: { last30Days: number; prior30Days: number };
      growth: { month: string; organizations: number; users: number; votes: number }[];
      deviceDistribution: { label: string; percentage: number }[];
      topOrganizations: RawOrganization[];
      recentOrganizations: { uuid: string; name: string; status: string; created_at: string }[];
    }>(data);

    return {
      stats: payload.stats,
      electionBreakdown: payload.electionBreakdown,
      activity: payload.activity,
      growth: payload.growth ?? [],
      deviceDistribution: payload.deviceDistribution ?? [],
      topOrganizations: (payload.topOrganizations ?? []).map((org) => ({
        name: org.name,
        users: org.users_count ?? 0,
        elections: org.elections_count ?? 0,
      })),
      recentOrganizations: payload.recentOrganizations ?? [],
    };
  },

  // --- System health (observability) ---
  async getMonitoringHealth(): Promise<PlatformSystemHealth> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.MONITORING_HEALTH);
    return unwrapPayload<PlatformSystemHealth>(data);
  },

  async getMonitoringMetrics(category: string, hours: number = 24): Promise<TelemetryMetric[]> {
    const { data } = await getApiClient().get<unknown>(`${API.ENDPOINTS.PLATFORM.MONITORING_METRICS}?category=${encodeURIComponent(category)}&hours=${hours}`);
    return unwrapPayload<TelemetryMetric[]>(data);
  },

  async getMonitoringSummary(hours: number = 24): Promise<Record<string, TelemetrySummary>> {
    const { data } = await getApiClient().get<unknown>(`${API.ENDPOINTS.PLATFORM.MONITORING_SUMMARY}?hours=${hours}`);
    return unwrapPayload<Record<string, TelemetrySummary>>(data);
  },

  async getMonitoringIncidents(limit: number = 20): Promise<HealthIncident[]> {
    const { data } = await getApiClient().get<unknown>(`${API.ENDPOINTS.PLATFORM.MONITORING_INCIDENTS}?limit=${limit}`);
    return unwrapPayload<HealthIncident[]>(data);
  },

  async getMonitoringDependencies(): Promise<DependencyMap> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.MONITORING_DEPENDENCIES);
    return unwrapPayload<DependencyMap>(data);
  },

  async triggerTelemetryCollection(): Promise<{ collected: number; recorded_at: string }> {
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.PLATFORM.MONITORING_COLLECT);
    return unwrapPayload<{ collected: number; recorded_at: string }>(data);
  },

  // --- Billing overview (legacy monthly model) ---
  async getBilling(): Promise<PlatformBillingData> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.BILLING);
    return unwrapPayload<PlatformBillingData>(data);
  },

  // --- Commercial overview (per election billing model) ---
  async getCommercialOverview(): Promise<PlatformCommercialOverview> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.COMMERCIAL_OVERVIEW);
    return unwrapPayload<PlatformCommercialOverview>(data);
  },

  // --- Finance analytics (local NGN / international USD) ---
  async getFinanceAnalytics(): Promise<PlatformFinanceAnalytics> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.FINANCE_ANALYTICS);
    return unwrapPayload<PlatformFinanceAnalytics>(data);
  },

  // --- Organizations ---
  async getOrganizations(query: ListQuery = {}): Promise<PlatformList<OrganizationHealth>> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    params.set('per_page', String(query.perPage ?? 50));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.PLATFORM.ORGANIZATIONS}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawOrganization[]>(res.data);
    return { items: items.map(mapOrganization), total: res.meta?.total ?? items.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 50 };
  },

  async getOrganization(id: string): Promise<PlatformOrganizationDetail> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.ORGANIZATION(id));
    const payload = unwrapPayload<{
      organization: RawOrganization;
      counts: { users: number; admins: number; elections: number; supportTickets: number };
      subscription: RawSubscription | null;
      workspace: { workspaceName: string; setupProgress: number; hasBranding: boolean } | null;
      storage: { bytes: number; megabytes: number };
      lastActivity: { event: string; at: string; actor: string } | null;
    }>(data);

    const org = payload.organization;
    const detail: PlatformOrganizationDetail = {
      organization: {
        ...mapOrganization(org),
        activeEvents: payload.counts.elections,
        members: payload.counts.users,
        admins: payload.counts.admins ?? 0,
        storageUsed: Math.round(payload.storage.megabytes),
        storageTotal: 0,
        lastActivity: payload.lastActivity?.at ?? org.updated_at,
      },
      counts: payload.counts,
      subscription: payload.subscription,
      workspace: payload.workspace,
      storage: payload.storage,
      lastActivity: payload.lastActivity,
      activities: [],
      auditLogs: [],
      tickets: [],
      memberships: [],
    };

    const [activitiesRes, auditRes, ticketsRes, membersRes] = await Promise.allSettled([
      getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.ORGANIZATION_ACTIVITY(id)),
      getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.ORGANIZATION_AUDIT(id)),
      getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.ORGANIZATION_SUPPORT_TICKETS(id)),
      getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.USERS),
    ]);

    if (activitiesRes.status === 'fulfilled') {
      const act = unwrapPayload<{ event: string; at: string; actor: string } | null>(activitiesRes.value.data);
      if (act) detail.activities.push({ id: `act-${act.at}`, actor: act.actor, action: act.event, target: org.name, targetType: 'Organization', organizationId: id, timestamp: act.at, severity: severityOf(act.event) });
    }
    if (auditRes.status === 'fulfilled') {
      const logs = unwrapPayload<RawAuditLog[]>(auditRes.value.data);
      detail.auditLogs = logs.map(mapAuditLog);
      detail.activities = [...detail.activities, ...logs.map(mapActivity)];
    }
    if (ticketsRes.status === 'fulfilled') {
      const tickets = unwrapPayload<RawSupportTicket[]>(ticketsRes.value.data);
      detail.tickets = tickets.map(mapTicket);
    }
    if (membersRes.status === 'fulfilled') {
      const users = unwrapPayload<RawUser[]>(membersRes.value.data);
      detail.memberships = users.filter((u) => u.organizations?.some((o) => o.uuid === id)).map(mapMembership);
    }

    return detail;
  },

  async toggleAssistedEvents(orgId: string, enabled: boolean): Promise<{ success: boolean; message: string; data: { assisted_events_enabled: boolean } }> {
    const client = await getApiClient()
    const { data } = await client.post(`/platform/organizations/${orgId}/toggle-assisted-events`, { enabled })
    return unwrapPayload(data)
  },

  // --- Users ---
  async getUsers(query: ListQuery = {}): Promise<PlatformList<PlatformUser>> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    params.set('per_page', String(query.perPage ?? 50));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.PLATFORM.USERS}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawUser[]>(res.data);
    const nonStaffItems = items.filter((u) => !u.platform_staff);
    return { items: nonStaffItems.map(mapUser), total: res.meta?.total ?? nonStaffItems.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 50 };
  },

  async getUser(id: string): Promise<PlatformUser | null> {
    return readOrNull(async () => {
      const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.USER(id));
      return mapUser(unwrapPayload<RawUser>(data));
    });
  },

  async sendPasswordReset(userId: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.USER_PASSWORD_RESET(userId));
  },

  async setUserStatus(userId: string, status: string): Promise<void> {
    await getApiClient().put(API.ENDPOINTS.PLATFORM.USER_STATUS(userId), { status });
  },

  // --- Staff ---
  async getStaff(query: ListQuery = {}): Promise<PlatformList<PlatformStaff>> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    params.set('per_page', String(query.perPage ?? 50));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.PLATFORM.STAFF}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawPlatformStaff[]>(res.data);
    return { items: items.map(mapStaff), total: res.meta?.total ?? items.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 50 };
  },

  async inviteStaff(input: { name: string; email: string; role_id?: string; department?: string }): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.STAFF_INVITATIONS, input);
  },

  async getStaffInvitations(): Promise<{ id: string; email: string; role: string | null; status: string; expires_at: string | null; created_at: string }[]> {
    const res = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.STAFF_INVITATIONS) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<{
      uuid: string; email: string; role_id: number | null; status: string;
      expires_at: string | null; created_at: string; role: RawRole | null;
    }[]>(res.data);
    return items.map((i) => ({ id: i.uuid, email: i.email, role: i.role?.name ?? null, status: i.status, expires_at: i.expires_at, created_at: i.created_at }));
  },

  async getStaffMember(id: string): Promise<PlatformStaff | null> {
    return readOrNull(async () => {
      const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.STAFF_MEMBER(id));
      return mapStaff(unwrapPayload<RawPlatformStaff>(data));
    });
  },

  async updateStaff(id: string, input: { role_id?: string; department?: string; status?: string }): Promise<void> {
    await getApiClient().put(API.ENDPOINTS.PLATFORM.STAFF_UPDATE(id), input);
  },

  async deleteStaff(id: string): Promise<void> {
    await getApiClient().delete(API.ENDPOINTS.PLATFORM.STAFF_DELETE(id));
  },

  async setStaffStatus(id: string, status: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.STAFF_STATUS(id), { status });
  },

  async sendStaffPasswordReset(id: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.STAFF_PASSWORD_RESET(id));
  },

  async resendStaffInvitation(id: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.STAFF_INVITATION_RESEND(id));
  },

  async revokeStaffInvitation(id: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.STAFF_INVITATION_REVOKE(id));
  },

  // --- Staff-specific permission overrides ---
  async getStaffPermissions(staffId: string): Promise<{ id: number; permission: string | null; type: string; reason: string | null; granted_by: string | null; created_at: string }[]> {
    const res = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.STAFF_PERMISSIONS(staffId));
    return unwrapPayload<{ id: number; permission: string | null; type: string; reason: string | null; granted_by: string | null; created_at: string }[]>(res.data);
  },

  async grantStaffPermission(staffId: string, permission: string, reason?: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.STAFF_PERMISSION_GRANT(staffId), { permission, reason });
  },

  async revokeStaffPermission(staffId: string, permission: string, reason?: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.STAFF_PERMISSION_REVOKE(staffId), { permission, reason });
  },

  async removeStaffPermissionOverride(staffId: string, permissionName: string): Promise<void> {
    await getApiClient().delete(API.ENDPOINTS.PLATFORM.STAFF_PERMISSION_REMOVE(staffId, permissionName));
  },

  async getStaffPermissionBreakdown(staffId: string): Promise<{ role_permissions: string[]; granted: string[]; revoked: string[]; effective: string[] }> {
    const res = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.STAFF_PERMISSION_BREAKDOWN(staffId));
    const payload = unwrapPayload<{ role_permissions: string[]; granted: string[]; revoked: string[]; effective: string[] }>(res.data);
    return payload;
  },

  // --- Roles & Permissions ---
  async getRoles(): Promise<PlatformRole[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.ROLES);
    return unwrapPayload<RawRole[]>(data).map(mapRole);
  },

  async createRole(input: { name: string; description?: string; permissions?: string[] }): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.ROLES, input);
  },

  async updateRole(roleId: string, input: { name?: string; description?: string; permissions?: string[]; is_active?: boolean }): Promise<void> {
    await getApiClient().put(`${API.ENDPOINTS.PLATFORM.ROLE(roleId)}`, input);
  },

  async archiveRole(roleId: string): Promise<void> {
    await getApiClient().post(`${API.ENDPOINTS.PLATFORM.ROLE(roleId)}/archive`);
  },

  async restoreRole(roleId: string): Promise<void> {
    await getApiClient().post(`${API.ENDPOINTS.PLATFORM.ROLE(roleId)}/restore`);
  },

  async deleteRole(roleId: string): Promise<void> {
    await getApiClient().delete(API.ENDPOINTS.PLATFORM.ROLE(roleId));
  },

  async cloneRole(roleId: string, input?: { name?: string; description?: string }): Promise<void> {
    await getApiClient().post(`${API.ENDPOINTS.PLATFORM.ROLE(roleId)}/clone`, input ?? {});
  },

  async getRolePermissions(roleId: string): Promise<string[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.ROLE(roleId));
    const payload = data as { permissions?: string[] };
    return payload?.permissions ?? [];
  },

  async getPermissions(): Promise<Permission[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.ROLES_PERMISSIONS);
    const payload = unwrapPayload<{ platform: RawPermissionGroup[]; organization: RawPermissionGroup[] }>(data);
    return mapPermissions(payload.platform ?? []);
  },

  // --- Subscriptions & Plans ---
  async getSubscriptions(query: ListQuery = {}): Promise<PlatformList<SubscriptionRecord>> {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    params.set('per_page', String(query.perPage ?? 50));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.PLATFORM.SUBSCRIPTIONS}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawSubscription[]>(res.data);
    return { items: items.map(mapSubscription), total: res.meta?.total ?? items.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 50 };
  },

  async getPlans(): Promise<PlatformPlan[]> {
    const res = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.PLANS) as ApiResponseWithMeta<unknown>;
    return unwrapPayload<RawPlan[]>(res.data).map(mapPlan);
  },

  async cancelSubscription(id: string): Promise<void> {
    await getApiClient().put(`${API.ENDPOINTS.PLATFORM.SUBSCRIPTION_CANCEL(id)}`);
  },

  async getInvoices(): Promise<PlatformInvoice[]> {
    const { items } = await this.getSubscriptions({ perPage: 100 });
    return items.map((s) => ({
      id: s.id,
      org: s.organizationName,
      plan: s.plan,
      amount: s.price,
      status: s.status === 'ACTIVE' ? 'Paid' : 'Pending',
      date: s.startedAt,
    }));
  },

  // --- Elections ---
  async getElections(): Promise<PlatformElection[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.ELECTIONS);
    const payload = unwrapPayload<Record<string, unknown>[]>(data);
    return payload.map(mapElection);
  },

  async approveElection(id: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.APPROVE_ELECTION(id));
  },

  async rejectElection(id: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.REJECT_ELECTION(id));
  },

  // --- Audit Logs ---
  async getAuditLogs(query: ListQuery = {}): Promise<PlatformList<PlatformAuditLog>> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.category) params.set('event', query.category);
    params.set('per_page', String(query.perPage ?? 50));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.PLATFORM.AUDIT_LOGS}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawAuditLog[]>(res.data);
    return { items: items.map(mapAuditLog), total: res.meta?.total ?? items.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 50 };
  },

  async getAuditEvents(): Promise<string[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.AUDIT_EVENTS);
    return unwrapPayload<string[]>(data);
  },

  // --- Free-Event Abuse Flags ---
  async getFreeEventFlags(query: ListQuery = {}): Promise<PlatformList<PlatformFreeEventFlag>> {
    const params = new URLSearchParams();
    if (query.severity) params.set('severity', query.severity);
    if (typeof query.isBlocked === 'boolean') params.set('is_blocked', String(query.isBlocked));
    if (typeof query.resolved === 'boolean') params.set('resolved', String(query.resolved));
    params.set('per_page', String(query.perPage ?? 25));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.PLATFORM.FREE_EVENT_FLAGS}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawFreeEventFlag[]>(res.data);
    return { items: items.map(mapFreeEventFlag), total: res.meta?.total ?? items.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 25 };
  },

  async getFreeEventFlag(id: string): Promise<PlatformFreeEventFlag> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.FREE_EVENT_FLAG(id));
    return mapFreeEventFlag(unwrapPayload<RawFreeEventFlag>(data));
  },

  async resolveFreeEventFlag(id: string, note?: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.FREE_EVENT_FLAG_RESOLVE(id), { note });
  },

  async blockFreeEventFlag(id: string, note?: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.FREE_EVENT_FLAG_BLOCK(id), { note });
  },

  async unblockFreeEventFlag(id: string, note?: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.FREE_EVENT_FLAG_UNBLOCK(id), { note });
  },

  async getPayments(query: ListQuery & { organizationId?: string } = {}): Promise<PlatformList<PlatformPayment>> {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.organizationId) params.set('organization_id', query.organizationId);
    params.set('per_page', String(query.perPage ?? 25));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.PLATFORM.PAYMENTS}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawPlatformPayment[]>(res.data);
    return { items: items.map(mapPlatformPayment), total: res.meta?.total ?? items.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 25 };
  },

  // --- Pricing Tiers ---
  async getPricingTiers(query: ListQuery & { includeArchived?: boolean } = {}): Promise<PlatformList<PlatformPricingTier>> {
    const params = new URLSearchParams();
    if (query.status) params.set('is_active', query.status === 'active' ? '1' : '0');
    if (query.includeArchived) params.set('include_archived', '1');
    if (query.search) params.set('search', query.search);
    params.set('per_page', String(query.perPage ?? 50));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.PLATFORM.PRICING_TIERS}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawPricingTier[]>(res.data);
    return { items: items.map(mapPricingTier), total: res.meta?.total ?? items.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 50 };
  },

  async createPricingTier(input: Record<string, unknown>): Promise<PlatformPricingTier> {
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.PLATFORM.PRICING_TIERS, input);
    const payload = unwrapPayload<RawPricingTier>(data);
    return mapPricingTier(payload);
  },

  async updatePricingTier(id: string, input: Record<string, unknown>): Promise<PlatformPricingTier> {
    const { data } = await getApiClient().put<unknown>(API.ENDPOINTS.PLATFORM.PRICING_TIER(id), input);
    const payload = unwrapPayload<RawPricingTier>(data);
    return mapPricingTier(payload);
  },

  async togglePricingTier(id: string, isActive: boolean): Promise<void> {
    await getApiClient().post(`${API.ENDPOINTS.PLATFORM.PRICING_TIER_TOGGLE(id)}`, { is_active: isActive });
  },

  async archivePricingTier(id: string): Promise<void> {
    await getApiClient().post(`${API.ENDPOINTS.PLATFORM.PRICING_TIER_ARCHIVE(id)}`);
  },

  async restorePricingTier(id: string): Promise<void> {
    await getApiClient().post(`${API.ENDPOINTS.PLATFORM.PRICING_TIER_RESTORE(id)}`);
  },

  // --- Notifications ---
  async getNotifications(query: ListQuery = {}): Promise<PlatformList<PlatformNotification>> {
    const params = new URLSearchParams();
    if (query.type) params.set('type', query.type);
    params.set('per_page', String(query.perPage ?? 50));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.PLATFORM.NOTIFICATIONS}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawNotification[]>(res.data);
    return { items: items.map(mapNotification), total: res.meta?.total ?? items.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 50 };
  },

  async markAllNotificationsRead(): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.NOTIFICATIONS_MARK_ALL_READ);
  },

  async markNotificationRead(id: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.NOTIFICATION_READ(id));
  },

  async getPlatformUnreadCount(): Promise<number> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.NOTIFICATIONS_UNREAD_COUNT);
    return unwrapPayload<{ unread: number }>(data).unread ?? 0;
  },

  async markPlatformNotificationRead(id: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.NOTIFICATION_READ(id));
  },

  async deleteNotification(id: string): Promise<void> {
    await getApiClient().delete(API.ENDPOINTS.PLATFORM.NOTIFICATION(id));
  },

  // --- Support Tickets ---
  async getSupportTickets(query: ListQuery = {}): Promise<PlatformList<SupportTicket>> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.priority) params.set('priority', query.priority);
    if (query.category) params.set('category', query.category);
    params.set('per_page', String(query.perPage ?? 50));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.PLATFORM.SUPPORT_TICKETS}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawSupportTicket[]>(res.data);
    return { items: items.map(mapTicket), total: res.meta?.total ?? items.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 50 };
  },

  async getSupportTicket(id: string): Promise<SupportTicket | null> {
    return readOrNull(async () => {
      const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.SUPPORT_TICKET(id));
      return mapTicket(unwrapPayload<RawSupportTicket>(data));
    });
  },

  async replyToTicket(id: string, body: string, isInternal = false, media?: { message_type?: string; file_path?: string; file_name?: string; file_size?: number; file_type?: string; voice_duration?: number }): Promise<void> {
    const payload: Record<string, unknown> = { body, is_internal: isInternal };
    if (media) Object.assign(payload, media);
    await getApiClient().post(API.ENDPOINTS.PLATFORM.SUPPORT_TICKET_REPLY(id), payload);
  },

  async uploadSupportMedia(file: File): Promise<{ file_path: string; file_name: string; file_size: number; file_type: string; message_type: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await getApiClient().post<{ data: { file_path: string; file_name: string; file_size: number; file_type: string; message_type: string } }>(API.ENDPOINTS.PLATFORM.SUPPORT_UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (data as any).data ?? data;
  },

  async updateSupportTicket(id: string, updates: { status?: string; priority?: string; assigned_to?: string | null }): Promise<void> {
    await getApiClient().put(API.ENDPOINTS.PLATFORM.SUPPORT_TICKET_UPDATE(id), updates);
  },

  async createSupportTicket(input: { subject: string; description: string; category: string; priority?: string; organization_id?: string }): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.SUPPORT_TICKETS, input);
  },

  async acceptSupportTicket(id: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.PLATFORM.SUPPORT_TICKET_ACCEPT(id));
  },

  // --- Reports ---
  async getReports(): Promise<{ key: string; label: string; description: string }[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.REPORTS);
    return unwrapPayload<{ key: string; label: string; description: string }[]>(data);
  },

  // --- Settings ---
  async getSettings(): Promise<{ key: string; value: string | null; type: string; description: string | null; is_public: boolean }[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.SETTINGS);
    return unwrapPayload<{ key: string; value: string | null; type: string; description: string | null; is_public: boolean }[]>(data);
  },

  async updateSettings(settings: { key: string; value?: unknown; type?: string; description?: string; is_public?: boolean }[]): Promise<void> {
    await getApiClient().put(API.ENDPOINTS.PLATFORM.SETTINGS, { settings });
  },

  // --- Workspace Inspection Sessions ---
  async getWorkspaceSession(id: string): Promise<WorkspaceSession | null> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.WORKSPACE_CURRENT(id));
    return unwrapPayload<WorkspaceSession | null>(data);
  },

  async openWorkspaceSession(
    id: string,
    mode: WorkspaceSessionMode,
    options?: { reason?: string; category?: string; riskLevel?: string; isEmergency?: boolean },
  ): Promise<WorkspaceSession> {
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.PLATFORM.WORKSPACE_OPEN(id), {
      mode,
      ...options,
    });
    return unwrapPayload<WorkspaceSession>(data);
  },

  async closeWorkspaceSession(id: string): Promise<WorkspaceSession | null> {
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.PLATFORM.WORKSPACE_CLOSE(id));
    return unwrapPayload<WorkspaceSession | null>(data);
  },

  async getWorkspaceView(id: string): Promise<WorkspaceView> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.WORKSPACE_VIEW(id));
    return data as WorkspaceView;
  },

  // --- Activities (derived from audit logs) ---
  async getActivities(): Promise<PlatformActivity[]> {
    const { items } = await this.getAuditLogs({ perPage: 50 });
    return items.map((a) => ({
      id: a.id,
      actor: a.user,
      action: a.action,
      target: a.category,
      targetType: a.category,
      timestamp: a.timestamp,
      severity: a.severity === 'Critical' ? 'critical' : a.severity === 'Warning' ? 'warning' : 'info',
    }));
  },

  // --- Contact Form ---
  async submitContactMessage(payload: { name: string; email: string; message: string }): Promise<void> {
    await getApiClient().post('/contact', payload);
  },

  // --- Founder Workspace Session History ---
  async getWorkspaceSessions(params?: {
    page?: number;
    perPage?: number;
    mode?: string;
    organizationId?: string;
  }): Promise<{ items: WorkspaceSession[]; total: number; page: number; perPage: number }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.perPage) query.set('per_page', String(params.perPage));
    if (params?.mode) query.set('mode', params.mode);
    if (params?.organizationId) query.set('organization_id', params.organizationId);
    const qs = query.toString();
    const url = `${API.ENDPOINTS.PLATFORM.WORKSPACE_SESSIONS}${qs ? `?${qs}` : ''}`;
    const { data } = await getApiClient().get<unknown>(url);
    return data as { items: WorkspaceSession[]; total: number; page: number; perPage: number };
  },

  // --- Governance Intervention Revert ---
  async revertIntervention(sessionId: string): Promise<void> {
    await getApiClient().post(`/platform/interventions/${sessionId}/revert`);
  },

  // --- Governance Report Generation ---
  async generateReport(options?: { type?: string; dateFrom?: string; dateTo?: string }): Promise<{ report_id: string; type: string; status: string; requested_at: string }> {
    const { data } = await getApiClient().post('/platform/reports/generate', {
      type: options?.type ?? 'governance',
      date_from: options?.dateFrom,
      date_to: options?.dateTo,
    });
    return (data as any)?.data ?? data;
  },
};
