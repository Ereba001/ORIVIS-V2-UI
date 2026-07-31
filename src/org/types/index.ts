export interface OrgBrandingConfig {
  organizationName: string
  workspaceName: string
  shortName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  browserTitle: string
  workspaceTitle: string
  tagline: string
  eventPackage: string
}

export interface OrgUser {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
  role: string
}

export interface DashboardStat {
  id: string
  label: string
  value: number
  insight: string
  prefix?: string
  suffix?: string
  trend: number
  trendLabel: string
  icon: string
}

export interface EventSummary {
  id: string
  title: string
  status: 'live' | 'published' | 'completed' | 'draft' | 'ready'
  startsAt: string
  endsAt: string
  voters: number
  turnout: number
  positions: number
}

export interface OrgNotification {
  id: string
  title: string
  preview: string
  time: string
  read: boolean
  type: 'event' | 'team' | 'system' | 'alert'
}

export interface ActivityEvent {
  id: string
  action: string
  time: string
  type: 'create' | 'update' | 'complete' | 'alert' | 'system'
  user?: string
}

export interface TeamMember {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
  role: string
  department: string
  status: 'active' | 'invited' | 'suspended'
  lastActive: string
}

export interface SubscriptionInfo {
  plan: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled'
  seatsUsed: number
  seatsTotal: number
  nextBilling: string
  amount: number
  currency: string
}

export interface WorkspaceStatus {
  label: string
  value: string
  variant: 'success' | 'warning' | 'error' | 'info'
}

export interface EventHealth {
  label: string
  value: number
  max: number
  color: string
}

export interface StorageUsage {
  used: number
  total: number
  unit: string
}

export interface PendingTask {
  id: string
  label: string
  count: number
  href: string
  priority: 'high' | 'medium' | 'low'
}

export interface HeroSectionData {
  greeting: string
  organizationName: string
  workspaceName: string
  summary: string
  hasActiveEvents: boolean
  activeCount: number
  packageName: string
  workspaceStatus: 'ready' | 'setup-needed' | 'attention-needed'
  ctaLabel: string
  ctaHref: string
}

export interface Invitation {
  id: string
  email: string
  invitedBy: string
  role: string
  department: string
  sentAt: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
}

export interface Permission {
  id: string
  label: string
  key: string
  group: string
  enabled: boolean
}

export interface PermissionGroup {
  id: string
  label: string
  permissions: Permission[]
}

export interface Role {
  id: string
  name: string
  description: string
  type: 'system' | 'custom'
  isActive: boolean
  memberCount: number
  permissions: PermissionGroup[]
  createdAt: string
}

export interface BillingPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  popular: boolean
  features: string[]
  participantCapacity: number
  teamCapacity: number
  customRoleCapacity: number
  storageLimit: number
}

