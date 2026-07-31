import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Gauge, CalendarCheck, Users, Receipt, Settings, Fingerprint, HelpCircle,
  Search, Bell, Moon, Sun, ChevronLeft, ChevronRight, Menu, X,
  LogOut, ChevronDown, Plus, Shield, ExternalLink, AlertCircle, Lock, Clock, Eye,
  BarChart3, Bookmark, LayoutTemplate,
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeProvider'
import { useAuth } from '../../hooks/useAuth'
import { usePlatformGovernance, INTERVENTION_CATEGORIES } from '../../contexts/PlatformGovernanceContext'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import OrivisLogo from '../../components/OrivisLogo'
import { ORG_NOTIFICATIONS, QUICK_ACTIONS, SUBSCRIPTION } from '../mock/data'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/org/dashboard', icon: Gauge },
  { label: 'Events', path: '/org/events', icon: CalendarCheck },
  { label: 'Team', path: '/org/team', icon: Users },
  { label: 'Billing', path: '/org/billing', icon: Receipt },
  { label: 'Reports', path: '/org/reports', icon: BarChart3 },
  { label: 'Templates', path: '/org/templates', icon: LayoutTemplate },
  { label: 'Archive', path: '/org/archive', icon: Bookmark },
  { label: 'Workspace', path: '/org/workspace', icon: Settings },
  { label: 'Audit Logs', path: '/org/audit-logs', icon: Fingerprint },
  { label: 'Help & Support', path: '/org/help', icon: HelpCircle },
]

