import { useState, useEffect, useRef } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import {
  Gauge, Building2, ScrollText, Fingerprint, BarChart3, Receipt, Eye,
  Bell, SlidersHorizontal, UserCog, Shield, Headset, Activity, ShieldAlert,
  Search, Moon, Sun, Menu, X, ChevronLeft, ChevronRight, LogOut, Settings, Wallet, Tags,
  type LucideIcon,
} from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { usePlatformPermissions } from "../contexts/PlatformPermissionsContext"
import { PLATFORM_PERMISSIONS } from "../constants/platformPermissions"
import OrivisLogo from "../components/OrivisLogo"
import { usePlatformNotifications } from "../hooks/usePlatformNotifications"
import NotificationBell from "../components/NotificationBell"
import NotificationToasts from "../components/NotificationToasts"
import WorkspaceImpersonationBanner from "../components/platform/WorkspaceImpersonationBanner"
import { usePlatformGovernance } from "../contexts/PlatformGovernanceContext"

type NavItem = { label: string; path: string; icon: LucideIcon; permission: string }
type NavGroup = { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/platform", icon: Gauge, permission: PLATFORM_PERMISSIONS.VIEW_DASHBOARD },
    ],
  },
  {
    label: "Governance",
    items: [
      { label: "Organizations", path: "/platform/organizations", icon: Building2, permission: PLATFORM_PERMISSIONS.VIEW_ORGANIZATIONS },
      { label: "Events", path: "/platform/elections", icon: ScrollText, permission: PLATFORM_PERMISSIONS.VIEW_REPORTS },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Staff", path: "/platform/staff", icon: UserCog, permission: PLATFORM_PERMISSIONS.VIEW_USERS },
      { label: "Roles", path: "/platform/roles", icon: Shield, permission: PLATFORM_PERMISSIONS.MANAGE_ROLES },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { label: "Platform Health", path: "/platform/monitoring", icon: Activity, permission: PLATFORM_PERMISSIONS.VIEW_DASHBOARD },
      { label: "Audit Log", path: "/platform/audit", icon: Fingerprint, permission: PLATFORM_PERMISSIONS.VIEW_AUDIT },
      { label: "Founder Audit", path: "/platform/founder-audit", icon: Eye, permission: PLATFORM_PERMISSIONS.VIEW_WORKSPACE_SESSIONS },
      { label: "Security", path: "/platform/security", icon: ShieldAlert, permission: PLATFORM_PERMISSIONS.VIEW_AUDIT },
      { label: "Analytics", path: "/platform/analytics", icon: BarChart3, permission: PLATFORM_PERMISSIONS.VIEW_REPORTS },
    ],
  },
  {
    label: "Services",
    items: [
      { label: "Billing", path: "/platform/billing", icon: Receipt, permission: PLATFORM_PERMISSIONS.VIEW_FINANCE },
      { label: "Finance", path: "/platform/finance", icon: Wallet, permission: PLATFORM_PERMISSIONS.VIEW_FINANCE },
      { label: "Pricing Tiers", path: "/platform/pricing-tiers", icon: Tags, permission: PLATFORM_PERMISSIONS.VIEW_FINANCE },
      { label: "Free-Event Flags", path: "/platform/free-event-flags", icon: ShieldAlert, permission: PLATFORM_PERMISSIONS.VIEW_FINANCE },
      { label: "Support", path: "/platform/support", icon: Headset, permission: PLATFORM_PERMISSIONS.MANAGE_SUPPORT },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Notifications", path: "/platform/notifications", icon: Bell, permission: PLATFORM_PERMISSIONS.MANAGE_NOTIFICATIONS },
      { label: "Settings", path: "/platform/settings", icon: SlidersHorizontal, permission: PLATFORM_PERMISSIONS.MANAGE_ORGANIZATIONS },
    ],
  },
]

