import type {
  PlatformStaff,
  PlatformRole,
  Permission,
  SupportTicket,
  TicketMessage,
  InternalNote,
  PlatformNotification,
  SubscriptionRecord,
  OrganizationHealth,
  PlatformActivity,
  PlatformAuditLog,
  PlatformElection,
  PlatformInvoice,
  PlatformMembership,
  PlatformUser,
} from '../../types/platform'

// ---------------------------------------------------------------------------
// Helper – relative timestamps
// ---------------------------------------------------------------------------
function ago(days: number, hours = 0, minutes = 0): string {
  const d = new Date('2026-07-28T12:00:00Z')
  d.setDate(d.getDate() - days)
  d.setHours(d.getHours() - hours)
  d.setMinutes(d.getMinutes() - minutes)
  return d.toISOString()
}

// ---------------------------------------------------------------------------
// MOCK_PERMISSIONS — full permission matrix
// ---------------------------------------------------------------------------
export const MOCK_PERMISSIONS: Permission[] = [
  // PLATFORM
  { id: 'perm-platform-orgs', key: 'manage_organizations', label: 'Manage Organizations', group: 'PLATFORM', description: 'Create, edit, suspend, and delete organizations' },
  { id: 'perm-platform-staff', key: 'manage_staff', label: 'Manage Staff', group: 'PLATFORM', description: 'Invite, modify roles, and deactivate platform staff' },
  { id: 'perm-platform-billing', key: 'manage_billing', label: 'Manage Billing', group: 'PLATFORM', description: 'Configure billing rates, invoices, and payment methods' },
  // EVENTS
  { id: 'perm-events-review', key: 'review', label: 'Review Events', group: 'EVENTS', description: 'Review submitted events for compliance' },
  { id: 'perm-events-approve', key: 'publish', label: 'Publish Events', group: 'EVENTS', description: 'Publish or reject event publication requests' },
  { id: 'perm-events-reject', key: 'reject', label: 'Reject Events', group: 'EVENTS', description: 'Reject events that violate platform policies' },
  { id: 'perm-events-suspend', key: 'suspend', label: 'Suspend Events', group: 'EVENTS', description: 'Suspend ongoing events when necessary' },
  // SUPPORT
  { id: 'perm-support-tickets', key: 'tickets', label: 'Support Tickets', group: 'SUPPORT', description: 'View, assign, and respond to support tickets' },
  { id: 'perm-support-chat', key: 'live_chat', label: 'Live Chat', group: 'SUPPORT', description: 'Access live chat support system' },
  // AUDIT
  { id: 'perm-audit-view', key: 'view', label: 'View Audit Logs', group: 'AUDIT', description: 'Browse platform audit trail' },
  { id: 'perm-audit-export', key: 'export', label: 'Export Audit Logs', group: 'AUDIT', description: 'Export audit logs for external review' },
  // ANALYTICS
  { id: 'perm-analytics-view', key: 'view', label: 'View Analytics', group: 'ANALYTICS', description: 'Access platform analytics and reports' },
  // FINANCE
  { id: 'perm-finance-billing', key: 'billing', label: 'Billing Ops', group: 'FINANCE', description: 'Manage invoices, payments, and billing cycles' },
  { id: 'perm-finance-refunds', key: 'refunds', label: 'Process Refunds', group: 'FINANCE', description: 'Issue refunds and credits to organizations' },
  // SECURITY
  { id: 'perm-security-view', key: 'view', label: 'View Security Logs', group: 'SECURITY', description: 'Browse security events and access logs' },
  { id: 'perm-security-manage', key: 'manage', label: 'Manage Security', group: 'SECURITY', description: 'Configure security policies and 2FA requirements' },
  // SETTINGS
  { id: 'perm-settings-config', key: 'platform_configuration', label: 'Platform Configuration', group: 'SETTINGS', description: 'Modify global platform settings and feature flags' },
]

// ---------------------------------------------------------------------------
// MOCK_ROLES — 8 system + 3 custom
// ---------------------------------------------------------------------------
export const MOCK_ROLES: PlatformRole[] = [
  {
    id: 'role-sys-1', name: 'Founder', description: 'Ultimate platform owner with unrestricted access to all systems and data.', type: 'SYSTEM', isProtected: true, isArchived: false,
    permissions: MOCK_PERMISSIONS.map(p => p.key), staffCount: 1,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: ago(5),
  },
  {
    id: 'role-sys-2', name: 'Platform Administrator', description: 'Full administrative access across all platform modules except billing.', type: 'SYSTEM', isProtected: true, isArchived: false,
    permissions: MOCK_PERMISSIONS.filter(p => p.key !== 'manage_billing' && p.key !== 'platform_configuration').map(p => p.key), staffCount: 2,
    createdAt: '2024-01-15T00:00:00Z', updatedAt: ago(3),
  },
  {
    id: 'role-sys-3', name: 'Customer Success', description: 'Manage organizations, support tickets, and live chat interactions.', type: 'SYSTEM', isProtected: false, isArchived: false,
    permissions: ['manage_organizations', 'tickets', 'live_chat', 'view'], staffCount: 2,
    createdAt: '2024-02-01T00:00:00Z', updatedAt: ago(10),
  },
  {
    id: 'role-sys-4', name: 'Technical Support', description: 'Handle support tickets, bug triage, and live chat support.', type: 'SYSTEM', isProtected: false, isArchived: false,
    permissions: ['tickets', 'live_chat'], staffCount: 2,
    createdAt: '2024-02-01T00:00:00Z', updatedAt: ago(7),
  },
  {
    id: 'role-sys-5', name: 'Finance', description: 'Manage billing, invoicing, refunds, and subscription plans.', type: 'SYSTEM', isProtected: false, isArchived: false,
    permissions: ['manage_billing', 'billing', 'refunds', 'view'], staffCount: 1,
    createdAt: '2024-03-01T00:00:00Z', updatedAt: ago(14),
  },
  {
    id: 'role-sys-6', name: 'Security', description: 'Monitor security logs, manage access controls and platform safeguards.', type: 'SYSTEM', isProtected: false, isArchived: false,
    permissions: ['view', 'manage', 'view'], staffCount: 1,
    createdAt: '2024-03-15T00:00:00Z', updatedAt: ago(2),
  },
  {
    id: 'role-sys-7', name: 'Compliance', description: 'Review events for policy compliance, audit trail access, and content moderation.', type: 'SYSTEM', isProtected: false, isArchived: false,
    permissions: ['review', 'publish', 'reject', 'suspend', 'view'], staffCount: 1,
    createdAt: '2024-04-01T00:00:00Z', updatedAt: ago(6),
  },
  {
    id: 'role-sys-8', name: 'Auditor', description: 'Read-only access to audit logs, analytics, and security reports.', type: 'SYSTEM', isProtected: false, isArchived: false,
    permissions: ['view', 'export', 'view', 'view'], staffCount: 1,
    createdAt: '2024-04-01T00:00:00Z', updatedAt: ago(20),
  },
  {
    id: 'role-cus-1', name: 'Senior Support Agent', description: 'Elevated support role with ticket assignment and escalation powers.', type: 'CUSTOM', isProtected: false, isArchived: false,
    permissions: ['tickets', 'live_chat', 'manage_organizations'], staffCount: 1,
    createdAt: ago(90), updatedAt: ago(12),
  },
  {
    id: 'role-cus-2', name: 'Billing Manager', description: 'Handles subscription adjustments, invoicing, and payment reconciliation.', type: 'CUSTOM', isProtected: false, isArchived: false,
    permissions: ['manage_billing', 'billing', 'refunds'], staffCount: 1,
    createdAt: ago(60), updatedAt: ago(8),
  },
  {
    id: 'role-cus-3', name: 'Content Moderator', description: 'Reviews event content and organization profiles for policy compliance.', type: 'CUSTOM', isProtected: false, isArchived: true,
    permissions: ['review', 'reject', 'suspend'], staffCount: 0,
    createdAt: ago(45), updatedAt: ago(30),
  },
]

