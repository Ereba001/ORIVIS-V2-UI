import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

// --- Section 5: Governance Permissions ---
export type GovernancePermission =
  | 'view_workspace'
  | 'inspect_workspace'
  | 'intervene'
  | 'manage_billing'
  | 'manage_security'
  | 'suspend_workspace'
  | 'restore_workspace'
  | 'view_audit'
  | 'export_audit'

export type GovernanceRole = 'platform_owner' | 'platform_administrator' | 'support_engineer' | 'security_officer' | 'finance_officer' | 'compliance_officer'

export const GOVERNANCE_ROLE_PERMISSIONS: Record<GovernanceRole, GovernancePermission[]> = {
  platform_owner: ['view_workspace', 'inspect_workspace', 'intervene', 'manage_billing', 'manage_security', 'suspend_workspace', 'restore_workspace', 'view_audit', 'export_audit'],
  platform_administrator: ['view_workspace', 'inspect_workspace', 'intervene', 'manage_billing', 'view_audit', 'export_audit'],
  support_engineer: ['view_workspace', 'inspect_workspace', 'view_audit'],
  security_officer: ['view_workspace', 'inspect_workspace', 'intervene', 'manage_security', 'suspend_workspace', 'view_audit', 'export_audit'],
  finance_officer: ['view_workspace', 'manage_billing', 'view_audit'],
  compliance_officer: ['view_workspace', 'inspect_workspace', 'view_audit', 'export_audit'],
}

// --- Section 4: Intervention Categories ---
export type InterventionCategory =
  | 'Technical Support'
  | 'Organization Request'
  | 'Election Recovery'
  | 'Billing'
  | 'Security Investigation'
  | 'Fraud Investigation'
  | 'Legal Request'
  | 'Migration'
  | 'Emergency'
  | 'Other'

export const INTERVENTION_CATEGORIES: InterventionCategory[] = [
  'Technical Support', 'Organization Request', 'Election Recovery', 'Billing',
  'Security Investigation', 'Fraud Investigation', 'Legal Request', 'Migration', 'Emergency', 'Other',
]

// --- Section 16: Risk Levels ---
export type GovernanceRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

// --- Section 2: Governance Session ---
export type SessionMode = 'Inspection' | 'Intervention'
export type SessionStatus = 'Active' | 'Completed' | 'Cancelled'

export interface GovernanceSession {
  id: string
  organizationId: string
  organizationName: string
  platformUser: string
  platformRole: GovernanceRole
  startTime: string
  endTime: string | null
  duration: string | null
  mode: SessionMode
  category: InterventionCategory | null
  reason: string | null
  status: SessionStatus
  actionsCount: number
  riskLevel: GovernanceRiskLevel
  isEmergency: boolean
}

// --- Section 6: Governance Timeline ---
export type TimelineSeverity = 'info' | 'warning' | 'critical'
export type TimelineAction =
  | 'Entered Workspace'
  | 'Viewed Dashboard'
  | 'Opened Events'
  | 'Viewed Participants'
  | 'Viewed Audit'
  | 'Activated Intervention'
  | 'Edited Branding'
  | 'Changed Settings'
  | 'Suspended Event'
  | 'Exited Workspace'
  | 'Emergency Activated'
  | 'Report Exported'
  | 'Session Closed'

export interface TimelineEntry {
  id: string
  timestamp: string
  actor: string
  action: TimelineAction | string
  target: string
  severity: TimelineSeverity
}

// --- Intervention Log Entry ---
export interface InterventionLogEntry {
  id: string
  timestamp: string
  platformOwner: string
  organizationId: string
  organizationName: string
  action: string
  resource: string
  previousValue: string
  newValue: string
  reason: string
  interventionMode: boolean
}

// --- Section 9: Immutable Rules ---
export const IMMUTABLE_ACTIONS = [
  'Cast Votes', 'Modify Votes', 'Delete Votes', 'Edit Receipts',
  'Alter Receipt Hashes', 'Modify Audit Logs', 'Change Election History',
  'Alter Published Results', 'Modify Vote Counts', 'Delete Ballots',
]