function SidebarNav({ location, navigate, collapsed, groups }: { location: any; navigate: any; collapsed: boolean; groups: NavGroup[] }) {
  return (
    <nav className="flex-1 px-2 py-1 space-y-0 overflow-y-auto org-scrollbar">
      {groups.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p className="px-3 pt-2 pb-0 text-[9px] font-semibold uppercase tracking-wider text-brand-text-disabled">{group.label}</p>
          )}
          {group.items.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || (item.path !== "/platform" && location.pathname.startsWith(item.path + "/"))
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative w-full flex items-center rounded-lg text-left transition-all ${
                  collapsed ? 'justify-center gap-2 py-2' : 'gap-1.5 px-2.5 py-1 text-[12px] font-medium'
                } ${
                  isActive ? '' : 'text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary'
                }`}
                style={isActive ? { backgroundColor: `color-mix(in srgb, var(--platform-accent) 10%, transparent)`, color: 'var(--platform-accent)' } : {}}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full" style={{ backgroundColor: 'var(--platform-accent)' }} />
                )}
                <span
                  className={`flex shrink-0 items-center justify-center rounded-lg transition-colors ${
                    collapsed ? 'h-7 w-7' : 'h-6 w-6'
                  } ${isActive ? '' : 'bg-brand-surface-elevated'}`}
                  style={isActive ? { backgroundColor: `color-mix(in srgb, var(--platform-accent) 14%, transparent)`, color: 'var(--platform-accent)' } : {}}
                >
                  <Icon size={collapsed ? 16 : 14} />
                </span>
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

export default function PlatformLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout: authLogout, user } = useAuth()
  const { hasPermission, permissionsLoaded } = usePlatformPermissions()
  const { inspection, exitInspection } = usePlatformGovernance()
  const {
    notifications: platformNotifications,
    unreadCount: platformUnreadCount,
    toasts: platformToasts,
    preferences: platformNotificationPreferences,
    markRead: markPlatformNotificationRead,
    markAllRead: markAllPlatformNotificationsRead,
    updatePreferences: updatePlatformNotificationPreferences,
    dismissToast: dismissPlatformToast,
  } = usePlatformNotifications()


  const navGroups = permissionsLoaded
    ? NAV_GROUPS
        .map(group => ({ ...group, items: group.items.filter(item => hasPermission(item.permission)) }))
        .filter(group => group.items.length > 0)
    : NAV_GROUPS

  const [platformTheme, setPlatformTheme] = useState<'light' | 'dark'>(() => {
    const s = localStorage.getItem('orivis-platform-theme')
    return s === 'dark' ? 'dark' : 'light'
  })
  const toggleTheme = () => setPlatformTheme(t => (t === 'dark' ? 'light' : 'dark'))

  useEffect(() => {
    document.documentElement.dataset.theme = platformTheme
    localStorage.setItem('orivis-platform-theme', platformTheme)
  }, [platformTheme])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--org-primary', 'var(--platform-accent)')
    root.style.setProperty('--org-secondary', '#14213D')
    root.style.setProperty('--org-accent', '#00A8CC')
    return () => {
      root.style.removeProperty('--org-primary')
      root.style.removeProperty('--org-secondary')
      root.style.removeProperty('--org-accent')
    }
  }, [])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [profileOpen, setProfileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState<boolean>(() => window.matchMedia('(min-width: 1024px)').matches)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    setMobileOpen(false); setSearchOpen(false); setProfileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false); setProfileOpen(false) }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  const searchRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!searchOpen && !profileOpen) return
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) { setSearchOpen(false); setSearchQuery("") }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [searchOpen, profileOpen])

  const handleLogout = async () => {
    await authLogout()
    navigate("/platformsignin", { replace: true })
  }

  const adminName = user?.displayName || 'Administrator'
  const adminEmail = user?.email || ''
  const adminInitials = adminName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)

  return (
    <div className="min-h-screen bg-brand-bg flex">
      <NotificationToasts toasts={platformToasts} onDismiss={dismissPlatformToast} />
      <style>{`
        :root { --org-primary: var(--platform-accent); --org-secondary: #14213D; --org-accent: #00A8CC; }
        .org-scrollbar::-webkit-scrollbar { width: 4px; }
        .org-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .org-scrollbar::-webkit-scrollbar-thumb { background: var(--color-brand-border); border-radius: 9999px; }
        *:focus-visible { outline: 2px solid var(--platform-accent); outline-offset: 2px; border-radius: 8px; }
      `}</style>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 h-full z-30 border-r border-brand-divider bg-brand-surface transition-all duration-300"
        style={{ width: sidebarCollapsed ? '64px' : '240px' }}
        role="navigation"
        aria-label="Platform navigation"
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-brand-divider ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <button onClick={() => navigate("/platform")} className="flex items-center gap-2 cursor-pointer">
            {!sidebarCollapsed && (
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded" style={{ color: 'var(--platform-accent)', backgroundColor: 'rgba(var(--platform-accent-rgb), 0.08)' }}>Platform Console</span>
            )}
          </button>
        </div>

        {/* Status */}
        {!sidebarCollapsed && (
          <div className="px-4 py-2 border-b border-brand-divider">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success shrink-0" />
              <span className="text-[11px] text-brand-text-muted">Platform Admin</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <SidebarNav location={location} navigate={navigate} collapsed={sidebarCollapsed} groups={navGroups} />

        {/* Footer */}
        <div className={`p-3 border-t border-brand-divider ${sidebarCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
          {!sidebarCollapsed && (
            <div className="px-3 py-2 mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0 text-white" style={{ backgroundColor: 'var(--platform-accent)' }}>
                  {adminInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-brand-text-primary truncate">{adminName}</p>
                  <p className="text-[10px] text-brand-text-muted truncate">Platform Admin</p>
                </div>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold mb-1 text-white" style={{ backgroundColor: 'var(--platform-accent)' }}>
              {adminInitials}
            </div>
          )}
          {!sidebarCollapsed && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-brand-text-disabled">
              <Shield size={10} />
              <span>Powered by ORIVIS</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full h-9 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 w-[280px] h-full z-50 bg-brand-surface border-r border-brand-divider flex flex-col lg:hidden">
              <div className="flex items-center justify-between px-4 py-4 border-b border-brand-divider">
                <div className="flex items-center gap-2.5">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded" style={{ color: 'var(--platform-accent)', backgroundColor: 'rgba(var(--platform-accent-rgb), 0.08)' }}>Platform Console</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-xl hover:bg-brand-surface-interactive transition-colors" aria-label="Close navigation">
                  <X size={16} className="text-brand-text-muted" />
                </button>
              </div>
              <SidebarNav location={location} navigate={navigate} collapsed={false} groups={navGroups} />
              <div className="p-4 border-t border-brand-divider space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: 'var(--platform-accent)' }}>
                    {adminInitials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-brand-text-primary">{adminName}</p>
                    <p className="text-[11px] text-brand-text-muted">{adminEmail}</p>
                  </div>
                </div>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-white text-xs font-semibold transition-colors">
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300" style={{ marginLeft: isDesktop ? (sidebarCollapsed ? '64px' : '240px') : '0px' }}>
        {/* Workspace impersonation banner */}
        <AnimatePresence>
          {inspection.isActive && inspection.organizationId && (
            <WorkspaceImpersonationBanner
              organizationName={inspection.organizationName ?? 'Unknown Workspace'}
              mode={inspection.mode}
              onExit={() => exitInspection()}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="bg-brand-surface sticky top-0 z-20 border-b border-brand-divider" role="banner">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)}
                className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary transition-colors -ml-1"
                aria-label="Open navigation menu">
                <Menu size={18} />
              </button>
              <div className="hidden sm:flex items-center gap-2.5">
                <OrivisLogo size="sm" />
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              {/* Search — slides out on hover, tucks back in on outside click / Esc */}
              <div
                className="relative flex items-center"
                ref={searchRef}
                onMouseEnter={() => setSearchOpen(true)}
              >
                <motion.div
                  initial={false}
                  animate={{ width: searchOpen ? 240 : 0, opacity: searchOpen ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <input
                    name="platformSearch"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        const q = searchQuery.trim()
                        setSearchQuery('')
                        setSearchOpen(false)
                        navigate(`/platform/organizations?q=${encodeURIComponent(q)}`)
                      }
                    }}
                    placeholder="Search organizations..."
                    aria-label="Search platform"
                    className="h-9 w-full rounded-l-lg border border-r-0 border-brand-border bg-brand-surface px-3 pr-8 text-xs text-brand-text-primary placeholder-brand-text-disabled outline-none focus:border-brand-gold/40 transition-colors"
                  />
                </motion.div>
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary transition-colors"
                  aria-label="Search platform" aria-expanded={searchOpen}
                >
                  <Search size={16} />
                </button>
                {searchOpen && (
                  <span className="absolute right-9 top-1/2 -translate-y-1/2 text-[9px] font-mono text-brand-text-disabled pointer-events-none">↵</span>
                )}
              </div>

              {/* Theme */}
              <button onClick={toggleTheme}
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary transition-colors"
                aria-label={`Switch to ${platformTheme === 'dark' ? 'light' : 'dark'} mode`}>
                {platformTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {/* Notifications */}
              <NotificationBell
                notifications={platformNotifications}
                unreadCount={platformUnreadCount}
                preferences={platformNotificationPreferences}
                onMarkRead={markPlatformNotificationRead}
                onMarkAllRead={markAllPlatformNotificationsRead}
                onToggleSound={() => void updatePlatformNotificationPreferences({ soundEnabled: !platformNotificationPreferences.soundEnabled })}
                viewAllPath="/platform/notifications"
              />

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary transition-colors"
                  aria-label="User menu" aria-expanded={profileOpen}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 text-white" style={{ backgroundColor: 'var(--platform-accent)' }}>
                    {adminInitials}
                  </div>
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-1.5rem)] origin-top-right">
                      <div className="glass-strong rounded-lg p-2 shadow-lg border border-brand-divider">
                        <div className="px-3 py-2 border-b border-brand-divider mb-1">
                          <p className="text-xs font-semibold text-brand-text-primary">{adminName}</p>
                          <p className="text-[10px] text-brand-text-muted">{adminEmail}</p>
                          <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--platform-accent)' }}>Platform Admin</p>
                        </div>
                        <button onClick={() => navigate('/platform/settings')}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-brand-surface-interactive text-xs text-brand-text-secondary transition-colors">
                          <Settings size={14} className="text-brand-text-muted" />
                          Platform Settings
                        </button>
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-white text-xs font-semibold transition-colors mt-1">
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
