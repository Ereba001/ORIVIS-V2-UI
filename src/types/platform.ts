import type { UUID, ISO8601DateTime, EmailAddress } from './common'

// --- Platform Staff ---
export type StaffDepartment = 'ENGINEERING' | 'CUSTOMER_SUCCESS' | 'TECHNICAL_SUPPORT' | 'FINANCE' | 'SECURITY' | 'COMPLIANCE' | 'SALES' | 'MARKETING' | 'OPERATIONS'
export type StaffRole = 'FOUNDER' | 'PLATFORM_ADMINISTRATOR' | 'CUSTOMER_SUCCESS' | 'TECHNICAL_SUPPORT' | 'FINANCE' | 'SECURITY' | 'COMPLIANCE' | 'AUDITOR'
export type StaffStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DEACTIVATED'

export interface PlatformStaff {
  id: UUID
  name: string
  email: EmailAddress
  avatarUrl: string | null
  department: StaffDepartment
  role: StaffRole
  status: StaffStatus
  lastActive: ISO8601DateTime
  joinedAt: ISO8601DateTime
  permissions: string[]
}

// --- Platform Roles ---
export type PermissionGroup = 'PLATFORM' | 'EVENTS' | 'SUPPORT' | 'AUDIT' | 'ANALYTICS' | 'FINANCE' | 'SECURITY' | 'SETTINGS'

export interface Permission {
  id: string
  key: string
  label: string
  group: PermissionGroup
  description: string
}

export interface PlatformRole {
  id: UUID
  name: string
  description: string
  type: 'SYSTEM' | 'CUSTOM'
  isProtected: boolean
  isArchived: boolean
  permissions: string[]
  permissionCount: number
  staffCount: number
  createdAt: ISO8601DateTime
  updatedAt: ISO8601DateTime
}

// --- Support Tickets ---
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TicketStatus = 'OPEN' | 'ASSIGNED' | 'ACCEPTED' | 'WAITING' | 'RESOLVED' | 'CLOSED'
export type TicketCategory = 'TECHNICAL' | 'BILLING' | 'ACCOUNT' | 'FEATURE_REQUEST' | 'BUG_REPORT' | 'SECURITY' | 'SUSPENSION_APPEAL' | 'OTHER'

export type AppealDecision = 'pending' | 'upheld' | 'lifted' | 'request_more_info' | 'escalated'

export interface SupportTicket {
  id: UUID
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  organizationName: string
  organizationId: UUID
  appealDecision?: AppealDecision | null
  appealDecisionNote?: string | null
  appealDecidedAt?: string | null
  appealDecidedByName?: string | null
  assignedTo: UUID | null
  assignedToName: string | null
  acceptedBy: UUID | null
  acceptedByName: string | null
  acceptedAt: ISO8601DateTime | null
  createdBy: string
  createdAt: ISO8601DateTime
  updatedAt: ISO8601DateTime
  messages: TicketMessage[]
}

export interface TicketMessage {
  id: UUID
  author: string
  authorRole: 'STAFF' | 'ORGANIZATION'
  content: string
  messageType: 'text' | 'voice' | 'image' | 'file'
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  fileType: string | null
  voiceDuration: number | null
  createdAt: ISO8601DateTime
}

// --- Internal Notes ---
export interface InternalNote {
  id: UUID
  organizationId: UUID
  author: string
  content: string
  createdAt: ISO8601DateTime
  updatedAt: ISO8601DateTime
}

// --- Platform Notifications ---
export type PlatformNotificationType = 'ORG_REGISTRATION' | 'EVENT_PUBLISH_REQUEST' | 'SUBSCRIPTION_ALERT' | 'SECURITY_ALERT' | 'PLATFORM_ANNOUNCEMENT'

export interface PlatformNotification {
  id: UUID
  type: PlatformNotificationType
  title: string
  description: string
  read: boolean
  actionable: boolean
  actionLabel?: string
  actionPath?: string
  priority: 'info' | 'success' | 'warning' | 'critical'
  level: 'critical' | 'important' | 'normal'
  createdAt: ISO8601DateTime
}

// --- Subscription Operations ---
export type SubscriptionPlanTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM'
export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'EXPIRING' | 'RENEWED' | 'SUSPENDED' | 'CANCELLED'

export interface SubscriptionRecord {
  id: UUID
  organizationId: UUID
  organizationName: string
  plan: SubscriptionPlanTier
  status: SubscriptionStatus
  maxVoters: number
  price: string
  priceValue: number
  currency: string
  startedAt: ISO8601DateTime
  expiresAt: ISO8601DateTime
  renewedAt?: ISO8601DateTime
  cancelledAt?: ISO8601DateTime
  paymentMethod: string
}

