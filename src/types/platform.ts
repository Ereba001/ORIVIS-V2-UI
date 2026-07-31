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
  staffCount: number
  createdAt: ISO8601DateTime
  updatedAt: ISO8601DateTime
}

// --- Support Tickets ---
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TicketStatus = 'OPEN' | 'ASSIGNED' | 'WAITING' | 'RESOLVED' | 'CLOSED'
export type TicketCategory = 'TECHNICAL' | 'BILLING' | 'ACCOUNT' | 'FEATURE_REQUEST' | 'BUG_REPORT' | 'OTHER'

export interface SupportTicket {
  id: UUID
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  organizationName: string
  organizationId: UUID
  assignedTo: UUID | null
  assignedToName: string | null
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
export type PlatformNotificationType = 'APPROVAL_REQUEST' | 'ORG_REGISTRATION' | 'EVENT_PUBLISH_REQUEST' | 'SUBSCRIPTION_ALERT' | 'SECURITY_ALERT' | 'PLATFORM_ANNOUNCEMENT'

export interface PlatformNotification {
  id: UUID
  type: PlatformNotificationType
  title: string
  description: string
  read: boolean
  actionable: boolean
  actionLabel?: string
  actionPath?: string
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
  startedAt: ISO8601DateTime
  expiresAt: ISO8601DateTime
  renewedAt?: ISO8601DateTime
  cancelledAt?: ISO8601DateTime
  paymentMethod: string
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
  slug: string
  logoUrl: string | null
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
}