// ---------------------------------------------------------------------------
// MOCK_STAFF — 12 platform staff
// ---------------------------------------------------------------------------
export const MOCK_STAFF: PlatformStaff[] = [
  {
    id: 'staff-001', name: 'King P.', email: 'kingpreshie07@gmail.com', avatarUrl: null,
    department: 'ENGINEERING', role: 'FOUNDER', status: 'ACTIVE',
    lastActive: ago(0, 0, 15), joinedAt: '2024-01-01T00:00:00Z',
    permissions: MOCK_PERMISSIONS.map(p => p.key),
  },
  {
    id: 'staff-002', name: 'Aisha Mohammed', email: 'aisha.mohammed@orivis.io', avatarUrl: null,
    department: 'OPERATIONS', role: 'PLATFORM_ADMINISTRATOR', status: 'ACTIVE',
    lastActive: ago(0, 2), joinedAt: '2024-01-15T00:00:00Z',
    permissions: MOCK_PERMISSIONS.filter(p => p.key !== 'manage_billing').map(p => p.key),
  },
  {
    id: 'staff-003', name: 'Tunde Bakare', email: 'tunde.bakare@orivis.io', avatarUrl: null,
    department: 'OPERATIONS', role: 'PLATFORM_ADMINISTRATOR', status: 'ACTIVE',
    lastActive: ago(0, 0, 45), joinedAt: '2024-02-01T00:00:00Z',
    permissions: MOCK_PERMISSIONS.filter(p => p.key !== 'manage_billing' && p.key !== 'platform_configuration').map(p => p.key),
  },
  {
    id: 'staff-004', name: 'Chioma Eze', email: 'chioma.eze@orivis.io', avatarUrl: null,
    department: 'CUSTOMER_SUCCESS', role: 'CUSTOMER_SUCCESS', status: 'ACTIVE',
    lastActive: ago(0, 5), joinedAt: '2024-03-10T00:00:00Z',
    permissions: ['manage_organizations', 'tickets', 'live_chat'],
  },
  {
    id: 'staff-005', name: 'Femi Adeyemi', email: 'femi.adeyemi@orivis.io', avatarUrl: null,
    department: 'CUSTOMER_SUCCESS', role: 'CUSTOMER_SUCCESS', status: 'ACTIVE',
    lastActive: ago(0, 1, 30), joinedAt: '2024-04-05T00:00:00Z',
    permissions: ['manage_organizations', 'tickets', 'live_chat'],
  },
  {
    id: 'staff-006', name: 'Adaobi Nwachukwu', email: 'adaobi.nwachukwu@orivis.io', avatarUrl: null,
    department: 'TECHNICAL_SUPPORT', role: 'TECHNICAL_SUPPORT', status: 'ACTIVE',
    lastActive: ago(0, 0, 10), joinedAt: '2024-05-20T00:00:00Z',
    permissions: ['tickets', 'live_chat'],
  },
  {
    id: 'staff-007', name: 'Samuel Peters', email: 'samuel.peters@orivis.io', avatarUrl: null,
    department: 'TECHNICAL_SUPPORT', role: 'TECHNICAL_SUPPORT', status: 'INVITED',
    lastActive: ago(14), joinedAt: ago(14),
    permissions: ['tickets', 'live_chat'],
  },
  {
    id: 'staff-008', name: 'Yetunde Ojo', email: 'yetunde.ojo@orivis.io', avatarUrl: null,
    department: 'FINANCE', role: 'FINANCE', status: 'ACTIVE',
    lastActive: ago(0, 3), joinedAt: '2024-06-01T00:00:00Z',
    permissions: ['manage_billing', 'billing', 'refunds'],
  },
  {
    id: 'staff-009', name: 'Musa Bello', email: 'musa.bello@orivis.io', avatarUrl: null,
    department: 'SECURITY', role: 'SECURITY', status: 'ACTIVE',
    lastActive: ago(0, 0, 5), joinedAt: '2024-06-15T00:00:00Z',
    permissions: ['view', 'manage'],
  },
  {
    id: 'staff-010', name: 'Ngozi Eze', email: 'ngozi.eze@orivis.io', avatarUrl: null,
    department: 'COMPLIANCE', role: 'COMPLIANCE', status: 'ACTIVE',
    lastActive: ago(1), joinedAt: '2024-07-01T00:00:00Z',
    permissions: ['review', 'publish', 'reject', 'suspend'],
  },
  {
    id: 'staff-011', name: 'Bala Musa', email: 'bala.musa@orivis.io', avatarUrl: null,
    department: 'SALES', role: 'AUDITOR', status: 'ACTIVE',
    lastActive: ago(3), joinedAt: '2024-08-01T00:00:00Z',
    permissions: ['view', 'export'],
  },
  {
    id: 'staff-012', name: 'Lola Adeniyi', email: 'lola.adeniyi@orivis.io', avatarUrl: null,
    department: 'MARKETING', role: 'CUSTOMER_SUCCESS', status: 'SUSPENDED',
    lastActive: ago(10), joinedAt: '2024-09-01T00:00:00Z',
    permissions: ['manage_organizations', 'tickets'],
  },
]

