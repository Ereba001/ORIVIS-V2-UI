export const PLATFORM_PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'platform.view_dashboard',
  // Organizations
  VIEW_ORGANIZATIONS: 'platform.view_organizations',
  MANAGE_ORGANIZATIONS: 'platform.manage_organizations',
  // Users
  VIEW_USERS: 'platform.view_users',
  MANAGE_USERS: 'platform.manage_users',
  // Staff (granular)
  MANAGE_STAFF: 'platform.manage_staff',
  STAFF_VIEW: 'platform.staff.view',
  STAFF_CREATE: 'platform.staff.create',
  STAFF_UPDATE: 'platform.staff.update',
  STAFF_SUSPEND: 'platform.staff.suspend',
  STAFF_TERMINATE: 'platform.staff.terminate',
  STAFF_ASSIGN_ROLE: 'platform.staff.assign_role',
  STAFF_MANAGE_PERMISSIONS: 'platform.staff.manage_permissions',
  STAFF_PASSWORD_RESET: 'platform.staff.password_reset',
  STAFF_VIEW_AUDIT: 'platform.staff.view_audit',
  STAFF_WORKSPACE_ACCESS: 'platform.staff.workspace_access',
  // Roles & Permissions
  MANAGE_ROLES: 'platform.manage_roles',
  ROLES_VIEW: 'platform.roles.view',
  ROLES_CREATE: 'platform.roles.create',
  ROLES_UPDATE: 'platform.roles.update',
  ROLES_DELETE: 'platform.roles.delete',
  // Subscriptions
  VIEW_SUBSCRIPTIONS: 'platform.view_subscriptions',
  MANAGE_SUBSCRIPTIONS: 'platform.manage_subscriptions',
  // Audit
  VIEW_AUDIT: 'platform.view_audit',
  // Notifications
  MANAGE_NOTIFICATIONS: 'platform.manage_notifications',
  // Support
  MANAGE_SUPPORT: 'platform.manage_support',
  // Reports
  VIEW_REPORTS: 'platform.view_reports',
  // Workspace
  VIEW_WORKSPACE_SESSIONS: 'platform.view_workspace_sessions',
  MANAGE_WORKSPACE_SESSIONS: 'platform.manage_workspace_sessions',
  // Finance
  VIEW_FINANCE: 'platform.view_finance',
  MANAGE_FINANCE: 'platform.manage_finance',
  // Revenue (restricted: Founder + Finance only)
  VIEW_REVENUE: 'platform.view_revenue',
  MANAGE_REVENUE: 'platform.manage_revenue',
  VIEW_PAYMENTS: 'platform.view_payments',
  MANAGE_PAYMENTS: 'platform.manage_payments',
  VIEW_BILLING: 'platform.view_billing',
  MANAGE_BILLING: 'platform.manage_billing',
  VIEW_FINANCIAL_REPORTS: 'platform.view_financial_reports',
  EXPORT_FINANCIAL_REPORTS: 'platform.export_financial_reports',
  // Elections
  VIEW_ELECTIONS: 'platform.view_elections',
  MANAGE_ELECTIONS: 'platform.manage_elections',
  // Security
  VIEW_SECURITY: 'platform.view_security',
  MANAGE_SECURITY: 'platform.manage_security',
  // Settings
  VIEW_SETTINGS: 'platform.view_settings',
  MANAGE_SETTINGS: 'platform.manage_settings',
} as const

/** Permission sets for role-specific dashboard views. */
export const REVENUE_PERMISSIONS: string[] = [
  PLATFORM_PERMISSIONS.VIEW_REVENUE,
  PLATFORM_PERMISSIONS.MANAGE_REVENUE,
  PLATFORM_PERMISSIONS.VIEW_PAYMENTS,
  PLATFORM_PERMISSIONS.MANAGE_PAYMENTS,
  PLATFORM_PERMISSIONS.VIEW_BILLING,
  PLATFORM_PERMISSIONS.MANAGE_BILLING,
  PLATFORM_PERMISSIONS.VIEW_FINANCIAL_REPORTS,
  PLATFORM_PERMISSIONS.EXPORT_FINANCIAL_REPORTS,
  PLATFORM_PERMISSIONS.VIEW_SUBSCRIPTIONS,
  PLATFORM_PERMISSIONS.MANAGE_SUBSCRIPTIONS,
  PLATFORM_PERMISSIONS.MANAGE_FINANCE,
  PLATFORM_PERMISSIONS.VIEW_FINANCE,
] as const
