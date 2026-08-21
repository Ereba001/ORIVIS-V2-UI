import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { platformService } from '../services/platform-service'
import { ROUTES } from '../constants/routes'
import type { WorkspaceSessionMode } from '../types/platform'
import { useAuth } from '../hooks/useAuth'

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
  target?: string
  severity?: TimelineSeverity
  type?: 'intervention' | 'inspection' | 'system'
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
  inspection: { isActive: boolean; organizationId: string | null; organizationName: string | null; mode: WorkspaceSessionMode }
  intervention: { isActive: boolean; reason: string | null; category: InterventionCategory | null; activatedAt: string | null; isEmergency: boolean }
  currentSession: GovernanceSession | null
  timeline: TimelineEntry[]
  interventionLogs: InterventionLogEntry[]
  notificationSetting: PlatformAccessNotificationSetting
  enterInspection: (organizationId: string, organizationName: string, mode?: WorkspaceSessionMode, options?: { reason?: string; category?: string; riskLevel?: string; isEmergency?: boolean }) => Promise<void>
  exitInspection: () => void
  requestIntervention: (reason: string, category: InterventionCategory) => Promise<boolean>
  exitIntervention: () => void
  requestEmergencyIntervention: (reason: string, category: InterventionCategory) => Promise<boolean>
  finishIntervention: () => void
  cancelPendingChanges: (sessionId: string) => Promise<void>
  returnToInspection: () => void
  logTimeline: (action: TimelineAction | string, target: string, severity?: TimelineSeverity) => void
  logIntervention: (action: Omit<InterventionLogEntry, 'id' | 'timestamp' | 'platformOwner'>) => void
  toggleNotifications: (enabled: boolean) => void
  hasPermission: (permission: GovernancePermission) => boolean
  currentRole: GovernanceRole
  setCurrentRole: (role: GovernanceRole) => void
  generateReport: (options?: { type?: string; dateFrom?: string; dateTo?: string }) => Promise<{ report_id: string; type: string; status: string; requested_at: string }>
  closeSession: () => void
  getDuration: (start: string) => string
}

const PlatformGovernanceContext = createContext<PlatformGovernanceContextType | null>(null)

