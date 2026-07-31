import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { Gauge, Building2, Users, UserCheck, ScrollText, Fingerprint, BarChart3, Receipt, Bell, SlidersHorizontal, UserCog, Shield, CreditCard, Headset, Activity, ShieldAlert, Eye } from "lucide-react"
import OrivisLogo from "../components/OrivisLogo"
import { useAuth } from "../hooks/useAuth"

const navGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/platform", icon: Gauge },
    ],
  },
  {
    label: "Governance",
    items: [
      { label: "Governance Sessions", path: "/platform/governance-sessions", icon: Eye },
      { label: "Organizations", path: "/platform/organizations", icon: Building2 },
      { label: "Elections", path: "/platform/elections", icon: ScrollText },
      { label: "Subscriptions", path: "/platform/subscriptions", icon: CreditCard },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Staff", path: "/platform/staff", icon: UserCog },
      { label: "Roles", path: "/platform/roles", icon: Shield },
      { label: "Users", path: "/platform/users", icon: Users },
      { label: "Memberships", path: "/platform/memberships", icon: UserCheck },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { label: "Platform Health", path: "/platform/monitoring", icon: Activity },
      { label: "Audit Log", path: "/platform/audit", icon: Fingerprint },
      { label: "Security", path: "/platform/security", icon: ShieldAlert },
      { label: "Analytics", path: "/platform/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Services",
    items: [
      { label: "Billing", path: "/platform/billing", icon: Receipt },
      { label: "Support", path: "/platform/support", icon: Headset },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Notifications", path: "/platform/notifications", icon: Bell },
      { label: "Settings", path: "/platform/settings", icon: SlidersHorizontal },
    ],
  },
]

export default function PlatformLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout: authLogout } = useAuth()

  const handleLogout = async () => {
    await authLogout()
    navigate("/platformsignin", { replace: true })
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <aside className="fixed left-0 top-0 w-64 border-r border-brand-border bg-brand-surface h-screen hidden lg:flex flex-col z-30">
        <div className="px-6 py-6 border-b border-brand-border flex items-center gap-2">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer">
            <OrivisLogo className="text-brand-text-primary" />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
          </button>
          <span className="text-[9px] font-mono text-brand-gold font-bold uppercase tracking-widest bg-brand-gold/10 px-2 py-0.5 rounded">Platform</span>
        </div>
        <nav className="px-3 py-4 flex-1 overflow-y-auto space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-4 mb-1 text-[8px] font-mono uppercase tracking-widest text-brand-text-disabled font-bold">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path || (item.path !== "/platform" && location.pathname.startsWith(item.path + "/"))
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-left transition-all cursor-pointer ${
                        isActive
                          ? "bg-brand-surface-elevated text-brand-text-primary shadow-sm"
                          : "text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-primary"
                      }`}
                    >
                      <Icon size={15} className={isActive ? "text-brand-gold" : "text-brand-text-muted"} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-brand-border space-y-2">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors w-full cursor-pointer"
          >
            <span>Back</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-status-error hover:text-status-error/80 transition-colors w-full cursor-pointer"
          >
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="lg:ml-64 min-h-screen p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
