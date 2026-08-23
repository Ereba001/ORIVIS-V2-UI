import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Settings, Search, Moon, Sun, ChevronLeft, ChevronRight, Menu, X,
  LogOut, Plus, Shield, AlertCircle, Lock, Clock, Eye, Loader2,
} from 'lucide-react'
import {
  WorkspaceGaugeIcon, WorkspaceEventsIcon, WorkspaceTeamIcon, WorkspaceRolesIcon,
  WorkspaceBillingIcon, WorkspaceReportsIcon, WorkspaceTemplatesIcon, WorkspaceArchiveIcon,
  WorkspaceSettingsIcon, WorkspaceAuditIcon, WorkspaceHelpIcon, WorkspaceAssistedElectionIcon,
} from '../components/icons/WorkspaceIcons'
import { useAuth } from '../../hooks/useAuth'
import { usePlatformGovernance, INTERVENTION_CATEGORIES } from '../../contexts/PlatformGovernanceContext'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import { useNotifications } from '../../hooks/useNotifications'
import NotificationBell from '../../components/NotificationBell'
import NotificationToasts from '../../components/NotificationToasts'
import WorkspaceSuspended from '../components/WorkspaceSuspended'
import WorkspaceClosed from '../components/WorkspaceClosed'
import WorkspaceImpersonationBanner from '../../components/platform/WorkspaceImpersonationBanner'

const QUICK_ACTIONS = [
  { id: 'qa-1', label: 'Create Event', description: 'Set up a new election, poll or survey', href: '/org/events/create' },
  { id: 'qa-2', label: 'Invite Team Member', description: 'Add administrators or election officers', href: '/org/team' },
  { id: 'qa-3', label: 'Complete Setup', description: 'Configure workspace branding and preferences', href: '/org/workspace' },
  { id: 'qa-4', label: 'View Billing', description: 'Review subscription and payment history', href: '/org/billing' },
]

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/org/dashboard', icon: WorkspaceGaugeIcon },
  { label: 'Events', path: '/org/events', icon: WorkspaceEventsIcon },
  { label: 'Assisted Election Centre', path: '/org/assisted-election-centre', icon: WorkspaceAssistedElectionIcon },
  { label: 'Team', path: '/org/team', icon: WorkspaceTeamIcon },
  { label: 'Roles', path: '/org/roles', icon: WorkspaceRolesIcon },
  { label: 'Billing', path: '/org/billing', icon: WorkspaceBillingIcon },
  { label: 'Reports', path: '/org/reports', icon: WorkspaceReportsIcon },
  { label: 'Templates', path: '/org/templates', icon: WorkspaceTemplatesIcon },
  { label: 'Archive', path: '/org/archive', icon: WorkspaceArchiveIcon },
  { label: 'Workspace', path: '/org/workspace', icon: WorkspaceSettingsIcon },
  { label: 'Audit Logs', path: '/org/audit-logs', icon: WorkspaceAuditIcon },
  { label: 'Help & Support', path: '/org/help', icon: WorkspaceHelpIcon },
]

const AEC_PATH = '/org/assisted-election-centre'

function getVisibleNavItems(assistedEventsEnabled: boolean) {
  return NAV_ITEMS.filter(item => item.path !== AEC_PATH || assistedEventsEnabled)
}

function getManageItems(visible: typeof NAV_ITEMS) {
  return visible.filter(item => NAV_ITEMS.indexOf(item) < 7)
}

function getAdminItems(visible: typeof NAV_ITEMS) {
  return visible.filter(item => NAV_ITEMS.indexOf(item) >= 7)
}

function formatOrgCategory(type: string | undefined | null): string {
  if (!type) return 'Organization'
  const cleaned = type
    .trim()
    .toLowerCase()
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase())
}

