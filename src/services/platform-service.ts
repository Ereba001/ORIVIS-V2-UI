import { getApiClient, unwrapPayload, type ApiResponseWithMeta } from '../lib/api-client';
import { API } from '../constants/api';
import type {
  OrganizationHealth,
  PlatformActivity,
  PlatformAuditLog,
  PlatformElection,
  PlatformInvoice,
  PlatformMembership,
  PlatformNotification,
  PlatformRole,
  PlatformStaff,
  PlatformUser,
  Permission,
  SupportTicket,
  SubscriptionRecord,
  TicketMessage,
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
  { id: 'q2', label: 'View Reports', description: 'Analytics and platform reports', icon: 'BarChart3', path: '/platform/analytics', color: 'text-blue-400' },
  { id: 'q3', label: 'View Subscriptions', description: 'Billing and subscription plans', icon: 'CreditCard', path: '/platform/subscriptions', color: 'text-brand-text-muted' },
  { id: 'q4', label: 'System Settings', description: 'Configure platform preferences', icon: 'SlidersHorizontal', path: '/platform/settings', color: 'text-purple-400' },
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
  resolved_at: string | null;
  closed_at: string | null;
  first_response_at: string | null;
  created_at: string;
  updated_at: string;
  user?: RawUser | null;
  organization?: RawOrganization | null;
  assignee?: RawUser | null;
  messages?: RawTicketMessage[];
}

interface RawTicketMessage {
  id: number;
  uuid: string;
  ticket_id: number;
  user_id: number | null;
  body: string;
  is_internal: boolean;
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
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
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

// ---------------------------------------------------------------------------
// UI-facing derived shapes
// ---------------------------------------------------------------------------

export interface DashboardStatCard {
  id: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend: number;
  trendLabel: string;
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
  page?: number;
  perPage?: number;
}

export interface PlatformAnalyticsData {
  topOrganizations: { name: string; users: number; elections: number }[];
  recentOrganizations: { uuid: string; name: string; status: string; created_at: string }[];
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
    slug: raw.slug,
    logoUrl: raw.logo_url,
    status: orgHealthStatus(raw.status),
    subscription: sub ? toStatus(sub.status, sub.status) : 'NONE',
    plan: sub?.plan?.name ?? (sub?.plan_id ? 'Subscribed' : '—'),
    activeEvents: raw.elections_count ?? 0,
    members: raw.users_count ?? 0,
    admins: 0,
    storageUsed: 0,
    storageTotal: 0,
    lastActivity: raw.updated_at,
    country: raw.country ?? '—',
    dateJoined: raw.created_at,
    workspaceStatus: workspaceStatus(raw.status),
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
    createdBy: raw.user?.display_name || raw.user?.name || 'Unknown',
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    messages: raw.messages?.map(msgToView) ?? [],
  };
}

const NOTIF_TYPE_MAP: Record<string, PlatformNotification['type']> = {
  approval_request: 'APPROVAL_REQUEST',
  org_announcement: 'ORG_REGISTRATION',
  event: 'EVENT_PUBLISH_REQUEST',
  platform_alert: 'SECURITY_ALERT',
  security_alert: 'SECURITY_ALERT',
  platform_announcement: 'PLATFORM_ANNOUNCEMENT',
  system: 'PLATFORM_ANNOUNCEMENT',
};

