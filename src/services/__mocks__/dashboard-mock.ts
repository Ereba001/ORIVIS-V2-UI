export interface PlatformStat {
  id: string
  label: string
  value: number
  prefix?: string
  suffix?: string
  trend: number
  trendLabel: string
  icon: string
}

export interface RevenueMonth {
  month: string
  shortMonth: string
  revenue: number
  subscriptions: number
  newOrgs: number
  renewals: number
}

export interface Notification {
  id: string
  title: string
  preview: string
  time: string
  read: boolean
  type: "system" | "org" | "election" | "alert"
}

export interface ActivityEvent {
  id: string
  event: string
  time: string
  type: "create" | "publish" | "import" | "system" | "alert"
}

export interface QuickAction {
  id: string
  label: string
  description: string
  icon: string
  path: string
  color: string
}

export const PLATFORM_STATS: PlatformStat[] = [
  { id: "orgs", label: "Total Organizations", value: 128, trend: 12, trendLabel: "this month", icon: "Building2" },
  { id: "users", label: "Total Users", value: 24580, trend: 1240, trendLabel: "this month", icon: "Users" },
  { id: "events", label: "Active Events", value: 47, trend: 8, trendLabel: "this week", icon: "Vote" },
  { id: "revenue", label: "Monthly Revenue", value: 84500, prefix: "$", trend: 5.2, trendLabel: "vs last month", icon: "TrendingUp" },
  { id: "uptime", label: "Platform Uptime", value: 99.8, suffix: "%", trend: 0.1, trendLabel: "improvement", icon: "Shield" },
  { id: "pending", label: "Pending Reviews", value: 12, trend: -3, trendLabel: "than yesterday", icon: "Clock" },
]

export const REVENUE_DATA: RevenueMonth[] = [
  { month: "January", shortMonth: "Jan", revenue: 42000, subscriptions: 38, newOrgs: 2, renewals: 1 },
  { month: "February", shortMonth: "Feb", revenue: 45800, subscriptions: 41, newOrgs: 3, renewals: 2 },
  { month: "March", shortMonth: "Mar", revenue: 47200, subscriptions: 43, newOrgs: 2, renewals: 1 },
  { month: "April", shortMonth: "Apr", revenue: 48900, subscriptions: 44, newOrgs: 1, renewals: 3 },
  { month: "May", shortMonth: "May", revenue: 51200, subscriptions: 46, newOrgs: 4, renewals: 2 },
  { month: "June", shortMonth: "Jun", revenue: 53800, subscriptions: 47, newOrgs: 2, renewals: 3 },
  { month: "July", shortMonth: "Jul", revenue: 56100, subscriptions: 50, newOrgs: 3, renewals: 2 },
  { month: "August", shortMonth: "Aug", revenue: 59400, subscriptions: 53, newOrgs: 4, renewals: 3 },
  { month: "September", shortMonth: "Sep", revenue: 62800, subscriptions: 56, newOrgs: 3, renewals: 4 },
  { month: "October", shortMonth: "Oct", revenue: 67200, subscriptions: 60, newOrgs: 5, renewals: 3 },
  { month: "November", shortMonth: "Nov", revenue: 72900, subscriptions: 64, newOrgs: 4, renewals: 5 },
  { month: "December", shortMonth: "Dec", revenue: 84500, subscriptions: 72, newOrgs: 6, renewals: 5 },
]

export const NEW_ORGANIZATIONS = [
  { id: "n1", name: "EduVote Systems", action: "Provisioning workspace", time: "2h ago" },
  { id: "n2", name: "TechBridge Academy", action: "Workspace created", time: "6h ago" },
  { id: "n3", name: "Greenfield College", action: "Payment received", time: "1d ago" },
]

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "System Update v2.4.0", preview: "Platform update scheduled for maintenance window", time: "1h ago", read: false, type: "system" },
  { id: "n2", title: "New Organization Registered", preview: "EduVote Systems completed registration and awaits review", time: "2h ago", read: false, type: "org" },
  { id: "n3", title: "Election Published", preview: "Board of Directors 2026 is now live for voting", time: "4h ago", read: true, type: "election" },
  { id: "n4", title: "Backup Completed", preview: "Daily system backup completed successfully", time: "8h ago", read: true, type: "system" },
  { id: "n5", title: "Account Suspended", preview: "User account in org-987 suspended due to policy violation", time: "1d ago", read: true, type: "alert" },
]

export const ACTIVITY_EVENTS: ActivityEvent[] = [
  { id: "a1", event: "New organization registered: EduVote Systems", time: "30m ago", type: "create" },
  { id: "a2", event: "Election published: Board of Directors 2026", time: "2h ago", type: "publish" },
  { id: "a3", event: "Bulk voter import: 2,400 records uploaded", time: "5h ago", type: "import" },
  { id: "a4", event: "System backup completed successfully", time: "8h ago", type: "system" },
  { id: "a5", event: "User account suspended: org-987", time: "1d ago", type: "alert" },
  { id: "a6", event: "New organization registered: TechBridge Academy", time: "1d ago", type: "create" },
]

export const QUICK_ACTIONS: QuickAction[] = [
  { id: "q1", label: "View Organizations", description: "Monitor active organizations", icon: "Building2", path: "/platform/organizations", color: "text-brand-gold" },
  { id: "q2", label: "View Organizations", description: "Review and manage all orgs", icon: "Building2", path: "/platform/organizations", color: "text-blue-400" },
  { id: "q3", label: "View Reports", description: "Analytics and platform reports", icon: "BarChart3", path: "/platform/analytics", color: "text-brand-text-muted" },
  { id: "q4", label: "System Settings", description: "Configure platform preferences", icon: "SlidersHorizontal", path: "/platform/settings", color: "text-purple-400" },
]