function OrgLogoAvatar({ branding, className = '', iconClassName = 'text-[10px]' }: {
  branding: { logoUrl: string | null; shortName: string; primaryColor: string; organizationName: string }
  className?: string
  iconClassName?: string
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = branding.logoUrl !== null && !imgFailed
  return (
    <div
      className={`rounded-lg flex items-center justify-center font-bold shrink-0 overflow-hidden ${className}`}
      style={{ backgroundColor: showImage ? 'transparent' : branding.primaryColor, color: showImage ? undefined : 'var(--color-brand-text-primary)' }}
    >
      {showImage ? (
        <img
          src={branding.logoUrl as string}
          alt={`${branding.organizationName ?? 'Organization'} logo`}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className={iconClassName}>{branding.shortName.charAt(0)}</span>
      )}
    </div>
  )
}

export default function OrgLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { branding, admin, isLoaded, status: brandingStatus, retry: retryBranding, assistedEventsEnabled } = useOrgBranding()
  const { logout } = useAuth()
  const {
    notifications: ORG_NOTIFICATIONS,
    unreadCount,
    toasts: notificationToasts,
    preferences: notificationPreferences,
    markRead: markNotificationRead,
    markAllRead: markAllNotificationsRead,
    updatePreferences,
    dismissToast,
  } = useNotifications()
  const {
    inspection,
    intervention,
    currentSession,
    exitInspection,
    requestIntervention,
    requestEmergencyIntervention,
    cancelPendingChanges,
    returnToInspection,
    getDuration,
    hasPermission,
  } = usePlatformGovernance()

  const isInspection = inspection.isActive
  const isIntervention = intervention.isActive
  const isEmergency = intervention.isEmergency

  const [orgTheme, setOrgTheme] = useState<'light' | 'dark'>(() => {
    const s = localStorage.getItem('orivis-org-theme')
    return s === 'dark' ? 'dark' : 'light'
  })
  const toggleTheme = () => setOrgTheme(t => (t === 'dark' ? 'light' : 'dark'))

  useEffect(() => {
    localStorage.setItem('orivis-org-theme', orgTheme)
  }, [orgTheme])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [bannerExiting, setBannerExiting] = useState(false)
  const headerControlsRef = useRef<HTMLDivElement>(null)

  const [isDesktop, setIsDesktop] = useState<boolean>(() => window.matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  // Intervention modal state
  const [showInterventionModal, setShowInterventionModal] = useState(false)
  const [interventionCategory, setInterventionCategory] = useState<string>('')
  const [interventionReason, setInterventionReason] = useState('')
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)
  const [showEmergencyWarning, setShowEmergencyWarning] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)

  useEffect(() => {
    setMobileOpen(false); setSearchOpen(false)
    setProfileOpen(false); setQuickActionsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setProfileOpen(false); setQuickActionsOpen(false)
        setShowInterventionModal(false)
        setShowEmergencyWarning(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (headerControlsRef.current && !headerControlsRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
        setProfileOpen(false); setQuickActionsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
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

  const canIntervene = hasPermission('intervene')

  return (
    <div className="org-shell min-h-screen bg-brand-bg flex" data-org-theme={orgTheme}>
      <NotificationToasts toasts={notificationToasts} onDismiss={dismissToast} />

      <AnimatePresence>
        {(isInspection || intervention.isActive) && (
          <WorkspaceImpersonationBanner
            organizationName={branding.organizationName}
            mode={isIntervention ? 'full_control' : 'view_only'}
            onExit={() => {
              setBannerExiting(true)
              exitInspection()
            }}
            exiting={bannerExiting}
          />
        )}
      </AnimatePresence>
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

      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="branding-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed inset-0 z-[200] bg-brand-bg/80 backdrop-blur-md flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={28} className="animate-spin text-brand-text-muted" />
              <p className="text-xs text-brand-text-muted font-medium">Setting up your dashboard…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {brandingStatus === 'error' && (
        <div className="fixed top-0 inset-x-0 z-[180] bg-status-danger text-brand-text-primary text-xs font-medium px-4 py-2 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <AlertCircle size={14} />
            Workspace branding could not be loaded. Showing default settings.
          </span>
          <button
            onClick={retryBranding}
            className="underline font-semibold whitespace-nowrap hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )}

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
              role="dialog"
              aria-modal="true"
              aria-label="Governance session summary"
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
              role="dialog"
              aria-modal="true"
              aria-label="Emergency intervention"
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
                  <label htmlFor="emergency-category" className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Category *</label>
                  <select
                    id="emergency-category"
                    name="emergencyCategory"
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
                  <label htmlFor="emergency-reason" className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Reason *</label>
                  <textarea
                    id="emergency-reason"
                    name="emergencyReason"
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
              role="dialog"
              aria-modal="true"
              aria-label="Activate platform intervention"
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
                  <label htmlFor="intervention-category" className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Category *</label>
                  <select
                    id="intervention-category"
                    name="interventionCategory"
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
                  <label htmlFor="intervention-reason" className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Reason *</label>
                  <textarea
                    id="intervention-reason"
                    name="interventionReason"
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
              navItems={getVisibleNavItems(assistedEventsEnabled)}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 h-full z-30 border-r border-brand-divider bg-brand-surface transition-all duration-300"
        style={{ width: sidebarCollapsed ? '64px' : '240px' }}
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
          navItems={getVisibleNavItems(assistedEventsEnabled)}
        />
      </aside>

      <div
        className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-clip transition-all duration-300"
        style={{ marginLeft: isDesktop ? (sidebarCollapsed ? '64px' : '240px') : '0px' }}
      >
        {/* Sections 7 & 8: Governance Banner — single unified banner for all workspace sessions */}
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
            style={{ marginLeft: isDesktop ? (sidebarCollapsed ? '64px' : '240px') : '0px' }}
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center gap-3 flex-wrap">
              {isIntervention ? (
                <>
                  <AlertCircle size={14} className={`shrink-0 ${isEmergency ? 'text-status-error animate-pulse' : 'text-status-error'}`} />
                  <span className="text-xs font-bold text-status-error">
                    {isEmergency ? 'Emergency Intervention Active' : 'Platform Intervention Active'}
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

            <div className="flex items-center gap-2 flex-wrap">
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
                    onClick={() => currentSession && cancelPendingChanges(currentSession.id)}
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

        <header
          className={`bg-brand-surface sticky z-20 border-b border-brand-divider ${isInspection ? 'top-10' : 'top-0'}`}
          role="banner"
        >
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary transition-colors -ml-1"
                aria-label="Open navigation menu"
              >
                <Menu size={18} />
              </button>
              <div className="hidden sm:flex items-center gap-2.5">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt={`${branding.organizationName} logo`} className="h-6 w-auto"
                    onError={(e) => { e.currentTarget.style.display = 'none'; const fb = e.currentTarget.nextElementSibling as HTMLElement | null; if (fb) fb.style.display = 'flex' }} />
                ) : null}
                <div className="w-8 h-8 rounded-xl items-center justify-center text-xs font-bold shrink-0 text-white"
                  style={{ backgroundColor: branding.primaryColor, display: branding.logoUrl ? 'none' : 'flex' }}>
                  {branding.shortName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-text-primary leading-tight max-w-[180px] truncate">{branding.organizationName}</p>
                  {branding.tagline && <p className="text-[11px] text-brand-text-muted leading-tight">{branding.tagline}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5" ref={headerControlsRef}>
              <div className="relative">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary transition-colors"
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
                      className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1.5rem)] origin-top-right"
                    >
                      <div className="glass-strong rounded-lg p-3 shadow-lg border border-brand-divider">
                        <div className="flex items-center gap-2 bg-brand-bg-secondary/50 rounded-xl px-3 py-2 border border-brand-border">
                          <Search size={14} className="text-brand-text-muted shrink-0" />
                          <input
                            autoFocus
                            name="workspaceSearch"
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
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary transition-colors"
                aria-label={`Switch to ${orgTheme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {orgTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary transition-colors"
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
                      className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-1.5rem)] origin-top-right"
                    >
                      <div className="glass-strong rounded-lg p-1.5 shadow-lg border border-brand-divider">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-text-muted px-3 py-1.5">Quick Actions</p>
                        {QUICK_ACTIONS.map((qa) => (
                          <button
                            key={qa.id}
                            onClick={() => { navigate(qa.href as string); setQuickActionsOpen(false) }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-surface-interactive transition-colors text-left"
                          >
                            <div>
                              <p className="text-xs font-medium text-brand-text-primary">{qa.label}</p>
                              <p className="text-[10px] text-brand-text-muted">{qa.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <NotificationBell
                notifications={ORG_NOTIFICATIONS}
                unreadCount={unreadCount}
                preferences={notificationPreferences}
                onMarkRead={markNotificationRead}
                onMarkAllRead={markAllNotificationsRead}
                onToggleSound={() => void updatePreferences({ soundEnabled: !notificationPreferences.soundEnabled })}
                viewAllPath="/org/notifications"
                accentColor={branding.primaryColor}
              />

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary transition-colors"
                  aria-label="User menu"
                  aria-expanded={profileOpen}
                >
                  <OrgLogoAvatar branding={branding} className="w-7 h-7" iconClassName="text-[10px]" />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-1.5rem)] origin-top-right"
                    >
                      <div className="glass-strong rounded-lg p-2 shadow-lg border border-brand-divider">
                        <div className="px-3 py-2 border-b border-brand-divider mb-1">
                          <p className="text-xs font-semibold text-brand-text-primary">{admin.displayName}</p>
                          <p className="text-[10px] text-brand-text-muted">{admin.email}</p>
                          <p className="text-[10px] font-semibold mt-0.5" style={{ color: branding.primaryColor }}>{admin.role}</p>
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
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-opacity hover:opacity-90"
                          style={{ backgroundColor: branding.primaryColor }}
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

        <main
          className={`flex-1 p-4 lg:p-6 xl:p-8 overflow-x-auto ${isInspection ? 'pt-24' : ''}`}
          role="main"
        >
          {branding.organizationStatus === 'closed' ? (
            <WorkspaceClosed organizationName={branding.organizationName} />
          ) : branding.organizationStatus === 'suspended' ? (
            <WorkspaceSuspended organizationName={branding.organizationName} />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}

// Section 14: Read-Only UX Helpers
export function InspectionGuard({ children, fallback = null, permission: _permission }: { children: React.ReactNode; fallback?: React.ReactNode; permission?: string }) {
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

export function ImmutableRuleGuard({ action: _action, children }: { action: string; children: React.ReactNode }) {
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

function DesktopSidebarContent({ branding, admin, location, navigate, collapsed, onToggleCollapse, navItems }: {
  branding: any; admin: any; location: any; navigate: any; collapsed: boolean; onToggleCollapse: () => void; navItems: typeof NAV_ITEMS
}) {
  const manageItems = getManageItems(navItems)
  const adminItems = getAdminItems(navItems)
  return (
    <>
      <div className={`px-4 py-2 border-b border-brand-divider ${collapsed ? 'hidden' : ''}`}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-text-disabled shrink-0" />
          <span className="text-[11px] text-brand-text-muted truncate">{formatOrgCategory(branding.organizationType)}</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto org-scrollbar">
        {!collapsed && (
          <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-text-disabled">Manage</p>
        )}
        {manageItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg text-left transition-all ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? ''
                  : 'text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary'
              }`}
              style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--org-primary) 10%, transparent)', color: 'var(--org-primary)' } : {}}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full" style={{ backgroundColor: 'var(--org-primary)' }} />
              )}
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isActive ? '' : 'bg-brand-surface-elevated'
                }`}
                style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--org-primary) 14%, transparent)', color: 'var(--org-primary)' } : {}}
              >
                <Icon size={16} />
              </span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
        {!collapsed && (
          <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-text-disabled">Administration</p>
        )}
        {adminItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg text-left transition-all ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? ''
                  : 'text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary'
              }`}
              style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--org-primary) 10%, transparent)', color: 'var(--org-primary)' } : {}}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full" style={{ backgroundColor: 'var(--org-primary)' }} />
              )}
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isActive ? '' : 'bg-brand-surface-elevated'
                }`}
                style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--org-primary) 14%, transparent)', color: 'var(--org-primary)' } : {}}
              >
                <Icon size={16} />
              </span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      <div className={`p-3 border-t border-brand-divider ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        {!collapsed && (
          <div className="px-3 py-2 mb-1">
            <div className="flex items-center gap-2.5">
              <OrgLogoAvatar branding={branding} className="w-7 h-7" iconClassName="text-[9px]" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-brand-text-primary truncate">{admin.displayName}</p>
                <p className="text-[10px] text-brand-text-muted truncate">{admin.role}</p>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <OrgLogoAvatar branding={branding} className="w-8 h-8 mb-1" iconClassName="text-[10px]" />
        )}
        {!collapsed && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-brand-text-disabled">
            <Shield size={10} />
            <span>Powered by ORIVIS</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="w-full h-9 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </>
  )
}