// --- Section 10: Safe Intervention Scope ---
export const INTERVENTION_SCOPE = [
  'Workspace Settings', 'Workspace Branding', 'Workspace Configuration',
  'Organization Profile', 'Subscriptions', 'Billing', 'Support Configuration',
  'Team Members', 'Roles', 'Permissions', 'Event Configuration',
  'Candidate Management', 'Participant Management',
]

// --- Section 11: Notification Setting ---
export interface PlatformAccessNotificationSetting {
  enabled: boolean
}

// --- Section 18: Governance Reports ---
export type GovernanceReportType =
  | 'Inspection Summary'
  | 'Intervention Report'
  | 'Security Activity'
  | 'Billing Activity'
  | 'Compliance Report'
  | 'Organization Access Report'
  | 'Staff Activity Report'
  | 'Governance Trends'

// --- Section 15: Emergency Intervention ---
export interface EmergencyInterventionRequest {
  category: InterventionCategory
  reason: string
  confirmedAt: string | null
}

// --- Context Type ---
interface PlatformGovernanceContextType {
  inspection: { isActive: boolean; organizationId: string | null; organizationName: string | null }
  intervention: { isActive: boolean; reason: string | null; category: InterventionCategory | null; activatedAt: string | null; isEmergency: boolean }
  currentSession: GovernanceSession | null
  timeline: TimelineEntry[]
  interventionLogs: InterventionLogEntry[]
  notificationSetting: PlatformAccessNotificationSetting
  enterInspection: (organizationId: string, organizationName: string) => void
  exitInspection: () => void
  requestIntervention: (reason: string, category: InterventionCategory) => Promise<boolean>
  exitIntervention: () => void
  requestEmergencyIntervention: (reason: string, category: InterventionCategory) => Promise<boolean>
  finishIntervention: () => void
  cancelPendingChanges: () => void
  returnToInspection: () => void
  logTimeline: (action: TimelineAction | string, target: string, severity?: TimelineSeverity) => void
  logIntervention: (action: Omit<InterventionLogEntry, 'id' | 'timestamp' | 'platformOwner'>) => void
  toggleNotifications: (enabled: boolean) => void
  hasPermission: (permission: GovernancePermission) => boolean
  currentRole: GovernanceRole
  setCurrentRole: (role: GovernanceRole) => void
  generateReport: (type: GovernanceReportType) => void
  closeSession: () => void
  getDuration: (start: string) => string
}

const PlatformGovernanceContext = createContext<PlatformGovernanceContextType | null>(null)

