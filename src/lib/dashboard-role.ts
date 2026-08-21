import { Shield, CreditCard, Vote, Headset, Eye, Building2, type LucideIcon } from 'lucide-react'
import { PLATFORM_PERMISSIONS } from '../constants/platformPermissions'

export type RoleFocus = 'founder' | 'finance' | 'elections' | 'support' | 'security' | 'auditor' | 'general'

export function detectRoleFocus(perms: string[], slug: string | null | undefined): RoleFocus {
  const s = slug?.toLowerCase() ?? ''
  if (s === 'founder' || s === 'super_admin') return 'founder'
  const financeKeys = [PLATFORM_PERMISSIONS.VIEW_FINANCE, PLATFORM_PERMISSIONS.VIEW_REVENUE, PLATFORM_PERMISSIONS.VIEW_PAYMENTS, PLATFORM_PERMISSIONS.VIEW_BILLING] as string[]
  const electionKeys = [PLATFORM_PERMISSIONS.VIEW_ELECTIONS, PLATFORM_PERMISSIONS.MANAGE_ELECTIONS] as string[]
  const securityKeys = [PLATFORM_PERMISSIONS.VIEW_SECURITY, PLATFORM_PERMISSIONS.MANAGE_SECURITY] as string[]
  const fin = perms.some(p => financeKeys.includes(p))
  const elx = perms.some(p => electionKeys.includes(p))
  const sec = perms.some(p => securityKeys.includes(p))
  const sup = perms.includes(PLATFORM_PERMISSIONS.MANAGE_SUPPORT)
  if (s.includes('finance') && fin) return 'finance'
  if ((s.includes('election') || s.includes('operations')) && elx) return 'elections'
  if (s.includes('support') && sup) return 'support'
  if (s.includes('security') || s.includes('compliance')) return 'security'
  if (s.includes('auditor')) return 'auditor'
  if (fin && !elx && !sec) return 'finance'
  if (elx && !fin && !sec) return 'elections'
  if (sec && !fin && !elx) return 'security'
  if (sup && !fin) return 'support'
  return 'general'
}

export const ROLE_LABELS: Record<string, string> = {
  founder: 'Super Administrator', finance: 'Finance Officer', elections: 'Election Operations Officer',
  support: 'Support Officer', security: 'Security & Compliance Officer', auditor: 'Auditor', general: 'Platform Administrator',
}

export const ROLE_ICONS: Record<RoleFocus, LucideIcon> = {
  founder: Shield, finance: CreditCard, elections: Vote, support: Headset,
  security: Shield, auditor: Eye, general: Building2,
}

export interface QuickAction { id: string; label: string; description: string; href: string; icon: LucideIcon }

export const QUICK_ACTIONS_BY_ROLE: Record<RoleFocus, QuickAction[]> = {
  founder: [
    { id: 'qa-1', label: 'Organizations', description: 'Monitor active workspaces', href: '/platform/organizations', icon: Building2 },
    { id: 'qa-2', label: 'Analytics', description: 'Platform reports', href: '/platform/analytics', icon: Building2 },
    { id: 'qa-3', label: 'Staff', description: 'Team management', href: '/platform/staff', icon: Building2 },
    { id: 'qa-4', label: 'Settings', description: 'Configure platform', href: '/platform/settings', icon: Building2 },
  ],
  finance: [
    { id: 'qa-1', label: 'Billing', description: 'Subscriptions & plans', href: '/platform/billing', icon: CreditCard },
    { id: 'qa-2', label: 'Finance', description: 'Revenue analytics', href: '/platform/finance', icon: CreditCard },
    { id: 'qa-3', label: 'Pricing', description: 'Pricing tiers', href: '/platform/pricing-tiers', icon: CreditCard },
    { id: 'qa-4', label: 'Organizations', description: 'Workspace billing status', href: '/platform/organizations', icon: Building2 },
  ],
  elections: [
    { id: 'qa-1', label: 'Elections', description: 'All elections overview', href: '/platform/elections', icon: Vote },
    { id: 'qa-2', label: 'Organizations', description: 'Workspace management', href: '/platform/organizations', icon: Building2 },
    { id: 'qa-3', label: 'Analytics', description: 'Platform analytics', href: '/platform/analytics', icon: Building2 },
    { id: 'qa-4', label: 'Activity', description: 'Recent activity', href: '/platform/audit', icon: Building2 },
  ],
  support: [
    { id: 'qa-1', label: 'Support', description: 'Open tickets', href: '/platform/support', icon: Building2 },
    { id: 'qa-2', label: 'Organizations', description: 'Workspace management', href: '/platform/organizations', icon: Building2 },
    { id: 'qa-3', label: 'Activity', description: 'Recent activity', href: '/platform/audit', icon: Building2 },
    { id: 'qa-4', label: 'Analytics', description: 'Platform analytics', href: '/platform/analytics', icon: Building2 },
  ],
  security: [
    { id: 'qa-1', label: 'Security', description: 'Security events', href: '/platform/security', icon: Building2 },
    { id: 'qa-2', label: 'Audit Log', description: 'Audit trail', href: '/platform/audit', icon: Building2 },
    { id: 'qa-3', label: 'Staff', description: 'Team management', href: '/platform/staff', icon: Building2 },
    { id: 'qa-4', label: 'Analytics', description: 'Platform analytics', href: '/platform/analytics', icon: Building2 },
  ],
  auditor: [
    { id: 'qa-1', label: 'Audit Log', description: 'Full audit trail', href: '/platform/audit', icon: Building2 },
    { id: 'qa-2', label: 'Security', description: 'Security events', href: '/platform/security', icon: Building2 },
    { id: 'qa-3', label: 'Analytics', description: 'Platform analytics', href: '/platform/analytics', icon: Building2 },
    { id: 'qa-4', label: 'Elections', description: 'Election audit', href: '/platform/elections', icon: Vote },
  ],
  general: [
    { id: 'qa-1', label: 'Organizations', description: 'Monitor active workspaces', href: '/platform/organizations', icon: Building2 },
    { id: 'qa-2', label: 'Analytics', description: 'Platform reports', href: '/platform/analytics', icon: Building2 },
    { id: 'qa-3', label: 'Activity', description: 'Recent activity', href: '/platform/audit', icon: Building2 },
    { id: 'qa-4', label: 'Settings', description: 'Configure platform', href: '/platform/settings', icon: Building2 },
  ],
}
