import { useState } from "react"
import { motion } from "motion/react"
import { Search, ShieldAlert, LogIn, UserCog, Ban, CreditCard, Settings } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"

type EventCategory = "auth" | "permissions" | "suspensions" | "billing" | "config"
type EventSeverity = "critical" | "high" | "medium" | "low"

interface SecurityEvent {
  id: string
  action: string
  user: string
  category: EventCategory
  severity: EventSeverity
  timestamp: string
  details: string
}

const CATEGORY_CONFIG: Record<EventCategory, { label: string; icon: typeof ShieldAlert; color: string }> = {
  auth: { label: "Authentication", icon: LogIn, color: "text-blue-400" },
  permissions: { label: "Permissions", icon: UserCog, color: "text-purple-400" },
  suspensions: { label: "Suspensions", icon: Ban, color: "text-status-error" },
  billing: { label: "Billing", icon: CreditCard, color: "text-brand-gold" },
  config: { label: "Configuration", icon: Settings, color: "text-brand-text-muted" },
}

const MOCK_EVENTS: SecurityEvent[] = [
  { id: "e1", action: "Failed login attempt", user: "unknown@example.com", category: "auth", severity: "medium", timestamp: "2026-07-28T14:30:00Z", details: "5 failed attempts in 3 minutes from IP 192.168.1.100" },
  { id: "e2", action: "Role modified", user: "platform@orivis.app", category: "permissions", severity: "high", timestamp: "2026-07-28T12:00:00Z", details: "Platform Admin role: 'Delete Organization' permission added" },
  { id: "e3", action: "Organization suspended", user: "platform@orivis.app", category: "suspensions", severity: "critical", timestamp: "2026-07-28T10:15:00Z", details: "Org 'EduVote Systems' suspended — policy violation detected" },
  { id: "e4", action: "New staff account created", user: "platform@orivis.app", category: "permissions", severity: "medium", timestamp: "2026-07-27T16:00:00Z", details: "Staff account 'admin@org.com' created with Platform Administrator role" },
  { id: "e5", action: "Subscription plan changed", user: "platform@orivis.app", category: "billing", severity: "medium", timestamp: "2026-07-27T14:00:00Z", details: "Org 'Meranos Ltd.' upgraded from Basic to Professional" },
  { id: "e6", action: "Platform setting changed", user: "platform@orivis.app", category: "config", severity: "high", timestamp: "2026-07-27T09:30:00Z", details: "Session timeout threshold changed from 60 to 120 minutes" },
  { id: "e7", action: "Organization restored", user: "platform@orivis.app", category: "suspensions", severity: "medium", timestamp: "2026-07-26T11:00:00Z", details: "Org 'AfriTech Innovations' restored after issue resolution" },
  { id: "e8", action: "API key rotated", user: "platform@orivis.app", category: "config", severity: "high", timestamp: "2026-07-26T09:00:00Z", details: "API key for 'Production Gateway' was rotated by platform admin" },
  { id: "e9", action: "MFA status changed", user: "user@org.com", category: "auth", severity: "high", timestamp: "2026-07-25T15:00:00Z", details: "User 'john.doe@org.com' disabled MFA on their account" },
  { id: "e10", action: "Staff permissions updated", user: "platform@orivis.app", category: "permissions", severity: "medium", timestamp: "2026-07-25T10:00:00Z", details: "Staff member 'chidi@orivis.app' granted Finance role" },
]

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function PlatformSecurity() {
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState<"all" | EventSeverity>("all")
  const [category, setCategory] = useState<"all" | EventCategory>("all")

  const filtered = MOCK_EVENTS.filter((e) => {
    if (severity !== "all" && e.severity !== severity) return false
    if (category !== "all" && e.category !== category) return false
    if (search) {
      const q = search.toLowerCase()
      return e.action.toLowerCase().includes(q) || e.user.toLowerCase().includes(q) || e.details.toLowerCase().includes(q)
    }
    return true
  })

  const criticalCount = MOCK_EVENTS.filter((e) => e.severity === "critical" || e.severity === "high").length

  return (
    <>
    <SeoHead meta={{ title: "Security — Platform | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Security" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black uppercase tracking-tight text-brand-text-primary">Security & Audit</h1>
          <p className="text-sm text-brand-text-muted mt-1">Monitor security events, permission changes, and sensitive actions.</p>
        </div>
        <div className="flex items-center gap-2 bg-brand-surface-elevated rounded-xl px-4 py-2 border border-brand-border">
          <div className={`w-2 h-2 rounded-full ${criticalCount > 0 ? "bg-status-error animate-pulse" : "bg-status-success"}`} />
          <span className="text-[10px] font-mono text-brand-text-muted font-bold uppercase tracking-wider">{criticalCount} High-Risk Events</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search security events..."
            className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "auth", "permissions", "suspensions", "billing", "config"] as const).map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                category === c ? "bg-brand-gold/20 text-brand-gold border border-brand-gold/30" : "bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text-primary"
              }`}>
              {c === "all" ? "All" : CATEGORY_CONFIG[c].label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Event</th>
                <th className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Category</th>
                <th className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Severity</th>
                <th className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">User</th>
                <th className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => {
                const cat = CATEGORY_CONFIG[event.category]
                const Icon = cat.icon
                return (
                  <tr key={event.id} className="border-b border-brand-border last:border-0 hover:bg-brand-surface-interactive/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color} bg-current/10`}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-brand-text-primary">{event.action}</p>
                          <p className="text-[9px] font-mono text-brand-text-muted mt-0.5">{event.details}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-mono uppercase tracking-wider ${cat.color}`}>{cat.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        event.severity === "critical" ? "bg-status-error/10 text-status-error" :
                        event.severity === "high" ? "bg-status-error/5 text-status-error" :
                        event.severity === "medium" ? "bg-status-warning/10 text-status-warning" :
                        "bg-brand-surface-interactive text-brand-text-muted"
                      }`}>{event.severity}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-text-muted font-mono">{event.user}</td>
                    <td className="px-4 py-3 text-xs text-brand-text-muted">{timeAgo(event.timestamp)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  )
}