// ---------------------------------------------------------------------------
// MOCK_TICKETS — 8 support tickets
// ---------------------------------------------------------------------------
const ticketMessages: Record<string, TicketMessage[]> = {
  'tkt-001': [
    { id: 'msg-tkt-001-1', author: 'Dr. Amina Bello', authorRole: 'ORGANIZATION', content: 'We are unable to publish our Board of Directors election. The system returns a "verification failed" error every time we try to submit.', createdAt: ago(5, 2) },
    { id: 'msg-tkt-001-2', author: 'Adaobi Nwachukwu', authorRole: 'STAFF', content: 'Hi Dr. Bello, I\'ve checked your organization configuration. It appears your domain verification is pending. Could you please confirm the DNS TXT record was added?', createdAt: ago(5, 1) },
    { id: 'msg-tkt-001-3', author: 'Dr. Amina Bello', authorRole: 'ORGANIZATION', content: 'Yes, I added it yesterday. Can you re-check from your end?', createdAt: ago(4, 20) },
    { id: 'msg-tkt-001-4', author: 'Adaobi Nwachukwu', authorRole: 'STAFF', content: 'Confirmed! The record is verified now. You should be able to publish the election. Let me know if you face any further issues.', createdAt: ago(4, 18) },
  ],
  'tkt-002': [
    { id: 'msg-tkt-002-1', author: 'Mr. Chidi Okonkwo', authorRole: 'ORGANIZATION', content: 'We need to add 2,400 voters before tomorrow\'s deadline but the bulk upload keeps timing out after 800 records.', createdAt: ago(3, 10) },
    { id: 'msg-tkt-002-2', author: 'Femi Adeyemi', authorRole: 'STAFF', content: 'I\'ve increased your upload batch limit to 5000 records. Please try splitting into two files of 1200 each and upload sequentially.', createdAt: ago(3, 9) },
    { id: 'msg-tkt-002-3', author: 'Mr. Chidi Okonkwo', authorRole: 'ORGANIZATION', content: 'That worked. Thank you for the quick response!', createdAt: ago(3, 6) },
  ],
  'tkt-005': [
    { id: 'msg-tkt-005-1', author: 'Mrs. Funke Adeyemi', authorRole: 'ORGANIZATION', content: 'Our subscription renewed but we were charged twice. Can you please investigate?', createdAt: ago(2, 4) },
    { id: 'msg-tkt-005-2', author: 'Yetunde Ojo', authorRole: 'STAFF', content: 'I can see the duplicate charge. I\'ve initiated a refund for the extra payment — it should reflect within 3-5 business days. Apologies for the inconvenience.', createdAt: ago(2, 3) },
  ],
  'tkt-008': [
    { id: 'msg-tkt-008-1', author: 'Engr. Samuel Peters', authorRole: 'ORGANIZATION', content: 'Live chat keeps disconnecting after 2 minutes. This is affecting our support team during the election.', createdAt: ago(1, 6) },
    { id: 'msg-tkt-008-2', author: 'Musa Bello', authorRole: 'STAFF', content: 'We identified a WebSocket timeout issue. A patch has been deployed. Can you test again and confirm?', createdAt: ago(1, 4) },
    { id: 'msg-tkt-008-3', author: 'Engr. Samuel Peters', authorRole: 'ORGANIZATION', content: 'Working perfectly now. Thank you!', createdAt: ago(1, 2) },
  ],
}

export const MOCK_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-001', subject: 'Unable to publish election — verification failed',
    description: 'Domain verification error preventing election publication for the Board of Directors 2026.',
    status: 'RESOLVED', priority: 'HIGH', category: 'TECHNICAL',
    organizationName: 'Rivers State University Faculty of Engineering', organizationId: 'org-rsu',
    assignedTo: 'staff-006', assignedToName: 'Adaobi Nwachukwu',
    createdBy: 'Dr. Amina Bello', createdAt: ago(5, 2), updatedAt: ago(4, 18),
    messages: ticketMessages['tkt-001'],
  },
  {
    id: 'tkt-002', subject: 'Bulk voter upload timing out',
    description: 'Upload of 2,400 voter records fails after ~800 records due to server timeout.',
    status: 'RESOLVED', priority: 'URGENT', category: 'TECHNICAL',
    organizationName: 'Rivers State University Faculty of Engineering', organizationId: 'org-rsu',
    assignedTo: 'staff-005', assignedToName: 'Femi Adeyemi',
    createdBy: 'Mr. Chidi Okonkwo', createdAt: ago(3, 10), updatedAt: ago(3, 6),
    messages: ticketMessages['tkt-002'],
  },
  {
    id: 'tkt-003', subject: 'Request: Multi-session voting for council elections',
    description: 'We need to run a 3-day election with sessions per department. Is this possible on the Professional plan?',
    status: 'OPEN', priority: 'MEDIUM', category: 'FEATURE_REQUEST',
    organizationName: 'Lagos State University', organizationId: 'org-lasu',
    assignedTo: null, assignedToName: null,
    createdBy: 'Prof. Adeola Balogun', createdAt: ago(2, 12), updatedAt: ago(2, 12),
    messages: [],
  },
  {
    id: 'tkt-004', subject: 'Invoice #INV-2026-0842 discrepancy',
    description: 'We were billed for 5,000 voters but our plan only allows 3,000. The additional 2,000 was not authorized.',
    status: 'OPEN', priority: 'HIGH', category: 'BILLING',
    organizationName: 'AfriTech Solutions', organizationId: 'org-afritech',
    assignedTo: null, assignedToName: null,
    createdBy: 'Mr. Kunle Adebayo', createdAt: ago(1, 8), updatedAt: ago(1, 8),
    messages: [],
  },
  {
    id: 'tkt-005', subject: 'Duplicate subscription charge',
    description: 'Subscription renewed on July 26 but charged twice — two separate debits of ₦450,000.',
    status: 'RESOLVED', priority: 'URGENT', category: 'BILLING',
    organizationName: 'Greenpeace Africa', organizationId: 'org-greenpeace',
    assignedTo: 'staff-008', assignedToName: 'Yetunde Ojo',
    createdBy: 'Mrs. Funke Adeyemi', createdAt: ago(2, 4), updatedAt: ago(2, 3),
    messages: ticketMessages['tkt-005'],
  },
  {
    id: 'tkt-006', subject: 'Cannot log in — account locked after 3 attempts',
    description: 'Admin account locked after legitimate login attempts. Please unlock and advise on 2FA setup.',
    status: 'ASSIGNED', priority: 'HIGH', category: 'ACCOUNT',
    organizationName: 'Edo State Government', organizationId: 'org-edo',
    assignedTo: 'staff-008', assignedToName: 'Musa Bello',
    createdBy: 'Dr. Osagie Igbinedion', createdAt: ago(0, 6), updatedAt: ago(0, 2),
    messages: [],
  },
  {
    id: 'tkt-007', subject: 'White-label domain configuration help',
    description: 'We purchased the Enterprise plan specifically for white-label support. Need help configuring custom domain.',
    status: 'WAITING', priority: 'LOW', category: 'OTHER',
    organizationName: 'Access Bank PLC', organizationId: 'org-access',
    assignedTo: 'staff-004', assignedToName: 'Chioma Eze',
    createdBy: 'Mr. Bala Musa', createdAt: ago(7), updatedAt: ago(5),
    messages: [],
  },
  {
    id: 'tkt-008', subject: 'Live chat disconnecting intermittently',
    description: 'WebSocket connection drops every 2 minutes during active chats. Affecting voter support during live elections.',
    status: 'RESOLVED', priority: 'URGENT', category: 'BUG_REPORT',
    organizationName: 'Multilancer Ltd.', organizationId: 'org-multilancer',
    assignedTo: 'staff-009', assignedToName: 'Musa Bello',
    createdBy: 'Engr. Samuel Peters', createdAt: ago(1, 6), updatedAt: ago(1, 2),
    messages: ticketMessages['tkt-008'],
  },
]