function generateId(): string {
  return `gov-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateSessionId(): string {
  return `GS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function PlatformGovernanceProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  // --- Inspection State ---
  const [inspection, setInspection] = useState<PlatformGovernanceContextType['inspection']>({
    isActive: false, organizationId: null, organizationName: null,
  })

  // --- Intervention State ---
  const [intervention, setIntervention] = useState<PlatformGovernanceContextType['intervention']>({
    isActive: false, reason: null, category: null, activatedAt: null, isEmergency: false,
  })

  // --- Session State (Section 2) ---
  const [currentSession, setCurrentSession] = useState<GovernanceSession | null>(null)

  // --- Timeline (Section 6) ---
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])

  // --- Intervention Logs ---
  const [interventionLogs, setInterventionLogs] = useState<InterventionLogEntry[]>([])

  // --- Notification Setting (Section 11) ---
  const [notificationSetting, setNotificationSetting] = useState<PlatformAccessNotificationSetting>({ enabled: true })

  // --- Current Role (Section 5) ---
  const [currentRole, setCurrentRole] = useState<GovernanceRole>('platform_owner')

  const hasPermission = useCallback((permission: GovernancePermission): boolean => {
    return GOVERNANCE_ROLE_PERMISSIONS[currentRole].includes(permission)
  }, [currentRole])

  const getDuration = useCallback((start: string): string => {
    return formatDuration(Date.now() - new Date(start).getTime())
  }, [])

  const logTimeline = useCallback((action: TimelineAction | string, target: string, severity: TimelineSeverity = 'info') => {
    const entry: TimelineEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      actor: 'Platform Owner',
      action,
      target,
      severity,
    }
    setTimeline((prev) => [...prev, entry])
  }, [])

  // --- Section 2/3: Enter Inspection ---
  const enterInspection = useCallback((organizationId: string, organizationName: string) => {
    setInspection({ isActive: true, organizationId, organizationName })

    const session: GovernanceSession = {
      id: generateSessionId(),
      organizationId,
      organizationName,
      platformUser: 'Platform Owner',
      platformRole: currentRole,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      mode: 'Inspection',
      category: null,
      reason: null,
      status: 'Active',
      actionsCount: 0,
      riskLevel: 'Low',
      isEmergency: false,
    }
    setCurrentSession(session)
    logTimeline('Entered Workspace', organizationName)
    navigate(`/org/dashboard`)
  }, [currentRole, navigate, logTimeline])

  // --- Exit Inspection (Section 3) ---
  const exitInspection = useCallback(() => {
    setInspection({ isActive: false, organizationId: null, organizationName: null })
    setIntervention({ isActive: false, reason: null, category: null, activatedAt: null, isEmergency: false })

    if (currentSession) {
      logTimeline('Exited Workspace', currentSession.organizationName)
      setTimeline((prev) => [...prev])
      setCurrentSession((prev) => prev ? { ...prev, endTime: new Date().toISOString(), status: 'Completed' } : null)
    }

    navigate('/platform/organizations')
  }, [currentSession, navigate, logTimeline])

  // --- Section 4: Request Intervention ---
  const requestIntervention = useCallback(async (reason: string, category: InterventionCategory): Promise<boolean> => {
    const confirmed = window.confirm(
      `Activate Platform Intervention?\n\n` +
      `Category: ${category}\nReason: ${reason}\n\n` +
      `All changes will be logged in the governance audit trail.\n` +
      `The organization will see "Platform Intervention Active" indicator.\n\nProceed?`
    )

    if (confirmed) {
      setIntervention({ isActive: true, reason, category, activatedAt: new Date().toISOString(), isEmergency: false })
      setCurrentSession((prev) => prev ? {
        ...prev, mode: 'Intervention', category, reason, riskLevel: 'Medium', actionsCount: prev.actionsCount,
      } : null)
      logTimeline('Activated Intervention', category, 'warning')
      return true
    }
    return false
  }, [logTimeline])

  // --- Section 15: Emergency Intervention ---
  const requestEmergencyIntervention = useCallback(async (reason: string, category: InterventionCategory): Promise<boolean> => {
    const warningConfirmed = window.confirm(
      `⚠️ EMERGENCY INTERVENTION ⚠️\n\n` +
      `Category: ${category}\nReason: ${reason}\n\n` +
      `This is a HIGH RISK action. Everything will be logged and audited.\n` +
      `The organization will be notified immediately.\n\n` +
      `This action is irreversible.\n\nProceed?`
    )

    if (!warningConfirmed) return false

    const secondConfirmed = window.confirm(
      `FINAL CONFIRMATION\n\n` +
      `You are about to activate Emergency Intervention.\n` +
      `Category: ${category}\nReason: ${reason}\n\n` +
      `All actions during this session will be flagged as HIGH RISK.\n\n` +
      `Are you absolutely sure?`
    )

    if (secondConfirmed) {
      setIntervention({ isActive: true, reason, category, activatedAt: new Date().toISOString(), isEmergency: true })
      setCurrentSession((prev) => prev ? {
        ...prev, mode: 'Intervention', category, reason, riskLevel: 'Critical', isEmergency: true, actionsCount: prev.actionsCount,
      } : null)
      logTimeline('Emergency Activated', category, 'critical')
      return true
    }
    return false
  }, [logTimeline])

  // --- Exit Intervention ---
  const exitIntervention = useCallback(() => {
    setIntervention((prev) => ({ ...prev, isActive: false, reason: null, category: null, activatedAt: null, isEmergency: false }))
  }, [])

  // --- Section 8: Finish Intervention ---
  const finishIntervention = useCallback(() => {
    setIntervention((prev) => ({ ...prev, isActive: false, reason: null, category: null, activatedAt: null, isEmergency: false }))
    setCurrentSession((prev) => prev ? {
      ...prev, endTime: new Date().toISOString(), status: 'Completed', actionsCount: prev.actionsCount + 1,
    } : null)
    logTimeline('Session Closed', 'Platform Intervention completed')
    navigate('/platform/organizations')
  }, [navigate, logTimeline])

  // --- Section 8: Cancel Pending Changes (mock) ---
  const cancelPendingChanges = useCallback(() => {
    window.alert('Pending changes cancelled. No modifications were applied.')
    logTimeline('Session Closed', 'Pending changes cancelled', 'warning')
  }, [logTimeline])

  // --- Section 8: Return to Inspection ---
  const returnToInspection = useCallback(() => {
    setIntervention({ isActive: false, reason: null, category: null, activatedAt: null, isEmergency: false })
    setCurrentSession((prev) => prev ? { ...prev, mode: 'Inspection', riskLevel: 'Low' } : null)
    logTimeline('Session Closed', 'Returned to Inspection mode')
  }, [logTimeline])

  // --- Intervention Logging ---
  const logIntervention = useCallback((action: Omit<InterventionLogEntry, 'id' | 'timestamp' | 'platformOwner'>) => {
    const entry: InterventionLogEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      platformOwner: 'Platform Owner',
      ...action,
    }
    setInterventionLogs((prev) => [entry, ...prev])
    setCurrentSession((prev) => prev ? { ...prev, actionsCount: prev.actionsCount + 1 } : null)
  }, [])

  // --- Section 11: Toggle Notifications ---
  const toggleNotifications = useCallback((enabled: boolean) => {
    setNotificationSetting({ enabled })
  }, [])

  // --- Section 18: Generate Report (mock) ---
  const generateReport = useCallback((type: GovernanceReportType) => {
    window.alert(`📄 ${type} report generated.\n\nIn a production environment, this would download as PDF/CSV/JSON.`)
    logTimeline('Report Exported', type, 'info')
  }, [logTimeline])

  // --- Close Session (Section 12) ---
  const closeSession = useCallback(() => {
    if (currentSession) {
      setCurrentSession((prev) => prev ? {
        ...prev, endTime: new Date().toISOString(), status: 'Completed', duration: getDuration(prev.startTime),
      } : null)
      logTimeline('Session Closed', currentSession.organizationName)
    }
    setInspection({ isActive: false, organizationId: null, organizationName: null })
    setIntervention({ isActive: false, reason: null, category: null, activatedAt: null, isEmergency: false })
    navigate('/platform/organizations')
  }, [currentSession, navigate, logTimeline, getDuration])

  return (
    <PlatformGovernanceContext.Provider value={{
      inspection,
      intervention,
      currentSession,
      timeline,
      interventionLogs,
      notificationSetting,
      enterInspection,
      exitInspection,
      requestIntervention,
      exitIntervention,
      requestEmergencyIntervention,
      finishIntervention,
      cancelPendingChanges,
      returnToInspection,
      logTimeline,
      logIntervention,
      toggleNotifications,
      hasPermission,
      currentRole,
      setCurrentRole,
      generateReport,
      closeSession,
      getDuration,
    }}>
      {children}
    </PlatformGovernanceContext.Provider>
  )
}

export function usePlatformGovernance() {
  const ctx = useContext(PlatformGovernanceContext)
  if (!ctx) throw new Error('usePlatformGovernance must be used within PlatformGovernanceProvider')
  return ctx
}