function generateId(): string {
  return `gov-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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
  const { startImpersonation, stopImpersonation } = useAuth()

  // --- Inspection State ---
  const [inspection, setInspection] = useState<PlatformGovernanceContextType['inspection']>({
    isActive: false, organizationId: null, organizationName: null, mode: 'view_only',
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
  const enterInspection = useCallback(async (
    organizationId: string,
    organizationName: string,
    mode: WorkspaceSessionMode = 'view_only',
    options?: { reason?: string; category?: string; riskLevel?: string; isEmergency?: boolean },
  ) => {
    setInspection({ isActive: true, organizationId, organizationName, mode })

    try {
      await platformService.openWorkspaceSession(organizationId, mode, options)
    } catch (err) {
      setInspection({ isActive: false, organizationId: null, organizationName: null, mode: 'view_only' })
      console.warn('Failed to open workspace session:', err instanceof Error ? err.message : err)
      return
    }

    logTimeline('Entered Workspace', organizationName)

    if (mode === 'full_control') {
      // Real org workspace UI: impersonate the target org then enter it.
      startImpersonation(organizationId)
      navigate(ROUTES.ORG.DASHBOARD)
    } else {
      navigate(ROUTES.PLATFORM.WORKSPACE(organizationId))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, logTimeline, startImpersonation])

  // --- Exit Inspection (Section 3) ---
  const exitInspection = useCallback(async () => {
    if (inspection.organizationId) {
      try {
        await platformService.closeWorkspaceSession(inspection.organizationId)
      } catch (err) {
        console.error('PlatformGovernance.exitInspection.closeSession:', err)
        // Best-effort close; never block navigation on it.
      }
    }

    setInspection({ isActive: false, organizationId: null, organizationName: null, mode: 'view_only' })
    setIntervention({ isActive: false, reason: null, category: null, activatedAt: null, isEmergency: false })
    stopImpersonation()

    if (currentSession) {
      logTimeline('Exited Workspace', currentSession.organizationName)
      setTimeline((prev) => [...prev])
      setCurrentSession((prev) => prev ? { ...prev, endTime: new Date().toISOString(), status: 'Completed' } : null)
    }

    navigate('/platform/organizations')
  }, [inspection.organizationId, currentSession, navigate, logTimeline, stopImpersonation])

  // --- Section 4: Request Intervention ---
  const requestIntervention = useCallback(async (reason: string, category: InterventionCategory): Promise<boolean> => {
    setIntervention({ isActive: true, reason, category, activatedAt: new Date().toISOString(), isEmergency: false })
    setCurrentSession((prev) => prev ? {
      ...prev, mode: 'Intervention', category, reason, riskLevel: 'Medium', actionsCount: prev.actionsCount,
    } : null)
    logTimeline('Activated Intervention', category, 'warning')
    return true
  }, [logTimeline])

  // --- Section 15: Emergency Intervention ---
  const requestEmergencyIntervention = useCallback(async (reason: string, category: InterventionCategory): Promise<boolean> => {
    setIntervention({ isActive: true, reason, category, activatedAt: new Date().toISOString(), isEmergency: true })
    setCurrentSession((prev) => prev ? {
      ...prev, mode: 'Intervention', category, reason, riskLevel: 'Critical', isEmergency: true, actionsCount: prev.actionsCount,
    } : null)
    logTimeline('Emergency Activated', category, 'critical')
    return true
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

  const cancelPendingChanges = useCallback(async (sessionId: string) => {
    if (!platformService) {
      throw new Error('Platform service not available')
    }
    setTimeline((prev) => [...prev, {
      id: `tl-${Date.now()}-cancel-${sessionId}`,
      type: 'intervention' as const,
      action: 'Cancelling pending changes...',
      actor: 'platform',
      timestamp: new Date().toISOString(),
    }])
    
    try {
      await platformService.revertIntervention(sessionId)
      setTimeline((prev) => [...prev, {
        id: `tl-${Date.now()}-cancel-done-${sessionId}`,
        type: 'intervention' as const,
        action: 'Pending changes cancelled',
        actor: 'platform',
        timestamp: new Date().toISOString(),
      }])
    } catch (error) {
      setTimeline((prev) => [...prev, {
        id: `tl-${Date.now()}-cancel-fail-${sessionId}`,
        type: 'intervention' as const,
        action: 'Failed to cancel pending changes',
        actor: 'platform',
        timestamp: new Date().toISOString(),
      }])
      throw error
    }
  }, [])

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

  const generateReport = useCallback(async (options?: { type?: string; dateFrom?: string; dateTo?: string }) => {
    if (!platformService) {
      throw new Error('Platform service not available')
    }
    setTimeline((prev) => [...prev, {
      id: `tl-${Date.now()}-report-${Date.now()}`,
      type: 'intervention' as const,
      action: 'Generating report...',
      actor: 'platform',
      timestamp: new Date().toISOString(),
    }])
    
    try {
      const result = await platformService.generateReport(options)
      setTimeline((prev) => [...prev, {
        id: `tl-${Date.now()}-report-done-${Date.now()}`,
        type: 'intervention' as const,
        action: `Report ${result.type} queued (${result.status})`,
        actor: 'platform',
        timestamp: new Date().toISOString(),
      }])
      return result
    } catch (error) {
      setTimeline((prev) => [...prev, {
        id: `tl-${Date.now()}-report-fail-${Date.now()}`,
        type: 'intervention' as const,
        action: 'Failed to generate report',
        actor: 'platform',
        timestamp: new Date().toISOString(),
      }])
      throw error
    }
  }, [])

  // --- Close Session (Section 12) ---
  const closeSession = useCallback(() => {
    if (currentSession) {
      setCurrentSession((prev) => prev ? {
        ...prev, endTime: new Date().toISOString(), status: 'Completed', duration: getDuration(prev.startTime),
      } : null)
      logTimeline('Session Closed', currentSession.organizationName)
    }
    setInspection({ isActive: false, organizationId: null, organizationName: null, mode: 'view_only' })
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