// ---------------------------------------------------------------------------
// MOCK_INTERNAL_NOTES — 5 notes
// ---------------------------------------------------------------------------
export const MOCK_INTERNAL_NOTES: InternalNote[] = [
  {
    id: 'note-001', organizationId: 'org-rsu',
    author: 'Tunde Bakare',
    content: 'RSU is running their largest election yet (4,180 voters). Keep an eye on server load during the first hour after opening.',
    createdAt: ago(7), updatedAt: ago(7),
  },
  {
    id: 'note-002', organizationId: 'org-afritech',
    author: 'Chioma Eze',
    content: 'AfriTech\'s CEO requested a direct line to support — escalated to Tunde for the partnership call.',
    createdAt: ago(5, 4), updatedAt: ago(4),
  },
  {
    id: 'note-003', organizationId: 'org-lasu',
    author: 'Femi Adeyemi',
    content: 'LASU evaluating upgrade to Professional tier. Pending approval from their budget committee — follow up in 2 weeks.',
    createdAt: ago(3), updatedAt: ago(3),
  },
  {
    id: 'note-004', organizationId: 'org-edo',
    author: 'Ngozi Eze',
    content: 'Edo State Government requested compliance audit of their Q1 elections. All records appear clean — report attached.',
    createdAt: ago(2, 8), updatedAt: ago(1, 12),
  },
  {
    id: 'note-005', organizationId: 'org-meranos',
    author: 'Yetunde Ojo',
    content: 'Meranos Ltd. account flagged for unusual billing pattern — two upgrades in one week. Investigating with finance team.',
    createdAt: ago(1, 2), updatedAt: ago(0, 10),
  },
]

// ---------------------------------------------------------------------------
// MOCK_PLATFORM_NOTIFICATIONS — 12 notifications
// ---------------------------------------------------------------------------
export const MOCK_PLATFORM_NOTIFICATIONS: PlatformNotification[] = [
  {
    id: 'pn-001', type: 'ORG_REGISTRATION', title: 'New Organization Registered',
    description: 'Lagos State University has completed registration. Workspace provisioning in progress.',
    read: false, actionable: true, actionLabel: 'Review', actionPath: '/platform/organizations/org-lasu',
    createdAt: ago(0, 1),
  },
  {
    id: 'pn-002', type: 'EVENT_PUBLISH_REQUEST', title: 'Event Publish Request',
    description: 'Board of Directors Election 2026 submitted for publication by Rivers State University.',
    read: false, actionable: true, actionLabel: 'Review', actionPath: '/platform/events/el-rsu-1',
    createdAt: ago(0, 3),
  },
  {
    id: 'pn-003', type: 'SECURITY_ALERT', title: 'Suspicious Login Attempt',
    description: 'Multiple failed login attempts detected from IP 196.45.32.18 targeting org-access account.',
    read: false, actionable: true, actionLabel: 'Investigate', actionPath: '/platform/security',
    createdAt: ago(0, 6),
  },
  {
    id: 'pn-004', type: 'SUBSCRIPTION_ALERT', title: 'Plan Upgrade Requested',
    description: 'AfriTech Solutions requested upgrade from Professional to Enterprise tier.',
    read: false, actionable: true, actionLabel: 'Review', actionPath: '/platform/organizations/org-afritech',
    createdAt: ago(0, 8),
  },
  {
    id: 'pn-005', type: 'SUBSCRIPTION_ALERT', title: 'Subscription Expiring',
    description: 'Greenpeace Africa subscription expires in 3 days. Auto-renewal is enabled.',
    read: true, actionable: false,
    createdAt: ago(1),
  },
  {
    id: 'pn-006', type: 'PLATFORM_ANNOUNCEMENT', title: 'Platform v2.4.0 Release',
    description: 'New features: enhanced audit trail, bulk voter management, and improved live chat.',
    read: true, actionable: false,
    createdAt: ago(2),
  },
  {
    id: 'pn-007', type: 'EVENT_PUBLISH_REQUEST', title: 'Event Publish Request',
    description: 'Edo State Government\'s Q3 Budget Vote is pending review.',
    read: false, actionable: true, actionLabel: 'Review', actionPath: '/platform/events/el-edo-1',
    createdAt: ago(0, 4),
  },
  {
    id: 'pn-008', type: 'SECURITY_ALERT', title: 'SSL Certificate Renewed',
    description: 'Platform SSL certificate successfully renewed. Next renewal: October 26, 2026.',
    read: true, actionable: false,
    createdAt: ago(3),
  },
  {
    id: 'pn-009', type: 'SUBSCRIPTION_ALERT', title: 'Payment Method Expiring',
    description: 'Access Bank PLC\'s saved payment method expires this month. Notification sent to admin.',
    read: true, actionable: false,
    createdAt: ago(4),
  },
  {
    id: 'pn-010', type: 'ORG_REGISTRATION', title: 'Organization Verified',
    description: 'Kenya Revenue Authority has been verified and is now active on the platform.',
    read: true, actionable: false,
    createdAt: ago(5),
  },
  {
    id: 'pn-011', type: 'PLATFORM_ANNOUNCEMENT', title: 'Scheduled Maintenance',
    description: 'Platform will be under maintenance on July 30, 2026 from 02:00–04:00 UTC.',
    read: false, actionable: false,
    createdAt: ago(0, 12),
  },
  {
    id: 'pn-012', type: 'EVENT_PUBLISH_REQUEST', title: 'Election Resubmitted',
    description: 'Meranos Ltd. has resubmitted their corporate by-laws election after corrections.',
    read: false, actionable: true, actionLabel: 'Review', actionPath: '/platform/events/el-mer-1',
    createdAt: ago(0, 2),
  },
]