export default function OrgLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggle: toggleTheme } = useTheme()
  const { branding, admin } = useOrgBranding()
  const { logout } = useAuth()
  const {
    inspection,
    intervention,
    currentSession,
    timeline,
    exitInspection,
    requestIntervention,
    requestEmergencyIntervention,
    finishIntervention,
    cancelPendingChanges,
    returnToInspection,
    getDuration,
    hasPermission,
  } = usePlatformGovernance()

  const isInspection = inspection.isActive
  const isIntervention = intervention.isActive
  const isEmergency = intervention.isEmergency

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)

  // Intervention modal state
  const [showInterventionModal, setShowInterventionModal] = useState(false)
  const [interventionCategory, setInterventionCategory] = useState<string>('')
  const [interventionReason, setInterventionReason] = useState('')
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)
  const [showEmergencyWarning, setShowEmergencyWarning] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)

  useEffect(() => {
    setMobileOpen(false); setSearchOpen(false); setNotifOpen(false)
    setProfileOpen(false); setQuickActionsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false); setNotifOpen(false)
        setProfileOpen(false); setQuickActionsOpen(false)
        setShowInterventionModal(false)
        setShowEmergencyWarning(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const handleActivateIntervention = () => {
    setIsEmergencyMode(false)
    setInterventionCategory('')
    setInterventionReason('')
    setShowInterventionModal(true)
  }

  const handleEmergencyIntervention = () => {
    setIsEmergencyMode(true)
    setInterventionCategory('')
    setInterventionReason('')
    setShowEmergencyWarning(true)
  }

  const handleConfirmIntervention = async () => {
    if (!interventionCategory || !interventionReason) return
    if (isEmergencyMode) {
      await requestEmergencyIntervention(interventionReason, interventionCategory as any)
    } else {
      await requestIntervention(interventionReason, interventionCategory as any)
    }
    setShowInterventionModal(false)
    setShowEmergencyWarning(false)
  }

  const handleExit = () => {
    if (currentSession && currentSession.actionsCount > 0) {
      setShowSummaryModal(true)
    } else {
      exitInspection()
    }
  }

  const handleFinishIntervention = () => {
    setShowSummaryModal(true)
  }

  const closeSummaryAndExit = () => {
    setShowSummaryModal(false)
    exitInspection()
  }

  const unreadCount = ORG_NOTIFICATIONS.filter((n) => !n.read).length
  const canIntervene = hasPermission('intervene')

  return (
    <div className="min-h-screen bg-brand-bg flex">
      <style>{`
        :root {
          --org-primary: ${branding.primaryColor};
          --org-secondary: ${branding.secondaryColor};
          --org-accent: ${branding.accentColor};
        }
        .org-scrollbar::-webkit-scrollbar { width: 4px; }
        .org-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .org-scrollbar::-webkit-scrollbar-thumb { background: var(--color-brand-border); border-radius: 9999px; }
        *:focus-visible { outline: 2px solid ${branding.primaryColor}; outline-offset: 2px; border-radius: 8px; }
      `}</style>

      {/* Section 12: Governance Session Summary Modal */}
      <AnimatePresence>
        {showSummaryModal && currentSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-brand-border">
                <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Governance Session Summary</h2>
              </div>
              <div className="px-6 py-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Workspace</p>
                    <p className="text-brand-text-primary font-medium">{currentSession.organizationName}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Session ID</p>
                    <p className="text-brand-text-primary font-mono text-[10px]">{currentSession.id}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Platform Staff</p>
                    <p className="text-brand-text-primary">{currentSession.platformUser}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Duration</p>
                    <p className="text-brand-text-primary">{getDuration(currentSession.startTime)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Inspection Time</p>
                    <p className="text-brand-text-primary">{getDuration(currentSession.startTime)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Intervention Time</p>
                    <p className="text-brand-text-primary">{intervention.activatedAt ? getDuration(intervention.activatedAt) : 'N/A'}</p>
                  </div>
                  {currentSession.reason && (
                    <div className="col-span-2">
                      <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Reason</p>
                      <p className="text-brand-text-primary">{currentSession.reason}</p>
                    </div>
                  )}
                  {currentSession.category && (
                    <div className="col-span-2">
                      <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Category</p>
                      <p className="text-brand-text-primary">{currentSession.category}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Actions Performed</p>
                    <p className="text-brand-text-primary">{currentSession.actionsCount} actions</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
                <button
                  onClick={closeSummaryAndExit}
                  className="px-4 py-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Return to Platform
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 15: Emergency Warning Screen */}
      <AnimatePresence>
        {showEmergencyWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-surface border border-status-error/40 rounded-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-status-error/20 bg-status-error/5">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-status-error" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-status-error">Emergency Intervention</h2>
                </div>
                <p className="text-[10px] text-brand-text-muted mt-1">High Risk — Everything will be logged and audited.</p>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <label className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Category *</label>
                  <select
                    value={interventionCategory}
                    onChange={(e) => setInterventionCategory(e.target.value)}
                    className="w-full mt-1 bg-brand-bg-secondary border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text-primary focus:outline-none focus:border-status-error transition-all"
                  >
                    <option value="">Select category...</option>
                    {INTERVENTION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Reason *</label>
                  <textarea
                    value={interventionReason}
                    onChange={(e) => setInterventionReason(e.target.value)}
                    placeholder="Explain why emergency intervention is required..."
                    rows={3}
                    className="w-full mt-1 bg-brand-bg-secondary border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-status-error transition-all resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-brand-border flex items-center justify-between">
                <button
                  onClick={() => { setShowEmergencyWarning(false); setIsEmergencyMode(false) }}
                  className="text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmIntervention}
                  disabled={!interventionCategory || !interventionReason}
                  className="px-4 py-2 bg-status-error hover:bg-status-error/80 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  Confirm Emergency
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 4: Intervention Modal */}
      <AnimatePresence>
        {showInterventionModal && !showEmergencyWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-brand-border">
                <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Activate Platform Intervention</h2>
                <p className="text-[10px] text-brand-text-muted mt-1">Category and reason are mandatory.</p>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <label className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Category *</label>
                  <select
                    value={interventionCategory}
                    onChange={(e) => setInterventionCategory(e.target.value)}
                    className="w-full mt-1 bg-brand-bg-secondary border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all"
                  >
                    <option value="">Select category...</option>
                    {INTERVENTION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Reason *</label>
                  <textarea
                    value={interventionReason}
                    onChange={(e) => setInterventionReason(e.target.value)}
                    placeholder="Describe why intervention is needed..."
                    rows={3}
                    className="w-full mt-1 bg-brand-bg-secondary border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-brand-border flex items-center justify-between">
                <button
                  onClick={() => setShowInterventionModal(false)}
                  className="text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmIntervention}
                  disabled={!interventionCategory || !interventionReason}
                  className="px-4 py-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  Confirm Intervention
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-72 z-50 lg:hidden flex flex-col bg-brand-surface"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <MobileSidebarContent
              branding={branding}
              admin={admin}
              location={location}
              navigate={navigate}
              onClose={() => setMobileOpen(false)}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 h-full z-30 border-r border-brand-divider bg-brand-surface transition-all duration-300"
        style={{ width: sidebarCollapsed ? '64px' : '260px' }}
        role="navigation"
        aria-label="Main navigation"
      >
        <DesktopSidebarContent
          branding={branding}
          admin={admin}
          location={location}
          navigate={navigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </aside>

      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '64px' : '260px' }}
      >
        <header
          className="sticky top-0 z-20 border-b border-brand-divider"
          style={{ backgroundColor: 'var(--glass-strong-bg)' }}
          role="banner"
        >
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-brand-surface-interactive transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu size={18} className="text-brand-text-primary" />
              </button>
              <div className="hidden sm:flex items-center gap-2.5">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt={`${branding.organizationName} logo`} className="h-6 w-auto" />
                ) : (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: branding.primaryColor, color: '#FFFFFF' }}>
                    {branding.shortName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-brand-text-primary leading-tight">{branding.shortName}</p>
                  <p className="text-[9px] font-mono text-brand-text-muted leading-tight">{branding.workspaceTitle}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              <div className="relative">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 rounded-xl hover:bg-brand-surface-interactive transition-colors text-brand-text-muted hover:text-brand-text-primary"
                  aria-label="Search workspace"
                  aria-expanded={searchOpen}
                >
                  <Search size={16} />
                </button>
                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-80 origin-top-right"
                    >
                      <div className="glass-strong rounded-2xl p-3 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-2 bg-brand-bg-secondary/50 rounded-xl px-3 py-2 border border-brand-border">
                          <Search size={14} className="text-brand-text-muted shrink-0" />
                          <input
                            autoFocus
                            placeholder="Search elections, members, settings..."
                            className="bg-transparent text-xs text-brand-text-primary placeholder-brand-text-disabled flex-1 outline-none border-none"
                            aria-label="Search input"
                          />
                          <kbd className="text-[9px] font-mono text-brand-text-disabled bg-brand-surface-elevated px-1.5 py-0.5 rounded shrink-0">ESC</kbd>
                        </div>
                        <p className="text-[10px] text-brand-text-muted mt-3 text-center">Type to search across workspace</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-brand-surface-interactive transition-colors text-brand-text-muted hover:text-brand-text-primary"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                  className="p-2 rounded-xl hover:bg-brand-surface-interactive transition-colors text-brand-text-muted hover:text-brand-text-primary"
                  aria-label="Quick actions"
                  aria-expanded={quickActionsOpen}
                >
                  <Plus size={16} />
                </button>
                <AnimatePresence>
                  {quickActionsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-56 origin-top-right"
                    >
                      <div className="glass-strong rounded-2xl p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
                        <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted px-3 py-1.5">Quick Actions</p>
                        {QUICK_ACTIONS.map((qa) => (
                          <button
                            key={qa.id}
                            onClick={() => { navigate(qa.href as string); setQuickActionsOpen(false) }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-surface-interactive transition-colors text-left"
                          >
                            <div>
                              <p className="text-xs font-medium text-brand-text-primary">{qa.label}</p>
                              <p className="text-[9px] font-mono text-brand-text-muted">{qa.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-xl hover:bg-brand-surface-interactive transition-colors text-brand-text-muted hover:text-brand-text-primary"
                  aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                  aria-expanded={notifOpen}
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: branding.primaryColor }} aria-hidden="true" />
                  )}
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-80 origin-top-right"
                    >
                      <div className="glass-strong rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden">
                        <div className="px-4 py-3 border-b border-brand-divider flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: `${branding.primaryColor}20`, color: branding.primaryColor }}>
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="max-h-72 overflow-y-auto org-scrollbar">
                          {ORG_NOTIFICATIONS.length === 0 ? (
                            <div className="py-8 text-center">
                              <p className="text-xs text-brand-text-muted">No notifications</p>
                            </div>
                          ) : (
                            ORG_NOTIFICATIONS.map((n) => (
                              <button
                                key={n.id}
                                className={`w-full text-left px-4 py-3 transition-colors ${n.read ? '' : 'bg-brand-surface-elevated/30'}`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs ${n.read ? 'text-brand-text-secondary' : 'text-brand-text-primary font-semibold'}`}>{n.title}</p>
                                    <p className="text-[10px] text-brand-text-muted mt-0.5 line-clamp-1">{n.preview}</p>
                                    <p className="text-[9px] font-mono text-brand-text-disabled mt-1">{n.time}</p>
                                  </div>
                                  {!n.read && <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: branding.primaryColor }} aria-hidden="true" />}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-xl hover:bg-brand-surface-interactive transition-colors"
                  aria-label="User menu"
                  aria-expanded={profileOpen}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: branding.primaryColor, color: '#FFFFFF' }}>
                    {admin.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className="text-xs font-medium text-brand-text-primary hidden sm:block">{admin.displayName}</span>
                  <ChevronDown size={12} className="text-brand-text-muted hidden sm:block" />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-56 origin-top-right"
                    >
                      <div className="glass-strong rounded-2xl p-2 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
                        <div className="px-3 py-2 border-b border-brand-divider mb-1">
                          <p className="text-xs font-semibold text-brand-text-primary">{admin.displayName}</p>
                          <p className="text-[10px] font-mono text-brand-text-muted">{admin.email}</p>
                          <p className="text-[9px] font-mono mt-0.5" style={{ color: branding.primaryColor }}>{admin.role}</p>
                        </div>
                        <button
                          onClick={() => navigate('/org/workspace')}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-brand-surface-interactive text-xs text-brand-text-secondary transition-colors"
                        >
                          <Settings size={14} className="text-brand-text-muted" />
                          Workspace Settings
                        </button>
                        <button
                          onClick={() => { logout(); navigate('/org') }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-brand-surface-interactive text-xs text-status-error transition-colors"
                        >
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

        {/* Sections 7 & 8: Governance Banner */}
        {isInspection && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-0 left-0 right-0 z-40 border-b px-4 py-2 flex items-center justify-between ${
              isIntervention
                ? isEmergency
                  ? 'bg-status-error/15 border-status-error/50'
                  : 'bg-status-error/10 border-status-error/40'
                : 'bg-brand-gold/10 border-brand-gold/40'
            }`}
            style={{ marginLeft: sidebarCollapsed ? '64px' : '260px' }}
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center gap-3 flex-wrap">
              {isIntervention ? (
                <>
                  <AlertCircle size={14} className={`shrink-0 ${isEmergency ? 'text-status-error animate-pulse' : 'text-status-error'}`} />
                  <span className="text-xs font-bold text-status-error">
                    {isEmergency ? '⚠️ Emergency Intervention Active' : 'Platform Intervention Active'}
                  </span>
                </>
              ) : (
                <>
                  <Eye size={14} className="text-brand-gold shrink-0" />
                  <span className="text-xs font-bold text-brand-gold">Workspace Inspection Active</span>
                </>
              )}

              {/* Section 7: Banner Session Info */}
              {currentSession && (
                <>
                  <span className="text-[9px] font-mono text-brand-text-muted px-2 py-0.5 bg-brand-surface-elevated rounded flex items-center gap-1">
                    <Building2Icon size={10} />
                    {currentSession.organizationName}
                  </span>
                  <span className="text-[9px] font-mono text-brand-text-muted px-2 py-0.5 bg-brand-surface-elevated rounded flex items-center gap-1">
                    <Clock size={10} />
                    {getDuration(currentSession.startTime)}
                  </span>
                  <span className="text-[9px] font-mono text-brand-text-muted px-2 py-0.5 bg-brand-surface-elevated rounded">
                    {currentSession.platformUser} · {currentSession.platformRole.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  <span className="text-[9px] font-mono text-brand-text-muted px-2 py-0.5 bg-brand-surface-elevated rounded">
                    {currentSession.id}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isIntervention ? (
                <>
                  {/* Section 8: Intervention Banner Buttons */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFinishIntervention}
                    className="flex items-center gap-1.5 px-3 py-1 bg-status-error/10 hover:bg-status-error/20 text-status-error border border-status-error/30 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <Lock size={11} />Finish Intervention
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={cancelPendingChanges}
                    className="flex items-center gap-1.5 px-3 py-1 bg-brand-surface-elevated hover:bg-brand-surface-interactive text-brand-text-muted border border-brand-border rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <X size={11} />Cancel Changes
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={returnToInspection}
                    className="flex items-center gap-1.5 px-3 py-1 bg-brand-surface-elevated hover:bg-brand-surface-interactive text-brand-text-muted border border-brand-border rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <Eye size={11} />Return to Inspection
                  </motion.button>
                </>
              ) : (
                <>
                  {/* Section 7: Inspection Banner Buttons */}
                  {canIntervene && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleActivateIntervention}
                      className="flex items-center gap-1.5 px-3 py-1 bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold border border-brand-gold/30 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <AlertCircle size={11} />Activate Intervention
                    </motion.button>
                  )}
                  {canIntervene && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEmergencyIntervention}
                      className="flex items-center gap-1.5 px-3 py-1 bg-status-error/10 hover:bg-status-error/20 text-status-error border border-status-error/30 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <AlertCircle size={11} />Emergency
                    </motion.button>
                  )}
                </>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExit}
                className="flex items-center gap-1.5 px-3 py-1 bg-brand-surface-elevated hover:bg-brand-surface-interactive text-brand-text-muted border border-brand-border rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer"
              >
                <X size={11} />Exit Workspace
              </motion.button>
            </div>
          </motion.div>
        )}

        <main
          className={`flex-1 p-4 lg:p-6 xl:p-8 overflow-x-hidden ${isInspection ? 'pt-14' : ''}`}
          role="main"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// Section 14: Read-Only UX Helpers
export function InspectionGuard({ children, fallback = null, permission }: { children: React.ReactNode; fallback?: React.ReactNode; permission?: string }) {
  const { inspection, hasPermission } = usePlatformGovernance()
  if (inspection.isActive && !hasPermission('intervene')) {
    return fallback || (
      <span className="inline-flex items-center gap-1 text-[9px] font-mono text-brand-text-muted bg-brand-surface-elevated px-2 py-1 rounded">
        <Lock size={10} /> Unavailable During Inspection
      </span>
    )
  }
  return <>{children}</>
}

export function ImmutableRuleGuard({ action, children }: { action: string; children: React.ReactNode }) {
  return (
    <div className="relative group">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-mono text-white bg-status-error/80 px-2 py-1 rounded flex items-center gap-1">
          <Shield size={10} /> Protected by ORIVIS Integrity Rules
        </span>
      </div>
    </div>
  )
}

// Helper icon component
function Building2Icon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  )
}

function DesktopSidebarContent({ branding, admin, location, navigate, collapsed, onToggleCollapse }: {
  branding: any; admin: any; location: any; navigate: any; collapsed: boolean; onToggleCollapse: () => void
}) {
  return (
    <>
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-brand-divider ${collapsed ? 'justify-center' : ''}`}>
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt={`${branding.organizationName} logo`} className="h-8 w-auto shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: branding.primaryColor, color: '#FFFFFF' }}>
            {branding.shortName.charAt(0)}
          </div>
        )}
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand-text-primary truncate">{branding.organizationName}</p>
            <p className="text-[9px] font-mono text-brand-text-muted truncate">{branding.workspaceTitle}</p>
          </div>
        )}
      </div>

      <div className={`px-4 py-2 border-b border-brand-divider ${collapsed ? 'hidden' : ''}`}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-status-success shrink-0" />
          <span className="text-[9px] font-mono text-brand-text-muted">Enterprise — Active</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto org-scrollbar">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-left transition-all ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? ''
                  : 'text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-primary'
              }`}
              style={isActive ? { backgroundColor: `${branding.primaryColor}12`, color: branding.primaryColor } : {}}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      <div className={`p-3 border-t border-brand-divider ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        {!collapsed && (
          <div className="px-3 py-2 mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0" style={{ backgroundColor: branding.primaryColor, color: '#FFFFFF' }}>
                {admin.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-brand-text-primary truncate">{admin.displayName}</p>
                <p className="text-[8px] font-mono text-brand-text-muted truncate">{admin.role}</p>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold mb-1" style={{ backgroundColor: branding.primaryColor, color: '#FFFFFF' }}>
            {admin.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
          </div>
        )}
        {!collapsed && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono text-brand-text-disabled">
            <Shield size={10} />
            <span>Powered by ORIVIS</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-brand-surface-interactive transition-colors text-brand-text-muted hover:text-brand-text-primary"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </>
  )
}

function MobileSidebarContent({ branding, admin, location, navigate, onClose }: {
  branding: any; admin: any; location: any; navigate: any; onClose: () => void
}) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-4 border-b border-brand-divider">
        <div className="flex items-center gap-2.5">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={`${branding.organizationName} logo`} className="h-7 w-auto" />
          ) : (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold" style={{ backgroundColor: branding.primaryColor, color: '#FFFFFF' }}>
              {branding.shortName.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-brand-text-primary">{branding.organizationName}</p>
            <p className="text-[9px] font-mono text-brand-text-muted">{branding.workspaceTitle}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-brand-surface-interactive transition-colors" aria-label="Close navigation menu">
          <X size={16} className="text-brand-text-muted" />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-left transition-all"
              style={isActive ? { backgroundColor: `${branding.primaryColor}12`, color: branding.primaryColor } : { color: 'var(--color-brand-text-muted)' }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={16} className="shrink-0" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-brand-divider space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: branding.primaryColor, color: '#FFFFFF' }}>
            {admin.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-text-primary">{admin.displayName}</p>
            <p className="text-[9px] font-mono text-brand-text-muted">{admin.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-brand-text-disabled">
          <Shield size={10} />
          <span>Powered by ORIVIS</span>
        </div>
      </div>
    </>
  )
}
