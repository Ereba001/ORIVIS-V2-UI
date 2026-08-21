export interface PageMeta {
  title: string
  description: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  canonical?: string
  keywords?: string
  noindex?: boolean
}

const siteUrl = "https://orivis.com"
const defaultOgImage = `${siteUrl}/og-default.png`

export const site = {
  name: "ORIVIS",
  tagline: "Powering Trusted Decisions",
  url: siteUrl,
  defaultOgImage,
  twitterHandle: "@orivis",
  locale: "en_US",
}

export const pageMeta: Record<string, PageMeta> = {
  "/": {
    title: "Home | ORIVIS",
    description:
      "Run secure, transparent elections, approvals, and consultations with ORIVIS. The governance technology platform trusted by governments, universities, and corporations worldwide.",
    keywords:
      "online voting platform, election software, governance technology, digital governance, secure voting platform",
  },
  "/about": {
    title: "About | ORIVIS",
    description:
      "ORIVIS enables organizations to conduct transparent, verifiable decision making processes. Learn about our mission to power trusted decisions globally.",
  },
  "/contact": {
    title: "Contact | ORIVIS",
    description:
      "Have questions about ORIVIS? Contact our team at +234 902 799 14 or visit us in Port Harcourt, Rivers State.",
  },
  "/governance": {
    title: "Governance Centre | ORIVIS",
    description:
      "Browse and participate in elections, consultations, approvals, referendums, and surveys across your organization. Secure, transparent governance.",
  },
  "/privacy": {
    title: "Privacy Policy | ORIVIS",
    description:
      "Your vote is private. ORIVIS never links your identity to your vote. Read our privacy policy to understand how we protect your data.",
  },
  "/terms": {
    title: "Terms of Service | ORIVIS",
    description:
      "The rules and guidelines for using the ORIVIS platform. Review our terms for account usage, prohibited activities, and service availability.",
  },
  "/results": {
    title: "Results Centre | ORIVIS",
    description:
      "Browse published election results from past and active elections. View position level breakdowns and individual contestant vote counts.",
  },
  "/organize": {
    title: "Organize — Register Your Organization | ORIVIS",
    description:
      "Register your organization on ORIVIS to start running secure elections, approvals, and governance processes.",
    noindex: true,
  },
  "/elections": {
    title: "Governance Centre | ORIVIS",
    description:
      "Browse and participate in elections, consultations, approvals, referendums, and surveys across your organization. Secure, transparent governance.",
  },
  "/signin": {
    title: "Sign In | ORIVIS",
    description: "Sign in to your ORIVIS account to participate in elections and governance activities.",
    noindex: true,
  },
  "/forgot-password": {
    title: "Forgot Password | ORIVIS",
    description: "Reset your ORIVIS account password.",
    noindex: true,
  },
  "/reset-password": {
    title: "Reset Password | ORIVIS",
    description: "Set a new password for your ORIVIS account.",
    noindex: true,
  },
  "/verify-email": {
    title: "Verify Email | ORIVIS",
    description: "Verify your email address to activate your ORIVIS account.",
    noindex: true,
  },
  "/activate-account": {
    title: "Activate Account | ORIVIS",
    description: "Activate your ORIVIS account.",
    noindex: true,
  },
  "/session-expired": {
    title: "Session Expired | ORIVIS",
    description: "Your session has expired. Please sign in again.",
    noindex: true,
  },
  "/unauthorized": {
    title: "Unauthorized | ORIVIS",
    description: "You do not have permission to access this page.",
    noindex: true,
  },
  "/org/signin": {
    title: "Organization Sign In | ORIVIS",
    description: "Sign in to your organization workspace on ORIVIS.",
    noindex: true,
  },
  "/org/register": {
    title: "Register Organization | ORIVIS",
    description: "Register your organization on ORIVIS to start running secure elections and governance processes.",
    noindex: true,
  },
  "/org/forgot-password": {
    title: "Forgot Password — Organization | ORIVIS",
    description: "Reset your organization account password on ORIVIS.",
    noindex: true,
  },
  "/org/reset-password": {
    title: "Reset Password — Organization | ORIVIS",
    description: "Set a new password for your organization account on ORIVIS.",
    noindex: true,
  },
  "/org/invitation": {
    title: "Accept Invitation | ORIVIS",
    description: "Accept your invitation to join an organization workspace on ORIVIS.",
    noindex: true,
  },
  "/platform/2fa": {
    title: "Two-Factor Authentication | ORIVIS",
    description: "Enter your two factor authentication code to access your ORIVIS account.",
    noindex: true,
  },
  "/platform/verify": {
    title: "Security Verification | ORIVIS",
    description: "Verify your identity to access the ORIVIS platform.",
    noindex: true,
  },
  "/platform/backup-code": {
    title: "Backup Code | ORIVIS",
    description: "Use a backup code to access your ORIVIS account.",
    noindex: true,
  },
  "/workspace": {
    title: "Dashboard — Workspace | ORIVIS",
    description: "Manage your elections, view results, and oversee governance activities from your workspace dashboard.",
    noindex: true,
  },
  "/workspace/elections": {
    title: "Elections — Workspace | ORIVIS",
    description: "Manage and monitor elections across your organization from your workspace.",
    noindex: true,
  },
  "/workspace/elections/create": {
    title: "Create Election — Workspace | ORIVIS",
    description: "Set up a new election with positions, candidates, and voting parameters.",
    noindex: true,
  },
  "/workspace/team": {
    title: "Team — Workspace | ORIVIS",
    description: "Manage your workspace team members and their roles.",
    noindex: true,
  },
  "/workspace/invitations": {
    title: "Invitations — Workspace | ORIVIS",
    description: "Manage invitations sent to join your workspace team.",
    noindex: true,
  },
  "/workspace/audit": {
    title: "Audit Log — Workspace | ORIVIS",
    description: "View audit trail of all activities in your workspace.",
    noindex: true,
  },
  "/workspace/settings/branding": {
    title: "Branding Settings — Workspace | ORIVIS",
    description: "Customize your workspace branding, logo, and colors.",
    noindex: true,
  },
  "/workspace/settings/workspace": {
    title: "Workspace Settings | ORIVIS",
    description: "Configure your workspace general settings and preferences.",
    noindex: true,
  },
  "/workspace/settings/profile": {
    title: "Profile Settings — Workspace | ORIVIS",
    description: "Manage your profile information and preferences.",
    noindex: true,
  },
  "/workspace/settings/billing": {
    title: "Billing — Workspace | ORIVIS",
    description: "Manage your workspace billing, invoices, and subscription plan.",
    noindex: true,
  },
  "/workspace/settings/notifications": {
    title: "Notification Settings — Workspace | ORIVIS",
    description: "Configure your notification preferences for workspace activities.",
    noindex: true,
  },
  "/platform": {
    title: "Platform Dashboard | ORIVIS",
    description: "Monitor platform wide analytics, organizations, and system health.",
    noindex: true,
  },
  "/platform/organizations": {
    title: "Organizations — Platform | ORIVIS",
    description: "View and manage all organizations registered on the ORIVIS platform.",
    noindex: true,
  },
  "/platform/elections": {
    title: "Elections — Platform | ORIVIS",
    description: "View and manage all elections across the platform.",
    noindex: true,
  },
  "/platform/audit": {
    title: "Audit Log — Platform | ORIVIS",
    description: "View platform wide audit trail of all system activities.",
    noindex: true,
  },
  "/platform/analytics": {
    title: "Analytics — Platform | ORIVIS",
    description: "View platform wide analytics, trends, and insights.",
    noindex: true,
  },
  "/platform/billing": {
    title: "Billing — Platform | ORIVIS",
    description: "Manage platform billing, revenue, and subscription plans.",
    noindex: true,
  },
  "/platform/notifications": {
    title: "Notifications — Platform | ORIVIS",
    description: "View and manage platform wide notifications.",
    noindex: true,
  },
  "/platform/settings": {
    title: "Platform Settings | ORIVIS",
    description: "Configure platform wide settings, security, and preferences.",
    noindex: true,
  },
  "/org": {
    title: "Organization Sign In | ORIVIS",
    description: "Sign in to your organization workspace on ORIVIS.",
    noindex: true,
  },
  "/org/dashboard": {
    title: "Dashboard — Organization | ORIVIS",
    description: "View your organization's election management dashboard.",
    noindex: true,
  },
  "/org/elections": {
    title: "Elections — Organization | ORIVIS",
    description: "Manage elections for your organization.",
    noindex: true,
  },
  "/org/team": {
    title: "Team — Organization | ORIVIS",
    description: "Manage your organization team members and permissions.",
    noindex: true,
  },
  "/org/billing": {
    title: "Billing — Organization | ORIVIS",
    description: "Manage your organization's billing and subscription.",
    noindex: true,
  },
  "/org/workspace": {
    title: "Workspace Settings — Organization | ORIVIS",
    description: "Configure your organization workspace settings.",
    noindex: true,
  },
  "/org/audit-logs": {
    title: "Audit Logs — Organization | ORIVIS",
    description: "View audit trail of activities in your organization workspace.",
    noindex: true,
  },
  "/org/help": {
    title: "Help & Support | ORIVIS",
    description: "Get help and support for using the ORIVIS platform.",
    noindex: true,
  },
}

export function getMeta(path: string): PageMeta {
  const exact = pageMeta[path]
  if (exact) return exact

  const wildcardKey = Object.keys(pageMeta).find((key) => {
    if (!key.includes(":")) return false
    const pattern = new RegExp("^" + key.replace(/:\w+/g, "[^/]+") + "$")
    return pattern.test(path)
  })
  if (wildcardKey) return pageMeta[wildcardKey]

  return {
    title: "ORIVIS — Trusted Governance & Election Platform",
    description: "Run secure, transparent elections, approvals, and consultations with ORIVIS.",
  }
}