// ---------------------------------------------------------------------------
// MOCK_SUBSCRIPTION_RECORDS — 10 records
// ---------------------------------------------------------------------------
export const MOCK_SUBSCRIPTION_RECORDS: SubscriptionRecord[] = [
  {
    id: 'sub-001', organizationId: 'org-rsu', organizationName: 'Rivers State University Faculty of Engineering',
    plan: 'PROFESSIONAL', status: 'ACTIVE', maxVoters: 5000, price: '₦350,000/yr',
    startedAt: '2026-01-01T00:00:00Z', expiresAt: '2027-01-01T00:00:00Z',
    renewedAt: '2026-01-01T00:00:00Z', paymentMethod: 'Bank Transfer',
  },
  {
    id: 'sub-002', organizationId: 'org-meranos', organizationName: 'Meranos Ltd.',
    plan: 'STARTER', status: 'TRIALING', maxVoters: 500, price: '₦0 (Trial)',
    startedAt: '2026-07-15T00:00:00Z', expiresAt: '2026-08-15T00:00:00Z',
    paymentMethod: '—',
  },
  {
    id: 'sub-003', organizationId: 'org-globaltech', organizationName: 'Global Tech Innovators Inc.',
    plan: 'ENTERPRISE', status: 'ACTIVE', maxVoters: 50000, price: '$12,000/yr',
    startedAt: '2025-11-01T00:00:00Z', expiresAt: '2026-11-01T00:00:00Z',
    renewedAt: '2025-11-01T00:00:00Z', paymentMethod: 'Credit Card',
  },
  {
    id: 'sub-004', organizationId: 'org-multilancer', organizationName: 'Multilancer Ltd.',
    plan: 'PROFESSIONAL', status: 'ACTIVE', maxVoters: 3000, price: '₦350,000/yr',
    startedAt: '2026-03-15T00:00:00Z', expiresAt: '2027-03-15T00:00:00Z',
    paymentMethod: 'Bank Transfer',
  },
  {
    id: 'sub-005', organizationId: 'org-lasu', organizationName: 'Lagos State University',
    plan: 'STARTER', status: 'EXPIRING', maxVoters: 500, price: '₦150,000/yr',
    startedAt: '2025-08-01T00:00:00Z', expiresAt: '2026-08-01T00:00:00Z',
    renewedAt: '2025-08-01T00:00:00Z', paymentMethod: 'Bank Transfer',
  },
  {
    id: 'sub-006', organizationId: 'org-afritech', organizationName: 'AfriTech Solutions',
    plan: 'PROFESSIONAL', status: 'RENEWED', maxVoters: 3000, price: '₦350,000/yr',
    startedAt: '2025-07-01T00:00:00Z', expiresAt: '2026-07-01T00:00:00Z',
    renewedAt: '2026-07-01T00:00:00Z', paymentMethod: 'Debit Card',
  },
  {
    id: 'sub-007', organizationId: 'org-greenpeace', organizationName: 'Greenpeace Africa',
    plan: 'PROFESSIONAL', status: 'ACTIVE', maxVoters: 2000, price: '₦350,000/yr',
    startedAt: '2025-07-25T00:00:00Z', expiresAt: '2026-07-25T00:00:00Z',
    renewedAt: '2026-07-25T00:00:00Z', paymentMethod: 'Credit Card',
  },
  {
    id: 'sub-008', organizationId: 'org-edo', organizationName: 'Edo State Government',
    plan: 'ENTERPRISE', status: 'ACTIVE', maxVoters: 25000, price: '₦1,200,000/yr',
    startedAt: '2026-02-01T00:00:00Z', expiresAt: '2027-02-01T00:00:00Z',
    paymentMethod: 'Bank Transfer',
  },
  {
    id: 'sub-009', organizationId: 'org-access', organizationName: 'Access Bank PLC',
    plan: 'ENTERPRISE', status: 'ACTIVE', maxVoters: 100000, price: '₦2,400,000/yr',
    startedAt: '2025-06-01T00:00:00Z', expiresAt: '2026-06-01T00:00:00Z',
    renewedAt: '2026-06-01T00:00:00Z', paymentMethod: 'Bank Transfer',
  },
  {
    id: 'sub-010', organizationId: 'org-kra', organizationName: 'Kenya Revenue Authority',
    plan: 'CUSTOM', status: 'CANCELLED', maxVoters: 50000, price: 'KES 2,500,000/yr',
    startedAt: '2025-01-01T00:00:00Z', expiresAt: '2026-01-01T00:00:00Z',
    renewedAt: '2026-01-01T00:00:00Z', cancelledAt: '2026-03-01T00:00:00Z',
    paymentMethod: 'Bank Transfer',
  },
]