export interface PlatformPlan {
  id: UUID
  name: string
  slug: string
  description: string | null
  price: number
  currency: string
  interval: string
  isActive: boolean
  isFree: boolean
  sortOrder: number
  features: string[] | null
  limits: Record<string, unknown> | null
}

// --- Activity Log ---
export interface PlatformActivity {
  id: UUID
  actor: string
  action: string
  target: string
  targetType: string
  organizationId?: UUID
  organizationName?: string
  timestamp: ISO8601DateTime
  severity: 'info' | 'warning' | 'critical'
}

// --- Platform Audit Log ---
export interface PlatformAuditLog {
  id: UUID
  action: string
  user: string
  category: string
  severity: 'Info' | 'Warning' | 'Critical'
  timestamp: string
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
  auditableType?: string | null
  auditableId?: number | null
  organizationId?: number | null
  userId?: number | null
}

// --- Platform Elections ---
export interface PlatformElection {
  id: UUID
  name: string
  org: string
  status: string
  voters: number
  turnout: number
  created: string
}

// --- Platform Invoices ---
export type InvoiceStatus = 'Paid' | 'Pending' | 'Free'

export interface PlatformInvoice {
  id: UUID
  org: string
  plan: string
  amount: string
  status: InvoiceStatus
  date: string
}

// --- Platform Memberships ---
export type PlatformMembershipStatus = 'Active' | 'Pending' | 'Suspended'

export interface PlatformMembership {
  id: UUID
  user: string
  email: string
  org: string
  role: string
  status: PlatformMembershipStatus
  joined: string
}

// --- Platform User ---
export type UserAccountStatus = 'Active' | 'Pending' | 'Suspended'

export interface PlatformUser {
  id: UUID
  name: string
  email: string
  role: string
  status: UserAccountStatus
  org: string
  joined: string
  lastLogin: string
  emailVerified: boolean
  mfaEnabled: boolean
  lifecycleState: string
}

// --- Organization Health ---
export interface OrganizationHealth {
  organizationId: UUID
  organizationName: string
  orivisId?: string
  slug: string
  logoUrl: string | null
  email: string | null
  phone: string | null
  status: string
  subscription: string
  plan: string
  activeEvents: number
  members: number
  admins: number
  storageUsed: number
  storageTotal: number
  lastActivity: ISO8601DateTime
  country: string
  dateJoined: ISO8601DateTime
  workspaceStatus: 'healthy' | 'attention' | 'critical'
  assistedEventsEnabled?: boolean
}

// --- Workspace Inspection Sessions ---
export type WorkspaceSessionMode = 'view_only' | 'full_control'
export type WorkspaceSessionStatus = 'active' | 'closed'
export type WorkspaceRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface WorkspaceSession {
  id: UUID
  organizationId: string
  organization: string | null
  mode: WorkspaceSessionMode
  reason: string | null
  category: string | null
  riskLevel: WorkspaceRiskLevel | null
  isEmergency: boolean
  actionCount: number
  status: WorkspaceSessionStatus
  enteredAt: ISO8601DateTime | null
  exitedAt: ISO8601DateTime | null
}

export interface WorkspaceView {
  sessionActive: boolean
  session: WorkspaceSession | null
  organization: {
    uuid: UUID
    name: string
    orivis_id?: string
    slug: string
    email: string
    phone: string | null
    country: string | null
    status: string
    logo_url: string | null
    users_count: number
    admins_count: number
    elections_count: number
    support_tickets_count: number
    created_at: ISO8601DateTime
  }
  workspace: { workspaceName: string; setupProgress: number; hasBranding: boolean }
  storage: { bytes: number; megabytes: number }
  subscription: Record<string, unknown> | null
  profile: Record<string, unknown> | null
  lastActivity: { event: string; at: string; actor: string } | null
}

// --- Free-Event Abuse Flags ---
export interface PlatformFreeEventFlag {
  id: string
  uuid: UUID
  severity: 'low' | 'medium' | 'high'
  reason: string | null
  signals: Record<string, unknown> | null
  isBlocked: boolean
  resolved: boolean
  resolvedAt: ISO8601DateTime | null
  createdAt: ISO8601DateTime
  organization: { id: number; uuid: UUID; name: string; slug: string; email: string; status: string } | null
  election: { id: number; uuid: UUID; title: string; estimatedParticipants: number | null; lifecycleState: string } | null
}

// --- Event Payments (finance console) ---
export interface PlatformPayment {
  id: number
  uuid: UUID
  provider: string
  reference: string
  providerReference: string | null
  status: 'pending' | 'verified' | 'failed' | 'cancelled'
  amount: number
  currency: string
  verifiedAt: ISO8601DateTime | null
  paidAt: ISO8601DateTime | null
  createdAt: ISO8601DateTime
  organization: { id: number; uuid: UUID; name: string } | null
  election: { id: number; uuid: UUID; title: string } | null
}

