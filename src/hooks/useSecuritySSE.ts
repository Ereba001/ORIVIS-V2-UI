import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiClient } from '../lib/api-client'
import { API } from '../constants/api'
import type {
  SecurityDashboardSummary,
  SecurityRealtimeSummary,
  SecurityActivityGraph,
  SecurityEvent,
  SecurityAlert,
  SecurityIncident,
} from '../types/platform'

// ── Polling-based "real-time" hook ──────────────────────────────────────
// Since the backend uses a database queue (no Redis/SSE broker), we poll
// at short intervals. The connection status reflects whether polls succeed.

export type ConnectionStatus = 'LIVE' | 'RECONNECTING' | 'DEGRADED' | 'OFFLINE'

export interface SecuritySSEState {
  connectionStatus: ConnectionStatus
  lastEventAge: number | null
  dashboard: SecurityDashboardSummary | null
  realtime: SecurityRealtimeSummary | null
  activityGraph: SecurityActivityGraph | null
  events: SecurityEvent[]
  alerts: SecurityAlert[]
  incidents: SecurityIncident[]
  loading: boolean
  refresh: () => void
}

const POLL_INTERVALS = {
  dashboard: 15_000,
  realtime: 5_000,
  graph: 10_000,
  events: 8_000,
  alerts: 10_000,
  incidents: 15_000,
  health: 30_000,
} as const

function useInterval(fn: () => void | Promise<void>, ms: number, enabled = true) {
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      try { await fnRef.current() } catch { /* transient poll failure */ }
    }
    const id = window.setInterval(tick, ms)
    return () => { cancelled = true; window.clearInterval(id) }
  }, [ms, enabled])
}

export function useSecuritySSE(): SecuritySSEState {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('LIVE')
  const [lastEventAge, setLastEventAge] = useState<number | null>(null)
  const [dashboard, setDashboard] = useState<SecurityDashboardSummary | null>(null)
  const [realtime, setRealtime] = useState<SecurityRealtimeSummary | null>(null)
  const [activityGraph, setActivityGraph] = useState<SecurityActivityGraph | null>(null)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [incidents, setIncidents] = useState<SecurityIncident[]>([])
  const [loading, setLoading] = useState(true)

  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  // Dashboard
  useInterval(async () => {
    try {
      const { data } = await getApiClient().get(API.ENDPOINTS.PLATFORM.SECURITY_DASHBOARD)
      setDashboard(data)
      setConnectionStatus('LIVE')
    } catch {
      setConnectionStatus('RECONNECTING')
    }
  }, POLL_INTERVALS.dashboard)

  // Realtime summary
  useInterval(async () => {
    try {
      const { data } = await getApiClient().get(API.ENDPOINTS.PLATFORM.SECURITY_REALTIME, { params: { window: 60 } })
      setRealtime(data)
    } catch { /* transient */ }
  }, POLL_INTERVALS.realtime)

  // Activity graph
  useInterval(async () => {
    try {
      const { data } = await getApiClient().get(API.ENDPOINTS.PLATFORM.SECURITY_ACTIVITY_GRAPH, { params: { minutes: 60 } })
      setActivityGraph(data)
    } catch { /* transient */ }
  }, POLL_INTERVALS.graph)

  // Events
  useInterval(async () => {
    try {
      const { data } = await getApiClient().get(API.ENDPOINTS.PLATFORM.SECURITY_EVENTS, { params: { per_page: 30 } })
      setEvents(Array.isArray(data) ? data : [])
    } catch { /* transient */ }
  }, POLL_INTERVALS.events)

  // Alerts
  useInterval(async () => {
    try {
      const { data } = await getApiClient().get(API.ENDPOINTS.PLATFORM.SECURITY_ALERTS, { params: { per_page: 20 } })
      setAlerts(Array.isArray(data) ? data : [])
    } catch { /* transient */ }
  }, POLL_INTERVALS.alerts)

  // Incidents
  useInterval(async () => {
    try {
      const { data } = await getApiClient().get(API.ENDPOINTS.PLATFORM.SECURITY_INCIDENTS, { params: { per_page: 20 } })
      setIncidents(Array.isArray(data) ? data : [])
    } catch { /* transient */ }
  }, POLL_INTERVALS.incidents)

  // Telemetry health
  useInterval(async () => {
    try {
      const { data } = await getApiClient().get(API.ENDPOINTS.PLATFORM.SECURITY_TELEMETRY_HEALTH)
      setLastEventAge(data.last_event_age_seconds ?? null)
      if (data.status === 'OFFLINE') setConnectionStatus('OFFLINE')
      else if (data.status === 'DEGRADED') setConnectionStatus('DEGRADED')
      else if (data.status === 'LIVE') setConnectionStatus('LIVE')
    } catch {
      setConnectionStatus('OFFLINE')
    }
  }, POLL_INTERVALS.health)

  // Initial load
  useEffect(() => {
    let active = true
    const loadAll = async () => {
      setLoading(true)
      try {
        const [dashRes, rtRes, graphRes, evRes, alRes, incRes] = await Promise.allSettled([
          getApiClient().get(API.ENDPOINTS.PLATFORM.SECURITY_DASHBOARD),
          getApiClient().get(API.ENDPOINTS.PLATFORM.SECURITY_REALTIME, { params: { window: 60 } }),
          getApiClient().get(API.ENDPOINTS.PLATFORM.SECURITY_ACTIVITY_GRAPH, { params: { minutes: 60 } }),
          getApiClient().get(API.ENDPOINTS.PLATFORM.SECURITY_EVENTS, { params: { per_page: 30 } }),
          getApiClient().get(API.ENDPOINTS.PLATFORM.SECURITY_ALERTS, { params: { per_page: 20 } }),
          getApiClient().get(API.ENDPOINTS.PLATFORM.SECURITY_INCIDENTS, { params: { per_page: 20 } }),
        ])
        if (!active) return
        if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data)
        if (rtRes.status === 'fulfilled') setRealtime(rtRes.value.data)
        if (graphRes.status === 'fulfilled') setActivityGraph(graphRes.value.data)
        if (evRes.status === 'fulfilled') setEvents(Array.isArray(evRes.value.data) ? evRes.value.data : [])
        if (alRes.status === 'fulfilled') setAlerts(Array.isArray(alRes.value.data) ? alRes.value.data : [])
        if (incRes.status === 'fulfilled') setIncidents(Array.isArray(incRes.value.data) ? incRes.value.data : [])
      } catch { /* initial load failure — polling will retry */ }
      if (active) setLoading(false)
    }
    void loadAll()
    return () => { active = false }
  }, [tick])

  return {
    connectionStatus,
    lastEventAge,
    dashboard,
    realtime,
    activityGraph,
    events,
    alerts,
    incidents,
    loading,
    refresh,
  }
}