// ---------------------------------------------------------------------------
// MOCK_ORGANIZATIONS_HEALTH — 12 orgs
// ---------------------------------------------------------------------------
export const MOCK_ORGANIZATIONS_HEALTH: OrganizationHealth[] = [
  {
    organizationId: 'org-rsu', organizationName: 'Rivers State University Faculty of Engineering',
    slug: 'rsu-engineering', logoUrl: null, status: 'ACTIVE', subscription: 'Active', plan: 'PROFESSIONAL',
    activeEvents: 4, members: 4180, admins: 6, storageUsed: 8.2, storageTotal: 20,
    lastActivity: ago(0, 0, 30), country: 'Nigeria', dateJoined: '2024-01-15T00:00:00Z',
    workspaceStatus: 'healthy',
  },
  {
    organizationId: 'org-meranos', organizationName: 'Meranos Ltd.',
    slug: 'meranos', logoUrl: null, status: 'ACTIVE', subscription: 'Trialing', plan: 'STARTER',
    activeEvents: 2, members: 120, admins: 3, storageUsed: 0.8, storageTotal: 5,
    lastActivity: ago(0, 2), country: 'Nigeria', dateJoined: '2026-07-15T00:00:00Z',
    workspaceStatus: 'healthy',
  },
  {
    organizationId: 'org-globaltech', organizationName: 'Global Tech Innovators Inc.',
    slug: 'globaltech', logoUrl: null, status: 'ACTIVE', subscription: 'Active', plan: 'ENTERPRISE',
    activeEvents: 3, members: 8900, admins: 12, storageUsed: 45.6, storageTotal: 100,
    lastActivity: ago(0, 0, 15), country: 'United States', dateJoined: '2024-06-01T00:00:00Z',
    workspaceStatus: 'healthy',
  },
  {
    organizationId: 'org-multilancer', organizationName: 'Multilancer Ltd.',
    slug: 'multilancer', logoUrl: null, status: 'ACTIVE', subscription: 'Active', plan: 'PROFESSIONAL',
    activeEvents: 1, members: 2450, admins: 5, storageUsed: 4.1, storageTotal: 20,
    lastActivity: ago(0, 5), country: 'Nigeria', dateJoined: '2024-09-10T00:00:00Z',
    workspaceStatus: 'healthy',
  },
  {
    organizationId: 'org-lasu', organizationName: 'Lagos State University',
    slug: 'lagos-state-university', logoUrl: null, status: 'PENDING', subscription: 'Expiring', plan: 'STARTER',
    activeEvents: 0, members: 0, admins: 2, storageUsed: 0.2, storageTotal: 5,
    lastActivity: ago(14), country: 'Nigeria', dateJoined: ago(20),
    workspaceStatus: 'attention',
  },
  {
    organizationId: 'org-afritech', organizationName: 'AfriTech Solutions',
    slug: 'afritech-solutions', logoUrl: null, status: 'ACTIVE', subscription: 'Renewed', plan: 'PROFESSIONAL',
    activeEvents: 2, members: 3400, admins: 4, storageUsed: 6.7, storageTotal: 20,
    lastActivity: ago(0, 4), country: 'Kenya', dateJoined: '2025-07-01T00:00:00Z',
    workspaceStatus: 'healthy',
  },
  {
    organizationId: 'org-greenpeace', organizationName: 'Greenpeace Africa',
    slug: 'greenpeace-africa', logoUrl: null, status: 'ACTIVE', subscription: 'Active', plan: 'PROFESSIONAL',
    activeEvents: 1, members: 2100, admins: 5, storageUsed: 3.9, storageTotal: 20,
    lastActivity: ago(0, 8), country: 'South Africa', dateJoined: '2025-07-25T00:00:00Z',
    workspaceStatus: 'healthy',
  },
  {
    organizationId: 'org-edo', organizationName: 'Edo State Government',
    slug: 'edo-state-government', logoUrl: null, status: 'ACTIVE', subscription: 'Active', plan: 'ENTERPRISE',
    activeEvents: 5, members: 15800, admins: 15, storageUsed: 28.4, storageTotal: 100,
    lastActivity: ago(0, 1), country: 'Nigeria', dateJoined: '2026-02-01T00:00:00Z',
    workspaceStatus: 'healthy',
  },
  {
    organizationId: 'org-access', organizationName: 'Access Bank PLC',
    slug: 'access-bank', logoUrl: null, status: 'ACTIVE', subscription: 'Active', plan: 'ENTERPRISE',
    activeEvents: 3, members: 25000, admins: 20, storageUsed: 62.1, storageTotal: 200,
    lastActivity: ago(0, 0, 10), country: 'Nigeria', dateJoined: '2024-06-01T00:00:00Z',
    workspaceStatus: 'healthy',
  },
  {
    organizationId: 'org-kra', organizationName: 'Kenya Revenue Authority',
    slug: 'kenya-revenue', logoUrl: null, status: 'SUSPENDED', subscription: 'Cancelled', plan: 'CUSTOM',
    activeEvents: 0, members: 12000, admins: 8, storageUsed: 18.5, storageTotal: 50,
    lastActivity: ago(60), country: 'Kenya', dateJoined: '2024-01-01T00:00:00Z',
    workspaceStatus: 'critical',
  },
  {
    organizationId: 'org-ghana-ec', organizationName: 'Ghana Electoral Commission',
    slug: 'ghana-electoral', logoUrl: null, status: 'ACTIVE', subscription: 'Active', plan: 'ENTERPRISE',
    activeEvents: 2, members: 45000, admins: 25, storageUsed: 35.2, storageTotal: 200,
    lastActivity: ago(0, 3), country: 'Ghana', dateJoined: '2025-03-01T00:00:00Z',
    workspaceStatus: 'healthy',
  },
  {
    organizationId: 'org-ui', organizationName: 'University of Ibadan',
    slug: 'university-of-ibadan', logoUrl: null, status: 'ACTIVE', subscription: 'Active', plan: 'PROFESSIONAL',
    activeEvents: 3, members: 7200, admins: 8, storageUsed: 12.8, storageTotal: 20,
    lastActivity: ago(1, 6), country: 'Nigeria', dateJoined: '2024-10-01T00:00:00Z',
    workspaceStatus: 'attention',
  },
]

// ---------------------------------------------------------------------------
// MOCK_ACTIVITIES — 15 platform activity log entries
// ---------------------------------------------------------------------------
export const MOCK_ACTIVITIES: PlatformActivity[] = [
  {
    id: 'act-001', actor: 'King P.', action: 'Updated platform configuration', target: 'Platform Settings', targetType: 'SETTINGS',
    timestamp: ago(0, 0, 5), severity: 'info',
  },
  {
    id: 'act-002', actor: 'Chioma Eze', action: 'Provisioned organization workspace', target: 'Lagos State University', targetType: 'ORGANIZATION',
    organizationId: 'org-lasu', organizationName: 'Lagos State University',
    timestamp: ago(0, 1), severity: 'info',
  },
  {
    id: 'act-003', actor: 'Ngozi Eze', action: 'Rejected event publication', target: 'Student Union Election 2026', targetType: 'EVENT',
    organizationId: 'org-rsu', organizationName: 'Rivers State University Faculty of Engineering',
    timestamp: ago(0, 3), severity: 'warning',
  },
  {
    id: 'act-004', actor: 'Musa Bello', action: 'Resolved security incident', target: 'Brute force attempt — IP 196.45.32.18', targetType: 'SECURITY',
    timestamp: ago(0, 6), severity: 'critical',
  },
  {
    id: 'act-005', actor: 'Tunde Bakare', action: 'Assigned ticket to support team', target: 'Duplicate subscription charge', targetType: 'TICKET',
    organizationId: 'org-greenpeace', organizationName: 'Greenpeace Africa',
    timestamp: ago(0, 8), severity: 'info',
  },
  {
    id: 'act-006', actor: 'Yetunde Ojo', action: 'Processed refund', target: '₦450,000 — Greenpeace Africa', targetType: 'REFUND',
    organizationId: 'org-greenpeace', organizationName: 'Greenpeace Africa',
    timestamp: ago(1), severity: 'info',
  },
  {
    id: 'act-007', actor: 'Adaobi Nwachukwu', action: 'Resolved support ticket', target: 'Bulk voter upload timeout', targetType: 'TICKET',
    organizationId: 'org-rsu', organizationName: 'Rivers State University Faculty of Engineering',
    timestamp: ago(1, 3), severity: 'info',
  },
  {
    id: 'act-008', actor: 'Femi Adeyemi', action: 'Escalated ticket to senior support', target: 'Multi-session voting request', targetType: 'TICKET',
    organizationId: 'org-lasu', organizationName: 'Lagos State University',
    timestamp: ago(1, 8), severity: 'info',
  },
  {
    id: 'act-009', actor: 'Aisha Mohammed', action: 'Modified staff permissions', target: 'Lola Adeniyi — revoked ticket access', targetType: 'STAFF',
    timestamp: ago(2), severity: 'warning',
  },
  {
    id: 'act-010', actor: 'Ngozi Eze', action: 'Performed compliance audit', target: 'Edo State Government Q1 elections', targetType: 'AUDIT',
    organizationId: 'org-edo', organizationName: 'Edo State Government',
    timestamp: ago(2, 6), severity: 'info',
  },
  {
    id: 'act-011', actor: 'King P.', action: 'Deployed platform update', target: 'v2.4.0 — production', targetType: 'DEPLOYMENT',
    timestamp: ago(3), severity: 'info',
  },
  {
    id: 'act-012', actor: 'Musa Bello', action: 'Updated security policy', target: '2FA enforcement — all admin accounts', targetType: 'SECURITY',
    timestamp: ago(4), severity: 'info',
  },
  {
    id: 'act-013', actor: 'Tunde Bakare', action: 'Suspended organization', target: 'Kenya Revenue Authority', targetType: 'ORGANIZATION',
    organizationId: 'org-kra', organizationName: 'Kenya Revenue Authority',
    timestamp: ago(5), severity: 'critical',
  },
  {
    id: 'act-014', actor: 'Chioma Eze', action: 'Added internal note', target: 'AfriTech Solutions — partnership call notes', targetType: 'NOTE',
    organizationId: 'org-afritech', organizationName: 'AfriTech Solutions',
    timestamp: ago(5, 4), severity: 'info',
  },
  {
    id: 'act-015', actor: 'Yetunde Ojo', action: 'Generated invoice', target: 'INV-2026-0912 — Access Bank PLC', targetType: 'INVOICE',
    organizationId: 'org-access', organizationName: 'Access Bank PLC',
    timestamp: ago(6), severity: 'info',
  },
]