export interface PlatformPricingTier {
  id: number
  uuid: UUID
  name: string
  code: string
  description: string | null
  minParticipants: number
  maxParticipants: number
  price: number
  currency: string
  isFree: boolean
  isActive: boolean
  sortOrder: number
  effectiveFrom: ISO8601DateTime | null
  archivedAt: ISO8601DateTime | null
  createdAt: ISO8601DateTime
  updatedAt: ISO8601DateTime
}

export type PricingTierPayload = {
  name: string
  code: string
  description?: string | null
  minParticipants: number
  maxParticipants: number
  price: number
  currency?: string
  isFree?: boolean
  isActive?: boolean
  sortOrder?: number
  effectiveFrom?: string | null
}

// --- Commercial overview (per election billing model) ---
export interface PlatformCommercialOverview {
  organizations: {
    total: number
    paid: number
    free: number
    noBillingActivity: number
  }
  elections: {
    paid: number
    free: number
  }
  payments: {
    pending: number
    verified: number
    failed: number
    cancelled: number
  }
  revenue: {
    byCurrency: Record<string, number>
  }
}

// --- Finance analytics (local NGN / international USD) ---
export interface PlatformCurrencyBucket {
  count: number
  revenue: number
  avgTransactionValue: number
  successful: number
  pending: number
  failed: number
  cancelled: number
}

export interface PlatformFinanceAnalytics {
  overall: {
    revenueByCurrency: Record<string, number>
    verified: number
    pending: number
    failed: number
    payingOrganizations: number
    paidElections: number
    freeElections: number
    freeOrganizations: number
    paidOrganizations: number
  }
  local: PlatformCurrencyBucket
  international: PlatformCurrencyBucket
  trends: { month: string; revenue: number; volume: number }[]
  revenueByTier: { tier: string; revenue: number; elections: number }[]
}

export type ServiceHealthStatus = 'healthy' | 'unhealthy' | 'unknown'

export interface SystemServiceHealth {
  healthy: boolean | null
  message?: string
  error?: string
  driver?: string
  lastTick?: string | null
  connection?: string
  pending?: number
  processing?: number
  failed?: number
}

export interface PlatformSystemHealth {
  status: string
  timestamp: string
  environment: string
  debug: boolean
  services: {
    database: SystemServiceHealth
    cache: SystemServiceHealth
    scheduler: SystemServiceHealth
    queue: SystemServiceHealth
  }
}

// ── Security Operations Center ──

export type SecurityEventSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type SecurityClassification = 'NORMAL' | 'SUSPICIOUS' | 'MALICIOUS' | 'BLOCKED'
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'FALSE_POSITIVE'
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'FALSE_POSITIVE'

export interface SecurityEvent {
  id: number
  uuid: UUID
  organization_id: number | null
  organization_name?: string
  organization_orivis_id?: string
  user_id: number | null
  user_name?: string
  event_type: string
  severity: SecurityEventSeverity
  classification: SecurityClassification
  actor_type: string | null
  actor_id: string | null
  actor_role: string | null
  source: string
  ip_address: string | null
  user_agent: string | null
  service: string | null
  endpoint: string | null
  http_method: string | null
  action: string | null
  target_type: string | null
  target_id: string | null
  result: string
  http_status: number | null
  description: string | null
  risk_score: number
  risk_factors: Array<{ reason: string; contribution: number }> | null
  detection_rule: string | null
  response_action: string | null
  response_detail: string | null
  correlation_id: string | null
  request_id: string | null
  incident_id: number | null
  count: number
  window_seconds: number | null
  event_time: ISO8601DateTime | null
  created_at: ISO8601DateTime
  updated_at: ISO8601DateTime
}

export interface SecurityIncident {
  id: number
  uuid: UUID
  organization_id: number | null
  organization?: { id: number; uuid: UUID; name: string; orivis_id: string; slug: string; status: string } | null
  severity: SecurityEventSeverity
  status: IncidentStatus
  risk_score: number
  risk_factors: Array<{ reason: string; contribution: number }> | null
  detection_rules: string[] | null
  event_count: number
  title: string | null
  description: string | null
  source_ip: string | null
  source_type: string | null
  auto_response: string | null
  auto_response_detail: string | null
  auto_responded_at: ISO8601DateTime | null
  investigation_notes: string | null
  investigated_at: ISO8601DateTime | null
  resolved_at: ISO8601DateTime | null
  contained_at: ISO8601DateTime | null
  first_detected_at: ISO8601DateTime | null
  last_detected_at: ISO8601DateTime | null
  affected_resources: unknown[] | null
  events?: SecurityEvent[]
  alerts?: SecurityAlert[]
  created_at: ISO8601DateTime
  updated_at: ISO8601DateTime
}

