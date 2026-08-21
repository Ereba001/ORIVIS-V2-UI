import { useState, useEffect, useCallback } from 'react'
import { platformService } from '../services/platform-service'
import type { WorkspaceSession } from '../types/platform'

interface UseWorkspaceSessionReturn {
  session: WorkspaceSession | null
  loading: boolean
  exitWorkspace: () => Promise<void>
  exiting: boolean
}

/**
 * Hook that checks for an active workspace impersonation session
 * for the current user. When active, returns the session details so
 * the layout can render the impersonation banner.
 *
 * The session is closed when the user clicks "Exit Workspace".
 * This hook does NOT open sessions — use the WorkspaceAccessDialog
 * on the organization detail page for that.
 */
export function useWorkspaceSession(): UseWorkspaceSessionReturn {
  const [session, setSession] = useState<WorkspaceSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [exiting, setExiting] = useState(false)

  // Check for active sessions on mount. We don't know which organization
  // the session is for, so we look at any pending workspace session from
  // the backend via the platform API. Since workspace sessions are
  // per-user, we can check the most recent active one.
  useEffect(() => {
    let cancelled = false

    const checkSession = async () => {
      try {
        // The backend stores active workspace sessions per user.
        // We need to find the active one. Since we don't have a "my sessions"
        // endpoint, we store the last accessed org in localStorage.
        const lastOrgId = localStorage.getItem('orivis-platform-workspace-org')
        if (!lastOrgId) {
          setLoading(false)
          return
        }

        const sessionData = await platformService.getWorkspaceSession(lastOrgId)
        if (!cancelled && sessionData) {
          setSession(sessionData)
        }
      } catch {
        // No active session or error — clear stale reference
        localStorage.removeItem('orivis-platform-workspace-org')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    checkSession()
    return () => { cancelled = true }
  }, [])

  const exitWorkspace = useCallback(async () => {
    if (!session) return
    setExiting(true)
    try {
      await platformService.closeWorkspaceSession(session.organizationId)
      setSession(null)
      localStorage.removeItem('orivis-platform-workspace-org')
    } finally {
      setExiting(false)
    }
  }, [session])

  return { session, loading, exitWorkspace, exiting }
}

/**
 * Helper to store the current workspace org for session tracking.
 * Call this when opening a workspace session.
 */
export function setWorkspaceOrg(orgId: string): void {
  localStorage.setItem('orivis-platform-workspace-org', orgId)
}

export function clearWorkspaceOrg(): void {
  localStorage.removeItem('orivis-platform-workspace-org')
}