// ---------------------------------------------------------------------------
// MOCK_AUDIT_LOGS — 31 entries
// ---------------------------------------------------------------------------
export const MOCK_AUDIT_LOGS: PlatformAuditLog[] = [
  { id: 'a-1', action: "Organization 'EduVote Systems' registered", user: 'System', category: 'Organization', severity: 'Info', timestamp: '30m ago' },
  { id: 'a-2', action: "Election 'Board of Directors' published", user: 'Tunde Bakare', category: 'Election', severity: 'Info', timestamp: '2h ago' },
  { id: 'a-3', action: 'Bulk voter import: 2,400 records uploaded', user: 'Jessica J.', category: 'Voter', severity: 'Info', timestamp: '5h ago' },
  { id: 'a-4', action: "Organization 'Multilancer Ltd.' suspended", user: 'System', category: 'Organization', severity: 'Critical', timestamp: '1d ago' },
  { id: 'a-5', action: "User account 'adaobi@globaltech.io' locked", user: 'System', category: 'User', severity: 'Warning', timestamp: '2d ago' },
  { id: 'a-6', action: 'Platform backup completed', user: 'System', category: 'System', severity: 'Info', timestamp: '2d ago' },
  { id: 'a-7', action: "Election 'Q2 Financial Audit Approval' closed", user: 'Jessica J.', category: 'Election', severity: 'Warning', timestamp: '3d ago' },
  // Failed Logins — auth
  { id: 'a-8', action: "Failed login attempt from IP 197.210.45.33 — admin@meranos.com", user: 'System', category: 'auth', severity: 'Warning', timestamp: '1h ago' },
  { id: 'a-9', action: "Account lockout triggered for 'j.jessica@rsu.edu.ng' after 5 failed attempts", user: 'System', category: 'auth', severity: 'Warning', timestamp: '4h ago' },
  // Permission Changes — permissions
  { id: 'a-10', action: "Permission 'manage_billing' revoked from Yetunde Ojo", user: 'Aisha Mohammed', category: 'permissions', severity: 'Info', timestamp: '6h ago' },
  { id: 'a-11', action: "Permission 'publish' granted to Ngozi Eze", user: 'Tunde Bakare', category: 'permissions', severity: 'Info', timestamp: '12h ago' },
  // Role Changes — permissions
  { id: 'a-12', action: "Role 'Content Moderator' archived by Tunde Bakare", user: 'Tunde Bakare', category: 'permissions', severity: 'Warning', timestamp: '1d ago' },
  { id: 'a-13', action: "Role 'Senior Support Agent' assigned to Adaobi Nwachukwu", user: 'Chioma Eze', category: 'permissions', severity: 'Warning', timestamp: '2d ago' },
  // Suspensions — org
  { id: 'a-14', action: "Organization 'Kenya Revenue Authority' suspended by Tunde Bakare", user: 'Tunde Bakare', category: 'org', severity: 'Critical', timestamp: '3d ago' },
  { id: 'a-15', action: "Staff account 'Lola Adeniyi' suspended by Aisha Mohammed", user: 'Aisha Mohammed', category: 'org', severity: 'Critical', timestamp: '4d ago' },
  // Restorations — org
  { id: 'a-16', action: "Organization 'Kenya Revenue Authority' restored by King P.", user: 'King P.', category: 'org', severity: 'Info', timestamp: '1d ago' },
  { id: 'a-17', action: "Staff account 'Lola Adeniyi' reactivated by Aisha Mohammed", user: 'Aisha Mohammed', category: 'org', severity: 'Info', timestamp: '2d ago' },
  // Sensitive Actions — system
  { id: 'a-18', action: 'Audit log export triggered by external admin — 1,240 records downloaded', user: 'Musa Bello', category: 'system', severity: 'Critical', timestamp: '5h ago' },
  { id: 'a-19', action: 'Platform-wide voter data anonymization initiated by King P.', user: 'King P.', category: 'system', severity: 'Critical', timestamp: '1d ago' },
  // Organization Approvals — org
  { id: 'a-20', action: "Organization 'Lagos State University' provisioned successfully", user: 'Chioma Eze', category: 'org', severity: 'Info', timestamp: '3h ago' },
  { id: 'a-21', action: "Organization 'AfriTech Solutions' verified by Aisha Mohammed", user: 'Aisha Mohammed', category: 'org', severity: 'Info', timestamp: '1d ago' },
  // Event Approvals — election
  { id: 'a-22', action: "Election 'Board of Directors 2026' published", user: 'Ngozi Eze', category: 'election', severity: 'Info', timestamp: '8h ago' },
  { id: 'a-23', action: "Election 'Q3 Budget Vote' published", user: 'Ngozi Eze', category: 'election', severity: 'Info', timestamp: '2d ago' },
  // Billing Changes — billing
  { id: 'a-24', action: "Billing rate updated for plan 'Professional' — ₦350,000 → ₦400,000", user: 'Yetunde Ojo', category: 'billing', severity: 'Warning', timestamp: '6h ago' },
  { id: 'a-25', action: "Invoice #INV-2026-0842 marked as disputed by Yetunde Ojo", user: 'Yetunde Ojo', category: 'billing', severity: 'Warning', timestamp: '1d ago' },
  // Subscription Changes — billing
  { id: 'a-26', action: "Subscription 'Meranos Ltd.' upgraded from Starter to Professional", user: 'System', category: 'billing', severity: 'Info', timestamp: '3d ago' },
  { id: 'a-27', action: "Subscription 'AfriTech Solutions' renewed for 2026-2027 cycle", user: 'System', category: 'billing', severity: 'Info', timestamp: '5d ago' },
  // Platform Configuration Changes — system
  { id: 'a-28', action: 'Maintenance mode enabled — scheduled July 30, 2026 02:00-04:00 UTC', user: 'King P.', category: 'system', severity: 'Critical', timestamp: '2h ago' },
  { id: 'a-29', action: 'Session timeout policy updated from 30min to 15min by King P.', user: 'King P.', category: 'system', severity: 'Critical', timestamp: '4d ago' },
]