export interface SecurityIncidentTimeline {
  id: number
  incident_id: number
  security_event_id: number | null
  event_type: string
  severity: SecurityEventSeverity
  action: string
  detail: string | null
  actor: string | null
  source: string | null
  event_time: ISO8601DateTime
  created_at: ISO8601DateTime
}

export interface SecurityAlert {
  id: number
  uuid: UUID
  incident_id: number | null
  organization_id: number | null
  organization?: { id: number; uuid: UUID; name: string; orivis_id: string; slug: string; status: string } | null
  severity: SecurityEventSeverity
  status: AlertStatus
  title: string
  description: string | null
  data: Record<string, unknown> | null
  source: string
  detection_rule: string | null
  count: number
  dedupe_key: string | null
  correlation_id: string | null
  delivered_in_app: boolean
  delivered_email: boolean
  delivered_webhook: boolean
  acknowledged_at: ISO8601DateTime | null
  resolved_at: ISO8601DateTime | null
  resolution_note: string | null
  created_at: ISO8601DateTime
  updated_at: ISO8601DateTime
}

export interface SecurityDashboardSummary {
  system_status: string
  security_status: string
  active_incidents: number
  critical_alerts: number
  suspended_organizations: number
  suspicious_sources: number
  actions_per_second: number
  total_events_1h: number
  failed_actions: number
  blocked_actions: number
  suspicious_actions: number
  active_organizations: number
  active_ips: number
  severity_counts: Record<string, number>
  category_counts: Record<string, number>
}

export interface SecurityRealtimeSummary {
  total_events: number
  total_failed: number
  total_blocked: number
  total_suspicious: number
  actions_per_second: number
  max_actions_per_minute: number
  min_actions_per_minute: number
  avg_actions_per_minute: number
  active_organizations: number
  active_ips: number
  severity_counts: Record<string, number>
  category_counts: Record<string, number>
  window_minutes: number
}

export interface SecurityActivityGraph {
  buckets: Array<{ time: string; timestamp: number; count: number }>
  total: number
  period_minutes: number
  metric: string
}

export interface SecurityTelemetryHealth {
  status: 'LIVE' | 'RECONNECTING' | 'DEGRADED' | 'OFFLINE'
  last_event_at: ISO8601DateTime | null
  last_event_age_seconds: number | null
  events_last_5min: number
}

export interface OrganizationRequiringAttention {
  organization: {
    id: number
    uuid: UUID
    name: string
    orivis_id: string
    slug: string
    status: string
  }
  risk_score: number
  event_count: number
  latest_event_type: string | null
  latest_event_time: ISO8601DateTime | null
  open_incidents: number
}

// --- Telemetry Metrics ---
export interface TelemetryMetric {
  metric_name: string
  value: number
  tags: Record<string, unknown> | null
  recorded_at: string
}

export interface TelemetrySummary {
  avg: number
  max: number
  min: number
  data_points: number
}

export interface HealthIncident {
  id: number
  service: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string | null
  status: 'open' | 'investigating' | 'resolved'
  started_at: string
  resolved_at: string | null
  metadata: Record<string, unknown> | null
}

export interface DependencyNode {
  name: string
  type: 'database' | 'cache' | 'queue' | 'scheduler' | 'external'
  dependencies: string[]
  description: string
}

export interface DependencyMap {
  services: DependencyNode[]
}

// --- Enhanced System Health ---
export interface EnhancedSystemHealth extends PlatformSystemHealth {
  php: {
    version: string
    memory_limit: string
    max_execution_time: number
    upload_max_filesize: string
    post_max_size: string
  }
  services: {
    database: SystemServiceHealth & { latencyMs?: number; tables?: number; totalRows?: number }
    cache: SystemServiceHealth & { latencyMs?: number }
    scheduler: SystemServiceHealth & { ageSeconds?: number }
    queue: SystemServiceHealth & { recentFailures?: Array<{ id: number; queue: string; error: string; failedAt: string }> }
    memory: {
      healthy: boolean | null
      usageBytes?: number
      peakBytes?: number
      limitBytes?: number
      usagePercent?: number
      usageFormatted?: string
      peakFormatted?: string
      limitFormatted?: string
      message?: string
      error?: string
    }
    external: {
      paystack?: { healthy: boolean | null; latencyMs?: number; error?: string; message?: string }
      brevo?: { healthy: boolean | null; latencyMs?: number; error?: string; message?: string }
      cloudinary?: { healthy: boolean | null; latencyMs?: number; error?: string; message?: string }
    }
  }
}