function MobileSidebarContent({ branding, admin, location, navigate, onClose, navItems }: {
  branding: any; admin: any; location: any; navigate: any; onClose: () => void; navItems: typeof NAV_ITEMS
}) {
  const manageItems = getManageItems(navItems)
  const adminItems = getAdminItems(navItems)
  return (
    <>
      <div className="flex items-center justify-end px-4 py-4 border-b border-brand-divider">
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-brand-surface-interactive transition-colors" aria-label="Close navigation menu">
          <X size={16} className="text-brand-text-muted" />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-text-disabled">Manage</p>
        {manageItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg text-left transition-all ${
                isActive
                  ? ''
                  : 'text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary'
              }`}
              style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--org-primary) 10%, transparent)', color: 'var(--org-primary)' } : {}}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full" style={{ backgroundColor: 'var(--org-primary)' }} />
              )}
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isActive ? '' : 'bg-brand-surface-elevated'
                }`}
                style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--org-primary) 14%, transparent)', color: 'var(--org-primary)' } : {}}
              >
                <Icon size={16} />
              </span>
              <span>{item.label}</span>
            </button>
          )
        })}
        <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-text-disabled">Administration</p>
        {adminItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg text-left transition-all ${
                isActive
                  ? ''
                  : 'text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary'
              }`}
              style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--org-primary) 10%, transparent)', color: 'var(--org-primary)' } : {}}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full" style={{ backgroundColor: 'var(--org-primary)' }} />
              )}
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isActive ? '' : 'bg-brand-surface-elevated'
                }`}
                style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--org-primary) 14%, transparent)', color: 'var(--org-primary)' } : {}}
              >
                <Icon size={16} />
              </span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-brand-divider space-y-3">
        <div className="flex items-center gap-3">
          <OrgLogoAvatar branding={branding} className="w-8 h-8" iconClassName="text-[10px]" />
          <div>
            <p className="text-xs font-semibold text-brand-text-primary">{admin.displayName}</p>
            <p className="text-[11px] text-brand-text-muted">{admin.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-brand-text-disabled">
          <Shield size={10} />
          <span>Powered by ORIVIS</span>
        </div>
      </div>
    </>
  )
}