function mapNotification(raw: RawNotification): PlatformNotification {
  return {
    id: raw.uuid,
    type: NOTIF_TYPE_MAP[raw.type] ?? 'PLATFORM_ANNOUNCEMENT',
    title: raw.title,
    description: raw.body ?? '',
    read: raw.read_at !== null,
    actionable: raw.data !== null && raw.data !== undefined,
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
  return {
    id: raw.uuid,
    organizationId: raw.organization?.uuid ?? String(raw.organization_id),
    organizationName: raw.organization?.name ?? '—',
    plan: (raw.plan?.name ?? 'CUSTOM').toUpperCase().replace(/[^A-Z0-9]/g, '') as SubscriptionRecord['plan'],
    status: toStatus(raw.status, 'ACTIVE') as SubscriptionRecord['status'],
    maxVoters: raw.seats,
    price: raw.plan ? `${raw.plan.currency} ${raw.plan.price}` : '—',
    startedAt: raw.starts_at ?? raw.created_at,
    expiresAt: raw.ends_at ?? '—',
    renewedAt: raw.updated_at,
    cancelledAt: raw.cancelled_at ?? undefined,
    paymentMethod: '—',
  };
}

function mapElection(raw: Record<string, unknown>): PlatformElection {
  const statusMap: Record<string, string> = {
    pending_review: 'Pending Review',
    approved: 'Upcoming',
    scheduled: 'Upcoming',
    published: 'Upcoming',
    live: 'Live',
    paused: 'Live',
    closed: 'Concluded',
    certified: 'Concluded',
    archived: 'Concluded',
    cancelled: 'Concluded',
    draft: 'Pending Review',
  };
  return {
    id: String(raw.reference ?? raw.uuid ?? ''),
    name: String(raw.title ?? raw.name ?? 'Untitled'),
    org: String(raw.organization ?? '—'),
    status: statusMap[String(raw.status ?? '')] ?? String(raw.status ?? 'Unknown'),
    voters: Number(raw.voters ?? 0),
    turnout: Number(raw.turnout_pct ?? 0),
    created: String(raw.created_at ?? ''),
  };
}

function mapInvoice(raw: RawSubscription): PlatformInvoice {
  return {
    id: raw.uuid,
    org: raw.organization?.name ?? '—',
    plan: raw.plan?.name ?? '—',
    amount: raw.plan ? `${raw.plan.currency} ${raw.plan.price}` : '—',
    status: raw.status === 'active' || raw.status === 'trialing' ? 'Paid' : raw.status === 'past_due' ? 'Pending' : 'Free',
    date: raw.starts_at ?? raw.created_at,
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
      stats: {
        organizations: { total: number; active: number; suspended: number; archived: number };
        elections: { total: number; active: number; live: number; completed: number };
        participation: { registeredParticipants: number; votesCast: number; turnout: number };
        pendingApprovals: number;
        activity: { today: number; last7Days: number };
      };
    }>(data);

    const s = raw.stats;
    const stats: DashboardStatCard[] = [
      { id: 'orgs', label: 'Total Organizations', value: s.organizations.total, trend: s.organizations.active, trendLabel: 'active', icon: 'Building2' },
      { id: 'users', label: 'Registered Participants', value: s.participation.registeredParticipants, trend: s.participation.turnout, trendLabel: 'turnout', icon: 'Users' },
      { id: 'events', label: 'Active Elections', value: s.elections.active, trend: s.elections.live, trendLabel: 'live now', icon: 'Vote' },
      { id: 'votes', label: 'Votes Cast', value: s.participation.votesCast, trend: s.participation.votesCast > 0 ? 1 : 0, trendLabel: 'total', icon: 'TrendingUp' },
      { id: 'uptime', label: 'Completed Elections', value: s.elections.completed, trend: s.elections.total - s.elections.completed, trendLabel: 'remaining', icon: 'Shield' },
      { id: 'pending', label: 'Pending Approvals', value: s.pendingApprovals, trend: -Math.max(s.pendingApprovals, 0) >= 0 ? 0 : -1, trendLabel: 'awaiting review', icon: 'Clock' },
    ];

    const [activityRes, notifRes] = await Promise.allSettled([
      getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.AUDIT_LOGS),
      getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.NOTIFICATIONS),
    ]);

    let activities: DashboardActivity[] = [];
    if (activityRes.status === 'fulfilled') {
      const logs = unwrapPayload<RawAuditLog[]>(activityRes.value.data);
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

    return { stats, activities, notifications, quickActions: QUICK_ACTIONS };
  },

  // --- Analytics ---
  async getAnalytics(): Promise<PlatformAnalyticsData> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.ANALYTICS);
    const payload = unwrapPayload<{ topOrganizations: RawOrganization[]; recentOrganizations: { uuid: string; name: string; status: string; created_at: string }[] }>(data);
    return {
      topOrganizations: payload.topOrganizations.map((org) => ({
        name: org.name,
        users: org.users_count ?? 0,
        elections: org.elections_count ?? 0,
      })),
      recentOrganizations: payload.recentOrganizations ?? [],
    };
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
      counts: { users: number; elections: number; supportTickets: number };
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

  // --- Users ---
  async getUsers(query: ListQuery = {}): Promise<PlatformList<PlatformUser>> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    params.set('per_page', String(query.perPage ?? 50));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.PLATFORM.USERS}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawUser[]>(res.data);
    return { items: items.map(mapUser), total: res.meta?.total ?? items.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 50 };
  },

  async getUser(id: string): Promise<PlatformUser | null> {
    try {
      const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.USER(id));
      return mapUser(unwrapPayload<RawUser>(data));
    } catch {
      return null;
    }
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

  async getStaffInvitations(): Promise<{ id: string; email: string; role: string | null; status: string; expires_at: string | null; created_at: string }[]> {
    const res = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.STAFF_INVITATIONS) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<{
      uuid: string; email: string; role_id: number | null; status: string;
      expires_at: string | null; created_at: string; role: RawRole | null;
    }[]>(res.data);
    return items.map((i) => ({ id: i.uuid, email: i.email, role: i.role?.name ?? null, status: i.status, expires_at: i.expires_at, created_at: i.created_at }));
  },

  // --- Roles & Permissions ---
  async getRoles(): Promise<PlatformRole[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.ROLES);
    return unwrapPayload<RawRole[]>(data).map(mapRole);
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

  async getPlans(): Promise<RawPlan[]> {
    const res = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.PLANS) as ApiResponseWithMeta<unknown>;
    return unwrapPayload<RawPlan[]>(res.data);
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

  // --- Elections (via reports) ---
  async getElections(): Promise<PlatformElection[]> {
    try {
      const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.REPORT('elections'));
      const payload = unwrapPayload<{ rows: Record<string, unknown>[] }>(data);
      return (payload?.rows ?? []).map(mapElection);
    } catch {
      return [];
    }
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
    try {
      const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PLATFORM.SUPPORT_TICKET(id));
      return mapTicket(unwrapPayload<RawSupportTicket>(data));
    } catch {
      return null;
    }
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

  // --- Memberships feed (derived from platform users) ---
  async getMemberships(): Promise<PlatformMembership[]> {
    const { items } = await this.getUsers({ perPage: 100 });
    return items
      .map((u) => ({
        id: `m-${u.id}`,
        user: u.name,
        email: u.email,
        org: u.org,
        role: u.role,
        status: u.status === 'ACTIVE' ? 'Active' : u.status === 'SUSPENDED' ? 'Suspended' : 'Pending',
        joined: u.joined,
      }))
      .filter((m) => m.org !== '—');
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
};