export interface Invoice {
  id: string
  description: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'failed'
  issuedAt: string
  paidAt: string | null
  pdfUrl: string | null
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank'
  last4: string
  brand: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

export interface WorkspaceProfile {
  organizationName: string
  shortName: string
  contactEmail: string
  phone: string
  website: string
  address: string
}

export interface BrandingSettings {
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  themeMode: 'light' | 'dark' | 'system'
}

export interface WorkspaceConfig {
  workspaceName: string
  timezone: string
  language: string
  eventVisibility: 'public' | 'private'
  notificationEmail: boolean
  notificationSms: boolean
  notificationPush: boolean
  sessionTimeout: number
  require2fa: boolean
  loginAlerts: boolean
}

export interface AuditEvent {
  id: string
  user: string
  avatarUrl: string | null
  action: string
  module: 'Event' | 'Voter' | 'Candidate' | 'Team' | 'Settings' | 'Billing' | 'Auth'
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
  ipAddress: string
}

export interface HelpArticle {
  id: string
  title: string
  description: string
  category: string
  readTime: string
  content: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

export interface ReleaseNote {
  id: string
  version: string
  date: string
  title: string
  changes: string[]
  type: 'feature' | 'fix' | 'improvement'
}

// ===== EVENT MANAGEMENT TYPES =====

export type EventType = 'governance_election' | 'award_competition' | 'poll' | 'survey' | 'referendum' | 'agm' | 'recruitment' | 'general_meeting' | 'custom'

export type EventStatus = 'draft' | 'ready' | 'published' | 'live' | 'completed' | 'archived' | 'cancelled'

export interface OrivisEvent {
  id: string
  title: string
  type: EventType
  status: EventStatus
  description: string
  startsAt: string
  endsAt: string
  registrationStartsAt: string
  registrationEndsAt: string
  timezone: string
  organizationId: string
  organizationName: string
  participantCount: number
  candidateCount: number
  positionCount: number
  registrationProgress: number
  voterTurnout: number
  createdAt: string
  updatedAt: string
  visibility: 'public' | 'private'
  branding: EventBrandingConfig
  settings: EventSettings
  publishReadiness: PublishReadiness
}

export interface PublishReadiness {
  brandingComplete: boolean
  positionsDefined: boolean
  candidatesNominated: boolean
  participantsImported: boolean
  votingScheduleSet: boolean
  visibilityConfigured: boolean
  requiredSettingsComplete: boolean
}

export interface EventBrandingConfig {
  bannerUrl: string | null
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  theme: 'light' | 'dark' | 'system'
  customUrl: string | null
}

export interface EventSettings {
  participationModel: 'closed_list' | 'invitation_only' | 'imported' | 'org_id_verification' | 'public_registration' | 'open_public'
  allowAnonymousVoting: boolean
  requireEmailVerification: boolean
  requireIdVerification: boolean
  maxVotesPerParticipant: number
  resultPublication: 'hidden' | 'scheduled' | 'immediate' | 'manual' | 'certified'
  resultPublishedAt: string | null
  notifyOnRegistration: boolean
  notifyOnVote: boolean
  allowMultipleVotes: boolean
  requireTwoFactor: boolean
}

export interface EventPosition {
  id: string
  eventId: string
  title: string
  description: string
  maxSelections: number
  ballotOrder: number
  candidates: EventCandidate[]
}

export interface EventCandidate {
  id: string
  eventId: string
  positionId: string
  name: string
  email: string
  photoUrl: string | null
  biography: string
  manifestoUrl: string | null
  status: 'approved' | 'pending' | 'rejected' | 'withdrawn'
  ballotOrder: number
  voteCount: number
  createdAt: string
}

export interface EventParticipant {
  id: string
  eventId: string
  name: string
  email: string
  organizationId: string
  department: string
  registrationStatus: 'registered' | 'verified' | 'approved' | 'rejected'
  verificationStatus: 'pending' | 'verified' | 'failed'
  votingPassStatus: 'not_issued' | 'issued' | 'used' | 'expired'
  votingPassId: string | null
  registeredAt: string
  verifiedAt: string | null
}

export interface EventRegistration {
  id: string
  eventId: string
  isOpen: boolean
  eligibilityRules: string[]
  verificationMethods: string[]
  autoApprove: boolean
  maxParticipants: number
  currentRegistrations: number
  passSettings: {
    expiresInHours: number
    singleUse: boolean
  }
}

export interface EventAnalytics {
  registrationTrend: { date: string; count: number }[]
  participantGrowth: { date: string; total: number }[]
  candidateStats: { total: number; approved: number; pending: number; rejected: number }
  turnoutProjection: { projected: number; current: number; percentage: number }
  timelineActivity: TimelineActivity[]
  eventHealth: {
    label: string
    value: number
    max: number
    status: 'healthy' | 'warning' | 'critical'
  }[]
}

export interface TimelineActivity {
  id: string
  action: string
  description: string
  timestamp: string
  type: 'create' | 'update' | 'approve' | 'reject' | 'publish' | 'complete' | 'alert' | 'system'
  user: string
}

export interface CreateEventInput {
  title: string
  type: EventType
  description: string
  startsAt: string
  endsAt: string
  registrationStartsAt: string
  registrationEndsAt: string
  timezone: string
  visibility: 'public' | 'private'
  branding: {
    primaryColor: string
    accentColor: string
    theme: 'light' | 'dark' | 'system'
  }
  settings: Partial<EventSettings>
}

// ===== AUDIT ARCHITECTURE =====

export type AuditCategory = 'workspace' | 'event' | 'voting' | 'billing' | 'team' | 'settings' | 'auth' | 'system'

export interface WorkspaceAuditEvent {
  id: string
  user: string
  action: string
  module: 'Workspace' | 'Team' | 'Billing' | 'Branding' | 'Settings' | 'Auth'
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
  ipAddress: string
}

export interface EventAuditEvent {
  id: string
  user: string
  action: string
  module: 'Event' | 'Candidate' | 'Participant' | 'Result' | 'Voting' | 'Settings'
  eventId: string
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
  ipAddress: string
}

export interface VotingAuditEvent {
  id: string
  user: string
  action: string
  module: 'Voting' | 'Receipt' | 'Ballot' | 'Pass'
  eventId: string
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
  ipAddress: string
  passId?: string
  receiptId?: string
}

// ===== NOTIFICATION ARCHITECTURE =====

export type NotificationCategory = 'organization' | 'workspace' | 'event' | 'team' | 'candidate' | 'participant' | 'voting' | 'result' | 'billing' | 'security' | 'support' | 'system'

export interface NotificationPriority {
  level: 'low' | 'normal' | 'high' | 'urgent'
  color: string
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  category: NotificationCategory
  priority: 'low' | 'normal' | 'high' | 'urgent'
  source: string
  timestamp: string
  read: boolean
  relatedResource?: string
  relatedResourceType?: string
}

// ===== RESULTS LIFECYCLE =====

export type ResultStatus = 'hidden' | 'scheduled' | 'immediate' | 'manual' | 'certified'

export interface ResultPublication {
  status: ResultStatus
  scheduledAt?: string
  publishedAt?: string
  certifiedAt?: string
  certifiedBy?: string
  certificationToken?: string
}

// ===== WORKSPACE HEALTH =====

export interface WorkspaceHealth {
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'inactive'
  storageUsed: number
  storageTotal: number
  activeEvents: number
  completedEvents: number
  pendingTasks: number
  securityScore: number
  notificationStatus: 'all_sent' | 'delayed' | 'failed'
  workspaceScore: number
  systemMessages: string[]
}

// ===== EVENT TEMPLATES =====

export interface EventTemplate {
  id: string
  name: string
  description: string
  type: EventType
  category: 'default' | 'organization' | 'recent'
  configuration: {
    title: string
    description: string
    timezone: string
    visibility: 'public' | 'private'
    branding: {
      primaryColor: string
      accentColor: string
      theme: 'light' | 'dark' | 'system'
    }
    settings: Partial<EventSettings>
  }
  createdAt: string
  usedCount: number
}

// ===== ARCHIVE CENTRE =====

export interface ArchiveRecord {
  id: string
  eventId: string
  eventTitle: string
  archivedAt: string
  reason: string
  archiveHistory: {
    action: string
    timestamp: string
    user: string
  }[]
  canRestore: boolean
  retentionPeriod: string
}

// ===== REPORTING =====

export type ReportType = 'executive_summary' | 'participation' | 'turnout' | 'candidate_performance' | 'results_summary' | 'audit' | 'timeline' | 'event_summary'

export interface ReportExport {
  format: 'csv' | 'pdf' | 'json'
  generatedAt: string
  reportType: ReportType
  eventId?: string
}

// ===== SUBSCRIPTION ELIGIBILITY =====

export type SubscriptionEligibility = 'included' | 'upgrade_required' | 'quota_exceeded' | 'trial_available' | 'enterprise_required' | 'unlimited'

export interface EligibilityCheck {
  feature: string
  status: SubscriptionEligibility
  currentUsage: number
  limit: number
  message: string
  planRequired?: string
}
