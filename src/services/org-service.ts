import { getApiClient, unwrapPayload, readOrNull, type ApiResponseWithMeta } from '../lib/api-client';
import { API } from '../constants/api';
import type {
  ActivityEvent,
  AuditEvent,
  BillingPlan,
  DashboardStat,
  EligibilityCheck,
  EventSummary,
  EventTemplate,
  HelpArticle,
  Invoice,
  Invitation,
  OrgNotification,
  NotificationPreferences,
  PendingTask,
  PermissionGroup,
  Role,
  StorageUsage,
  SubscriptionInfo,
  TeamMember,
  WorkspaceHealth,
} from '../org/types';
import type { EventType } from '../org/types';

// ---------------------------------------------------------------------------
// Raw API shapes
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
  pivot?: {
    organization_id: number;
    user_id: number;
    role: string;
    status: string;
    joined_at: string | null;
    created_at: string;
    updated_at: string;
  };
}

interface RawOrgInvitation {
  id: number;
  uuid: string;
  organization_id: number;
  user_id: number | null;
  email: string;
  role: string;
  department: string | null;
  token: string;
  status: string;
  invited_by: number | null;
  expires_at: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
  inviter?: RawUser | null;
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
}

interface RawPermissionGroup {
  group: string;
  permissions: { key: string; label: string }[];
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

interface RawTemplate {
  id: number;
  uuid: string;
  organization_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  type: string;
  is_public: boolean;
  is_active: boolean;
  structure: unknown[] | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

interface RawElection {
  id: string;
  organizationId: string;
  title: string;
  bannerUrl: string | null;
  slug: string;
  code: string;
  type: string;
  category: string | null;
  visibility: string;
  status: string;
  lifecycleState: string;
  scheduledPublishAt?: string | null;
  startsAt: string | null;
  endsAt: string | null;
  totalRegistered?: number;
  totalVotes?: number;
  positionCount?: number;
  candidateCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface RawHelpArticle {
  id: number;
  uuid: string;
  organization_id: number | null;
  title: string;
  slug: string;
  content: string | null;
  category: string | null;
  is_published: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
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
  plan?: RawPlan | null;
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
  organization?: { id: number; uuid: string; name: string } | null;
  assignee?: RawUser | null;
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

// ---------------------------------------------------------------------------
// UI-facing derived shapes
// ---------------------------------------------------------------------------

export interface OrgList<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface ListQuery {
  search?: string;
  status?: string;
  role?: string;
  category?: string;
  type?: string;
  priority?: string;
  page?: number;
  perPage?: number;
}

export interface OrgBillingData {
  subscription: RawSubscription | null;
  plan: RawPlan | null;
  seats: { used: number; limit: number; remaining: number };
  usage: { elections: number; participants: number; storage_bytes: number };
  limits: Record<string, unknown>;
}

export interface OrgReportsData {
  summary: {
    elections: { total: number; live: number; completed: number };
    participation: { voters: number; votes: number; turnout_pct: number };
    candidates: number;
  };
  reports: { key: string; label: string; description: string }[];
}

export interface OrgDashboardData {
  stats: DashboardStat[];
  elections: EventSummary[];
  notifications: OrgNotification[];
  activity: ActivityEvent[];
  team: TeamMember[];
  // null when the subscription source failed — callers must render an
  // error/unavailable state, never a fabricated plan row.
  subscription: SubscriptionInfo | null;
  storage: StorageUsage;
  health: WorkspaceHealth;
  pendingTasks: PendingTask[];
  eligibility: EligibilityCheck[];
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

const NOTIF_TYPE_MAP: Record<string, OrgNotification['type']> = {
  event: 'event',
  team: 'team',
  system: 'system',
  security_alert: 'alert',
  org_alert: 'alert',
  platform_alert: 'alert',
  approval_request: 'system',
  org_announcement: 'system',
  platform_announcement: 'system',
};

const PRIORITY_MAP: Record<string, OrgNotification['priority']> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  critical: 'critical',
};

const PRIORITY_LEVEL_MAP: Record<string, OrgNotification['level']> = {
  info: 'normal',
  success: 'normal',
  warning: 'important',
  critical: 'critical',
};

/**
 * Derive the client route a notification should deep-link to, from the
 * backend's action_type/action_id pair.
 */
function notificationActionPath(raw: RawNotification): string | undefined {
  const id = raw.action_id;
  switch (raw.action_type) {
    case 'election':
      return id ? `/org/events/${id}` : '/org/events';
    case 'participant':
    case 'candidate':
      return id ? `/org/events/${String((raw.data as { election_id?: string | number } | null)?.election_id ?? '')}/participants` : undefined;
    case 'support':
      return id ? `/org/help` : undefined;
    default:
      return undefined;
  }
}

function mapNotification(raw: RawNotification): OrgNotification {
  return {
    id: raw.uuid,
    title: raw.title,
    preview: raw.body ?? '',
    time: raw.created_at,
    read: raw.read_at !== null,
    type: NOTIF_TYPE_MAP[raw.type] ?? 'system',
    priority: PRIORITY_MAP[raw.priority] ?? 'info',
    level: (raw.level as OrgNotification['level']) ?? PRIORITY_LEVEL_MAP[raw.priority] ?? 'normal',
    actionType: raw.action_type ?? undefined,
    actionId: raw.action_id ?? undefined,
    actionPath: notificationActionPath(raw),
  };
}

function mapMember(raw: RawUser): TeamMember {
  return {
    id: raw.uuid,
    displayName: raw.display_name || raw.name,
    email: raw.email,
    avatarUrl: raw.avatar_url ?? null,
    role: raw.pivot?.role ?? 'member',
    department: '',
    status: raw.pivot?.status === 'active' ? 'active' : raw.pivot?.status === 'suspended' ? 'suspended' : 'invited',
    lastActive: raw.last_login_at ?? 'Never',
  };
}

function mapInvitation(raw: RawOrgInvitation): Invitation {
  return {
    id: raw.uuid,
    email: raw.email,
    invitedBy: raw.inviter?.display_name || raw.inviter?.name || 'Unknown',
    role: raw.role,
    department: raw.department ?? '',
    sentAt: raw.created_at,
    expiresAt: raw.expires_at ?? '—',
    status: raw.status === 'accepted' ? 'accepted' : raw.status === 'expired' ? 'expired' : raw.status === 'revoked' ? 'cancelled' : 'pending',
  };
}

const MODULE_MAP: Record<string, AuditEvent['module']> = {
  team: 'Team',
  election: 'Event',
  candidate: 'Candidate',
  voter: 'Voter',
  result: 'Event',
  auth: 'Auth',
  billing: 'Billing',
  settings: 'Settings',
  workspace: 'Settings',
  org: 'Settings',
  vote: 'Voter',
  role: 'Team',
};

function mapAudit(raw: RawAuditLog): AuditEvent {
  const parts = raw.event.split('.');
  const module = MODULE_MAP[parts[0]] ?? 'Event';
  // Election-scoped logs carry the election id on the morph (or inside the
  // changed values as election_id) — surface it so the UI can deep-link.
  const auditableIsElection = (raw.auditable_type ?? '').endsWith('Election');
  const valuesElectionId = raw.new_values?.election_id ?? raw.old_values?.election_id;
  const eventId = auditableIsElection && raw.auditable_id != null
    ? String(raw.auditable_id)
    : valuesElectionId != null
      ? String(valuesElectionId)
      : null;
  return {
    id: String(raw.id),
    user: raw.user?.display_name || raw.user?.name || 'System',
    avatarUrl: raw.user?.avatar_url ?? null,
    action: raw.event,
    module,
    timestamp: raw.created_at,
    severity: raw.event.includes('delete') || raw.event.includes('suspend') || raw.event.includes('denied') ? 'critical' : raw.event.includes('update') ? 'warning' : 'info',
    ipAddress: raw.ip_address ?? '—',
    eventId,
  };
}

function mapRole(raw: RawRole): Role {
  return {
    id: raw.uuid,
    slug: raw.slug,
    name: raw.name,
    description: raw.description ?? '',
    type: raw.is_system ? 'system' : 'custom',
    isActive: raw.is_active,
    memberCount: 0,
    permissions: [],
    createdAt: raw.created_at,
  };
}

function mapPermissionGroups(groups: RawPermissionGroup[]): PermissionGroup[] {
  return groups.map((g) => ({
    id: g.group.toLowerCase().replace(/\s+/g, '-'),
    label: g.group,
    permissions: g.permissions.map((p) => ({ id: p.key, label: p.label, key: p.key, group: g.group, enabled: false })),
  }));
}

function mapTemplate(raw: RawTemplate): EventTemplate {
  return {
    id: raw.uuid,
    name: raw.name,
    description: raw.description ?? '',
    type: (raw.type || 'governance_election') as EventType,
    category: raw.category === 'default' ? 'default' : raw.organization_id ? 'organization' : 'default',
    configuration: {
      title: raw.name,
      description: raw.description ?? '',
      timezone: 'Africa/Lagos',
      visibility: 'private',
      branding: { primaryColor: '#FCA311', accentColor: '#147DF5', theme: 'dark' },
      settings: {},
    },
    createdAt: raw.created_at,
    usedCount: 0,
  };
}

function mapBillingPlan(raw: RawPlan): BillingPlan {
  const limits = (raw.limits ?? {}) as Record<string, number>;
  return {
    id: raw.uuid,
    name: raw.name,
    description: raw.description ?? '',
    price: raw.price,
    currency: raw.currency,
    interval: raw.interval === 'year' ? 'year' : 'month',
    popular: raw.slug === 'pro' || raw.slug === 'professional',
    features: raw.features ?? [],
    participantCapacity: limits.participants ?? 1000,
    teamCapacity: limits.seats ?? 10,
    customRoleCapacity: 0,
    storageLimit: limits.storage_bytes ? Math.round((limits.storage_bytes as number) / 1024 / 1024 / 1024) : 5,
  };
}

function mapSubscriptionInfo(raw: RawSubscription | null, plan: RawPlan | null, seats: { used: number; limit: number }): SubscriptionInfo {
  return {
    plan: plan?.name ?? 'Free',
    status: (raw?.status ?? 'active') as SubscriptionInfo['status'],
    seatsUsed: seats.used,
    seatsTotal: seats.limit,
    nextBilling: raw?.ends_at ?? '—',
    amount: plan ? Math.round(plan.price * 100) : 0,
    currency: plan?.currency ?? 'NGN',
  };
}

function mapInvoice(raw: RawSubscription | null, plan: RawPlan | null): Invoice {
  return {
    id: raw?.uuid ?? 'none',
    description: `${plan?.name ?? 'Subscription'} — ${plan?.interval ?? ''}`,
    amount: plan ? Math.round(plan.price * 100) : 0,
    currency: plan?.currency ?? 'NGN',
    status: raw?.status === 'active' ? 'paid' : raw?.status === 'past_due' ? 'failed' : 'pending',
    issuedAt: raw?.starts_at ?? raw?.created_at ?? '',
    paidAt: raw?.status === 'active' ? raw.updated_at : null,
    pdfUrl: null,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const orgService = {
  // --- Team ---
  async getTeam(query: ListQuery = {}): Promise<OrgList<TeamMember>> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.role) params.set('role', query.role);
    params.set('per_page', String(query.perPage ?? 100));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.ORG.TEAM}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawUser[]>(res.data);
    return { items: items.map(mapMember), total: res.meta?.total ?? items.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 100 };
  },

  async getInvitations(): Promise<Invitation[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.TEAM_INVITATIONS);
    return unwrapPayload<RawOrgInvitation[]>(data).map(mapInvitation);
  },