// ---------------------------------------------------------------------------
// MOCK_PLATFORM_ELECTIONS — 7 elections
// ---------------------------------------------------------------------------
export const MOCK_PLATFORM_ELECTIONS: PlatformElection[] = [
  { id: 'el-1', name: 'Board of Directors Election 2026', org: 'RSU Engineering', status: 'Live', voters: 2840, turnout: 62, created: 'Jul 1, 2026' },
  { id: 'el-2', name: 'Corporate By-Laws Ratification', org: 'Meranos Ltd.', status: 'Live', voters: 1200, turnout: 45, created: 'Jul 5, 2026' },
  { id: 'el-3', name: 'Open-Source Standard Adoption', org: 'Global Tech Innovators', status: 'Live', voters: 8900, turnout: 55, created: 'Jul 8, 2026' },
  { id: 'el-4', name: 'Student Union Constitutional Review', org: 'RSU Engineering', status: 'Upcoming', voters: 3200, turnout: 0, created: 'Jul 10, 2026' },
  { id: 'el-5', name: 'Q2 Financial Audit Approval', org: 'Meranos Ltd.', status: 'Concluded', voters: 980, turnout: 82, created: 'Jun 15, 2026' },
  { id: 'el-6', name: 'Faculty Budget Ratification', org: 'RSU Engineering', status: 'Pending Review', voters: 3500, turnout: 0, created: 'Jul 14, 2026' },
  { id: 'el-7', name: 'Board Composition Amendment', org: 'EduVote Systems', status: 'Pending Review', voters: 180, turnout: 0, created: 'Jul 15, 2026' },
]

// ---------------------------------------------------------------------------
// MOCK_PLATFORM_INVOICES — 5 invoices
// ---------------------------------------------------------------------------
export const MOCK_PLATFORM_INVOICES: PlatformInvoice[] = [
  { id: 'inv-1', org: 'RSU Faculty of Engineering', plan: 'Enterprise', amount: '$199.00', status: 'Paid', date: 'Jul 15, 2026' },
  { id: 'inv-2', org: 'Meranos Ltd.', plan: 'Professional', amount: '$49.00', status: 'Paid', date: 'Jul 1, 2026' },
  { id: 'inv-3', org: 'Global Tech Innovators Inc.', plan: 'Enterprise', amount: '$199.00', status: 'Pending', date: 'Jul 20, 2026' },
  { id: 'inv-4', org: 'Multilancer Ltd.', plan: 'Starter', amount: '$0.00', status: 'Free', date: 'Jul 5, 2026' },
  { id: 'inv-5', org: 'EduVote Systems', plan: 'Starter', amount: '$0.00', status: 'Free', date: 'Jul 14, 2026' },
]

// ---------------------------------------------------------------------------
// MOCK_PLATFORM_MEMBERSHIPS — 5 memberships
// ---------------------------------------------------------------------------
export const MOCK_PLATFORM_MEMBERSHIPS: PlatformMembership[] = [
  { id: 'm-1', user: 'Tunde Bakare', email: 'admin@meranos.com', org: 'Meranos Ltd.', role: 'Owner', status: 'Active', joined: 'Jan 15, 2025' },
  { id: 'm-2', user: 'Jessica J.', email: 'j.jessica@rsu.edu.ng', org: 'RSU Engineering', role: 'Election Manager', status: 'Active', joined: 'Mar 1, 2026' },
  { id: 'm-3', user: 'Dr. Amina Bello', email: 'a.bello@rsu.edu.ng', org: 'RSU Engineering', role: 'Election Officer', status: 'Active', joined: 'Apr 10, 2026' },
  { id: 'm-4', user: 'Mr. Chidi Okonkwo', email: 'c.okonkwo@rsu.edu.ng', org: 'RSU Engineering', role: 'Observer', status: 'Pending', joined: 'Jul 5, 2026' },
  { id: 'm-5', user: 'Adaobi Okafor', email: 'voter@globaltech.io', org: 'Global Tech Innovators', role: 'Voter', status: 'Suspended', joined: 'Feb 20, 2026' },
]

// ---------------------------------------------------------------------------
// MOCK_PLATFORM_USERS — 5 users
// ---------------------------------------------------------------------------
export const MOCK_PLATFORM_USERS: PlatformUser[] = [
  { id: 'u-1', name: 'Tunde Bakare', email: 'admin@meranos.com', role: 'Platform Admin', status: 'Active', org: 'Meranos Ltd.', joined: 'Jan 15, 2025', lastLogin: '2h ago', emailVerified: true, mfaEnabled: true, lifecycleState: 'Active' },
  { id: 'u-2', name: 'Jessica J.', email: 'j.jessica@rsu.edu.ng', role: 'Election Manager', status: 'Active', org: 'RSU Engineering', joined: 'Mar 1, 2026', lastLogin: '1d ago', emailVerified: true, mfaEnabled: false, lifecycleState: 'Active' },
  { id: 'u-3', name: 'Dr. Amina Bello', email: 'a.bello@rsu.edu.ng', role: 'Election Officer', status: 'Active', org: 'RSU Engineering', joined: 'Apr 10, 2026', lastLogin: '3h ago', emailVerified: true, mfaEnabled: true, lifecycleState: 'Active' },
  { id: 'u-4', name: 'Mr. Chidi Okonkwo', email: 'c.okonkwo@rsu.edu.ng', role: 'Observer', status: 'Pending', org: 'RSU Engineering', joined: 'Jul 5, 2026', lastLogin: 'Never', emailVerified: false, mfaEnabled: false, lifecycleState: 'Pending' },
  { id: 'u-5', name: 'Adaobi Okafor', email: 'voter@globaltech.io', role: 'Voter', status: 'Suspended', org: 'Global Tech Innovators', joined: 'Feb 20, 2026', lastLogin: '30d ago', emailVerified: true, mfaEnabled: false, lifecycleState: 'Suspended' },
]