  async getRoleOptions(): Promise<{ slug: string; name: string; system: boolean }[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.TEAM_ROLE_OPTIONS);
    return unwrapPayload<{ slug: string; name: string; system: boolean }[]>(data);
  },

  async inviteMember(input: { email: string; name?: string; role?: string; department?: string; expires_in_days?: number }): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.ORG.TEAM_INVITATIONS, input);
  },

  async revokeInvitation(id: string): Promise<void> {
    await getApiClient().post(`${API.ENDPOINTS.ORG.TEAM_INVITATIONS}/${id}/revoke`);
  },

  async resendInvitation(id: string): Promise<void> {
    await getApiClient().post(`${API.ENDPOINTS.ORG.TEAM_INVITATIONS}/${id}/resend`);
  },

  async updateMemberRole(id: string, role: string): Promise<void> {
    await getApiClient().put(API.ENDPOINTS.ORG.TEAM_MEMBER_ROLE(id), { role });
  },

  async removeMember(id: string): Promise<void> {
    await getApiClient().delete(API.ENDPOINTS.ORG.TEAM_MEMBER(id));
  },

  async transferOwnership(id: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.ORG.TEAM_TRANSFER_OWNERSHIP(id));
  },

  // --- Roles & Permissions ---
  async getRoles(): Promise<Role[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.ROLES);
    return unwrapPayload<RawRole[]>(data).map(mapRole);
  },

  async getPermissions(): Promise<PermissionGroup[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.ROLES_PERMISSIONS);
    return mapPermissionGroups(unwrapPayload<RawPermissionGroup[]>(data));
  },

  async createRole(input: { name: string; description?: string; permissions?: string[]; is_active?: boolean }): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.ORG.ROLES, input);
  },

  // --- Audit Logs ---
  async getAuditLogs(query: ListQuery = {}): Promise<OrgList<AuditEvent>> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.category) params.set('event', query.category);
    params.set('per_page', String(query.perPage ?? 50));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.ORG.AUDIT_LOGS}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawAuditLog[]>(res.data);
    return { items: items.map(mapAudit), total: res.meta?.total ?? items.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 50 };
  },

  // --- Reports ---
  async getReports(): Promise<OrgReportsData> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.REPORTS);
    return unwrapPayload<OrgReportsData>(data);
  },

  async deleteReport(reportKey: string): Promise<void> {
    await getApiClient().delete(API.ENDPOINTS.ORG.REPORT(reportKey));
  },

  // --- Templates ---
  async getTemplates(query: ListQuery = {}): Promise<OrgList<EventTemplate>> {
    const params = new URLSearchParams();
    if (query.category) params.set('category', query.category);
    params.set('per_page', String(query.perPage ?? 100));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.ORG.TEMPLATES}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawTemplate[]>(res.data);
    return { items: items.map(mapTemplate), total: res.meta?.total ?? items.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 100 };
  },

  // --- Archive ---
  async getArchive(query: ListQuery = {}): Promise<OrgList<Record<string, unknown>>> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    params.set('per_page', String(query.perPage ?? 100));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.ORG.ARCHIVE}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<Record<string, unknown>[]>(res.data);
    return { items, total: res.meta?.total ?? items.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 100 };
  },

  async restoreArchived(id: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.ORG.ARCHIVE_RESTORE(id));
  },

  async permanentlyDeleteArchived(id: string): Promise<void> {
    await getApiClient().delete(`${API.ENDPOINTS.ORG.ARCHIVE}/${id}`);
  },

  // --- Help ---
  async getHelpArticles(query: ListQuery = {}): Promise<OrgList<HelpArticle>> {
    const params = new URLSearchParams();
    if (query.category) params.set('category', query.category);
    if (query.search) params.set('search', query.search);
    params.set('per_page', String(query.perPage ?? 100));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.ORG.HELP_ARTICLES}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawHelpArticle[]>(res.data);
    return {
      items: items.map((a) => ({
        id: a.uuid,
        title: a.title,
        description: (a.content ?? '').replace(/<[^>]*>/g, '').slice(0, 160),
        category: a.category ?? 'general',
        readTime: `${Math.max(1, Math.round((a.content ?? '').split(/\s+/).filter(Boolean).length / 200))} min read`,
        content: a.content ?? '',
      })),
      total: res.meta?.total ?? items.length,
      page: res.meta?.current_page ?? 1,
      perPage: res.meta?.per_page ?? 100,
    };
  },

  async getHelpCategories(): Promise<string[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.HELP_CATEGORIES);
    return unwrapPayload<string[]>(data);
  },

  // --- Support Tickets ---
  async createSupportTicket(input: { subject: string; description: string; category: string; priority?: string }): Promise<{ id: string; uuid: string }> {
    const { data } = await getApiClient().post(API.ENDPOINTS.ORG.SUPPORT_TICKETS, input);
    return unwrapPayload<{ id: string; uuid: string }>(data);
  },

  async getSupportTickets(query: { perPage?: number; status?: string } = {}): Promise<{ items: RawSupportTicket[]; total: number }> {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    params.set('per_page', String(query.perPage ?? 50));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.ORG.SUPPORT_TICKETS}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawSupportTicket[]>(res.data);
    return { items, total: res.meta?.total ?? items.length };
  },

  async getSupportTicket(uuid: string): Promise<RawSupportTicket | null> {
    return readOrNull(async () => {
      const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.SUPPORT_TICKET(uuid));
      return unwrapPayload<RawSupportTicket>(data);
    });
  },

  async replyToTicket(uuid: string, body: string, media?: { message_type?: string; file_path?: string; file_name?: string; file_size?: number; file_type?: string; voice_duration?: number }): Promise<void> {
    const payload: Record<string, unknown> = { body };
    if (media) Object.assign(payload, media);
    await getApiClient().post(API.ENDPOINTS.ORG.SUPPORT_TICKET_REPLY(uuid), payload);
  },

  async uploadSupportMedia(file: File): Promise<{ file_path: string; file_name: string; file_size: number; file_type: string; message_type: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await getApiClient().post(API.ENDPOINTS.ORG.SUPPORT_UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (data as any).data ?? data;
  },

  // --- Reports Export ---
  async downloadReport(reportKey: string): Promise<void> {
    const response = await getApiClient().get(API.ENDPOINTS.ORG.REPORT(reportKey) + '/export', { responseType: 'blob' });
    const blob = response.data as Blob;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportKey}-report.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },

  // --- Notifications ---
  async getNotifications(query: ListQuery = {}): Promise<OrgList<OrgNotification>> {
    const params = new URLSearchParams();
    if (query.type) params.set('type', query.type);
    params.set('per_page', String(query.perPage ?? 100));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.ORG.NOTIFICATIONS}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawNotification[]>(res.data);
    return { items: items.map(mapNotification), total: res.meta?.total ?? items.length, page: res.meta?.current_page ?? 1, perPage: res.meta?.per_page ?? 100 };
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.NOTIFICATIONS_UNREAD_COUNT);
    return unwrapPayload<{ unread: number }>(data).unread ?? 0;
  },

  async markNotificationRead(id: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.ORG.NOTIFICATION_READ(id));
  },

  async dismissNotification(id: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.ORG.NOTIFICATION_DISMISS(id));
  },

  async markAllRead(): Promise<void> {
    await getApiClient().post(`${API.ENDPOINTS.ORG.NOTIFICATIONS}/read-all`);
  },

  async pollNotifications(afterId: number, limit = 20): Promise<{ items: OrgNotification[]; unread: number; maxId: number }> {
    const { data } = await getApiClient().get<unknown>(`${API.ENDPOINTS.ORG.NOTIFICATIONS}/poll?after_id=${afterId}&limit=${limit}`);
    const payload = unwrapPayload<{ items: RawNotification[]; unread: number }>(data);
    const rawItems = payload.items ?? [];
    const maxId = Math.max(afterId, ...rawItems.map((r) => Number(r.id ?? 0)).filter((v) => Number.isFinite(v)));
    return {
      items: rawItems.map(mapNotification),
      unread: payload.unread ?? 0,
      maxId,
    };
  },

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.NOTIFICATION_PREFERENCES);
    const prefs = unwrapPayload<{ sound_enabled: boolean; toast_enabled: boolean }>(data);
    return {
      soundEnabled: prefs.sound_enabled ?? true,
      toastEnabled: prefs.toast_enabled ?? true,
    };
  },

  async updateNotificationPreferences(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const payload: Record<string, unknown> = {};
    if (prefs.soundEnabled !== undefined) payload.sound_enabled = prefs.soundEnabled;
    if (prefs.toastEnabled !== undefined) payload.toast_enabled = prefs.toastEnabled;
    const { data } = await getApiClient().put<unknown>(API.ENDPOINTS.ORG.NOTIFICATION_PREFERENCES, payload);
    const saved = unwrapPayload<{ sound_enabled: boolean; toast_enabled: boolean }>(data);
    return {
      soundEnabled: saved.sound_enabled ?? true,
      toastEnabled: saved.toast_enabled ?? true,
    };
  },

  // --- Billing ---
  async getBilling(): Promise<OrgBillingData> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.BILLING);
    return unwrapPayload<OrgBillingData>(data);
  },

  async getBillingPlans(): Promise<BillingPlan[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.BILLING_PLANS);
    return unwrapPayload<RawPlan[]>(data).map(mapBillingPlan);
  },

  async cancelBilling(): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.ORG.BILLING_CANCEL);
  },

  // --- Composed views ---
  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    const billing = await this.getBilling();
    return mapSubscriptionInfo(billing.subscription, billing.plan, { used: billing.seats.used, limit: billing.seats.limit });
  },

  async getInvoices(): Promise<Invoice[]> {
    const billing = await this.getBilling();
    return [mapInvoice(billing.subscription, billing.plan)];
  },

  async getActivityFeed(): Promise<ActivityEvent[]> {
    const { items } = await this.getAuditLogs({ perPage: 20 });
    return items.map((a) => ({
      id: a.id,
      action: a.action,
      time: a.timestamp,
      type: a.severity === 'critical' ? 'alert' : a.severity === 'warning' ? 'update' : 'create',
      user: a.user,
    }));
  },

  async getElectionSummary(): Promise<{ total: number; live: number; published: number; completed: number; draft: number }> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ELECTIONS.STATS);
    const stats = unwrapPayload<Record<string, number>>(data);
    return {
      total: Number(stats.total ?? 0),
      live: Number(stats.live ?? 0),
      published: Number(stats.published ?? 0),
      completed: Number(stats.completed ?? 0),
      draft: Number(stats.draft ?? 0),
    };
  },

  // --- Election list (EventSummary) ---
  async getElections(query: ListQuery = {}): Promise<OrgList<EventSummary>> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    params.set('per_page', String(query.perPage ?? 100));
    params.set('page', String(query.page ?? 1));
    const res = await getApiClient().get<unknown>(`${API.ENDPOINTS.ELECTIONS.BASE}?${params.toString()}`) as ApiResponseWithMeta<unknown>;
    const items = unwrapPayload<RawElection[]>(res.data);
    const statusMap: Record<string, EventSummary['status']> = {
      DRAFT: 'draft', READY: 'ready', CREATED: 'created', PUBLISHED: 'published', LIVE: 'live',
      ENDED: 'ended', COMPLETED: 'completed', ARCHIVED: 'archived', CANCELLED: 'cancelled',
    };
    // Prefer the wire `status` field: the backend normalizes every lifecycle
    // state to one of DRAFT/CREATED/PUBLISHED/LIVE/ENDED/ARCHIVED/CANCELLED
    // (pending_review/approved/scheduled -> CREATED, paused -> LIVE,
    // closed/certified -> ENDED). Using `lifecycleState` directly collapsed
    // those states to 'draft', making real elections vanish into the wizard.
    const normalizeStatus = (e: RawElection): EventSummary['status'] =>
      statusMap[String(e.status ?? e.lifecycleState ?? '').toUpperCase()] ?? 'created';
    return {
      items: items.map((e) => {
        const voters = Number(e.totalRegistered ?? 0);
        const votes = Number(e.totalVotes ?? 0);
        return {
          id: e.id,
          title: e.title,
          status: normalizeStatus(e),
          scheduledPublishAt: e.scheduledPublishAt ?? null,
          startsAt: e.startsAt ?? e.createdAt ?? '',
          endsAt: e.endsAt ?? '',
          voters,
          turnout: voters > 0 ? Math.round((votes / voters) * 100) : 0,
          positions: Number(e.positionCount ?? 0),
        };
      }),
      total: res.meta?.total ?? items.length,
      page: res.meta?.current_page ?? 1,
      perPage: res.meta?.per_page ?? 100,
    };
  },

  // --- Composed dashboard ---
  async getDashboard(): Promise<OrgDashboardData> {
    const [electionSummary, team, notifications, activity, subscription, billing, elections] = await Promise.allSettled([
      this.getElectionSummary(),
      this.getTeam({ perPage: 100 }),
      this.getNotifications({ perPage: 100 }),
      this.getActivityFeed(),
      this.getSubscriptionInfo(),
      this.getBilling(),
      this.getElections({ perPage: 100 }),
    ]);

    // Core sources (election summary + election list) both failing means the
    // dashboard is genuinely broken — surface the error instead of silently
    // rendering all-zero stats that mislead the user.
    if (electionSummary.status === 'rejected' && elections.status === 'rejected') {
      throw new Error('Unable to load dashboard data. Please try again.');
    }

    const summary = electionSummary.status === 'fulfilled' ? electionSummary.value : { total: 0, live: 0, published: 0, completed: 0, draft: 0 };
    const members = team.status === 'fulfilled' ? team.value.items : [];
    const notifs = notifications.status === 'fulfilled' ? notifications.value.items : [];
    const feed = activity.status === 'fulfilled' ? activity.value : [];
    const electionItems = elections.status === 'fulfilled' ? elections.value.items : [];
    // No fabricated subscription row: when the subscription source rejects,
    // surface the error to the UI (null) instead of silently showing Free/₦0.
    const sub = subscription.status === 'fulfilled' ? subscription.value : null;
    const bill = billing.status === 'fulfilled' ? billing.value : null;

    const storageGb = bill && bill.usage.storage_bytes > 0
      ? Math.max(0.1, Math.round((bill.usage.storage_bytes / 1024 / 1024 / 1024) * 10) / 10)
      : 0;
    const storageTotal = bill && bill.plan?.limits && (bill.plan.limits as Record<string, number>).storage_bytes
      ? Math.round(((bill.plan.limits as Record<string, number>).storage_bytes as number) / 1024 / 1024 / 1024)
      : 5;

    const stats: DashboardStat[] = [
      {
        id: 'active-events', label: 'Active Events', insight: 'Currently accepting votes',
        value: summary.live, trend: 0, trendLabel: 'live now', icon: 'CalendarCheck2',
      },
      {
        id: 'total-voters', label: 'Registered Voters', insight: 'Across all events',
        value: bill?.usage.participants ?? 0, trend: 0, trendLabel: 'total', icon: 'Users',
      },
{
      id: 'avg-turnout', label: 'Average Turnout', insight: 'Voter participation rate',
      value: electionItems.length > 0
        ? Math.round(electionItems.reduce((acc, e) => acc + e.turnout, 0) / electionItems.length)
        : 0,
      suffix: '%', trend: 0, trendLabel: 'avg across events', icon: 'Percent',
    },
      {
        id: 'completion-rate', label: 'Event Completion Rate', insight: 'Events completed on time',
        value: summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0,
        suffix: '%', trend: 0, trendLabel: 'improvement', icon: 'Target',
      },
    ];

    const pendingTasks: PendingTask[] = [];
    if (summary.draft > 0) {
      pendingTasks.push({ id: 'task-drafts', label: 'Review pending draft elections', count: summary.draft, href: '/org/events', priority: 'high' });
    }
    if (summary.published > 0) {
      pendingTasks.push({ id: 'task-published', label: 'Elections awaiting start', count: summary.published, href: '/org/events', priority: 'medium' });
    }
    if (bill && bill.seats.remaining === 0 && bill.seats.limit > 0) {
      pendingTasks.push({ id: 'task-seats', label: 'Team seats exhausted — upgrade', count: 1, href: '/org/billing', priority: 'high' });
    }

    const health: WorkspaceHealth = {
      subscriptionStatus: sub?.status ?? 'unavailable',
      storageUsed: storageGb,
      storageTotal,
      activeEvents: summary.live,
      completedEvents: summary.completed,
      pendingTasks: pendingTasks.length,
      notificationStatus: notifs.length > 0 && notifs.every((n) => n.read) ? 'all_sent' : 'unavailable',
      workspaceScore: Math.min(100, Math.round((summary.completed / Math.max(1, summary.total)) * 50) + 50),
      systemMessages: [
        'All systems operational',
        bill ? 'Subscription active' : 'Subscription setup pending',
        ...(storageGb > storageTotal * 0.8 ? ['Storage usage is above 80%'] : []),
      ],
    };

    const eligibility: EligibilityCheck[] = [
      {
        feature: 'Event Creation',
        status: summary.total >= 100 ? 'quota_exceeded' : 'included',
        currentUsage: summary.total,
        limit: 100,
        message: `${summary.total} of 100 events created`,
      },
      {
        feature: 'Participant Capacity',
        status: 'included',
        currentUsage: bill?.usage.participants ?? 0,
        limit: 999999,
        message: 'Within participant capacity',
      },
      {
        feature: 'Team Members',
        status: bill && bill.seats.remaining === 0 && bill.seats.limit > 0 ? 'quota_exceeded' : 'included',
        currentUsage: bill?.seats.used ?? 0,
        limit: bill?.seats.limit ?? 0,
        message: `${bill?.seats.used ?? 0} of ${bill?.seats.limit ?? 0} team members used`,
      },
      {
        feature: 'Storage',
        status: storageGb > storageTotal * 0.9 ? 'quota_exceeded' : 'included',
        currentUsage: storageGb,
        limit: storageTotal,
        message: `${storageGb} GB of ${storageTotal} GB storage used`,
      },
      {
        feature: 'Custom Roles',
        status: 'included',
        currentUsage: 0,
        limit: 5,
        message: 'Custom roles included',
      },
    ];

    return { stats, elections: electionItems, notifications: notifs, activity: feed, team: members, subscription: sub, storage: { used: storageGb, total: storageTotal, unit: 'GB' }, health, pendingTasks, eligibility };
  },
};
