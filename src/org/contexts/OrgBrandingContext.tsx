import { createContext, useContext, useEffect, useState, useMemo, useRef, type ReactNode } from 'react'
import type { OrgBrandingConfig, OrgUser } from '../types'
import { useAuth } from '../../hooks/useAuth'
import { getApiClient, unwrapPayload } from '../../lib/api-client'
import { API } from '../../constants/api'

const BRANDING_CACHE_PREFIX = 'orivis-org-branding:'
const LEGACY_BRANDING_KEY_PREFIX = 'orivis:org-branding:'

export interface BrandingCacheEntry {
  organizationId: string
  version: string | null
  branding: Partial<OrgBrandingConfig>
}

export type OrgBrandingStatus = 'loading' | 'ready' | 'cached' | 'error'

export function readBrandingCache(orgId: string): BrandingCacheEntry | null {
  try {
    const raw = window.localStorage.getItem(`${BRANDING_CACHE_PREFIX}${orgId}`)
    if (raw) {
      const parsed = JSON.parse(raw) as BrandingCacheEntry
      if (parsed && typeof parsed === 'object' && parsed.branding && typeof parsed.branding === 'object') {
        return parsed
      }
    }
    const legacyRaw = window.localStorage.getItem(`${LEGACY_BRANDING_KEY_PREFIX}${orgId}`)
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as Partial<OrgBrandingConfig>
      if (legacy && typeof legacy === 'object') {
        return { organizationId: orgId, version: null, branding: legacy }
      }
    }
    return null
  } catch (err) {
    console.error('OrgBranding.readBrandingCache:', err)
    return null
  }
}

export function writeBrandingCache(orgId: string, branding: Partial<OrgBrandingConfig>, meta: { version?: string | null } = {}): void {
  try {
    const entry: BrandingCacheEntry = { organizationId: orgId, version: meta.version ?? null, branding }
    window.localStorage.setItem(`${BRANDING_CACHE_PREFIX}${orgId}`, JSON.stringify(entry))
  } catch (err) {
    console.error('OrgBranding.writeBrandingCache:', err)
    return
  }
}

interface OrgBrandingContextType {
  branding: OrgBrandingConfig
  admin: OrgUser
  isLoaded: boolean
  status: OrgBrandingStatus
  retry: () => void
  updateBranding: (config: Partial<OrgBrandingConfig>) => void
  assistedEventsEnabled: boolean
}

const OrgBrandingContext = createContext<OrgBrandingContextType | null>(null)

const DEFAULT_BRANDING: OrgBrandingConfig = {
  organizationName: 'Organization',
  workspaceName: 'Event Management Console',
  shortName: 'Org',
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#FCA311',
  secondaryColor: '#14213D',
  accentColor: '#00A8CC',
  browserTitle: 'ORIVIS',
  workspaceTitle: 'Event Management Console',
  tagline: '',
  eventPackage: 'Enterprise — Annual',
  organizationType: 'ORGANIZATION',
  organizationContext: '',
  electionCategories: [],
  organizationStatus: 'active',
}

function setFavicon(url: string | null, primaryColor: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  if (url) {
    link.href = url
    link.type = url.endsWith('.svg') ? 'image/svg+xml' : url.endsWith('.ico') ? 'image/x-icon' : 'image/png'
    return
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${primaryColor}"/><text x="16" y="22" text-anchor="middle" font-family="system-ui" font-weight="800" font-size="18" fill="white">O</text></svg>`
  link.type = 'image/svg+xml'
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function OrgBrandingProvider({ children }: { children: ReactNode }) {
  const { user, activeOrganization } = useAuth()
  const orgId = activeOrganization?.organizationId ?? null
  const [status, setStatus] = useState<OrgBrandingStatus>(() => (orgId && readBrandingCache(orgId) ? 'cached' : 'loading'))
  const [isLoaded, setIsLoaded] = useState<boolean>(() => (orgId ? !!readBrandingCache(orgId) : true))
  const [override, setOverride] = useState<Partial<OrgBrandingConfig> | null>(null)
  const [serverBranding, setServerBranding] = useState<Partial<OrgBrandingConfig> | null>(() => {
    if (!orgId) return null
    return readBrandingCache(orgId)?.branding ?? null
  })
  const [serverOrgType, setServerOrgType] = useState<string | null>(null)
  const [serverOrgContext, setServerOrgContext] = useState<string | null>(null)
  const [serverElectionCategories, setServerElectionCategories] = useState<string[]>([])
  const [serverOrgStatus, setServerOrgStatus] = useState<'active' | 'suspended' | 'closed' | null>(null)
  const [assistedEventsEnabled, setAssistedEventsEnabled] = useState<boolean>(false)
  const overrideRef = useRef<Partial<OrgBrandingConfig> | null>(null)
  const requestSeq = useRef(0)
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    if (!orgId) {
      setStatus('ready')
      setIsLoaded(true)
      return
    }
    const cached = readBrandingCache(orgId)
    const hasCache = !!cached
    setStatus(hasCache ? 'cached' : 'loading')
    setIsLoaded(hasCache)
    if (cached?.branding) setServerBranding(cached.branding)
    else setServerBranding(null)
    setServerOrgType(null)
    setServerOrgContext(null)
    setServerElectionCategories([])

    const seq = ++requestSeq.current
    let cancelled = false

    getApiClient().get(API.ENDPOINTS.ORGANIZATIONS.BY_ID(orgId))
      .then(({ data }) => {
        if (cancelled || seq !== requestSeq.current) return
        const profile = unwrapPayload<{
          organizationType?: string
          organizationContext?: string
          electionCategories?: string[]
          status?: string
          assisted_events_enabled?: boolean
        }>(data)
        if (profile?.organizationType) setServerOrgType(profile.organizationType.toUpperCase())
        if (profile?.organizationContext) setServerOrgContext(profile.organizationContext)
        if (Array.isArray(profile?.electionCategories)) setServerElectionCategories(profile.electionCategories)
        if (profile?.status) setServerOrgStatus(profile.status as 'active' | 'suspended' | 'closed')
        setAssistedEventsEnabled(!!profile?.assisted_events_enabled)
      })
      .catch((err) => { console.error('OrgBranding.fetchOrgProfile:', err) })

    getApiClient().get(API.ENDPOINTS.WORKSPACE.BRANDING)
      .then(({ data }) => {
        if (cancelled || seq !== requestSeq.current) return
        const fresh = unwrapPayload<Partial<OrgBrandingConfig> & { updatedAt?: string }>(data)
        if (fresh && typeof fresh === 'object') {
          setServerBranding(fresh)
          writeBrandingCache(orgId, fresh, { version: fresh.updatedAt ?? null })
        }
        setStatus(hasCache ? 'cached' : 'ready')
        setIsLoaded(true)
      })
      .catch((err) => {
        console.error('OrgBranding.fetchBranding:', err)
        if (cancelled || seq !== requestSeq.current) return
        if (!hasCache) {
          // Never leave the org shell stuck on the "Setting up your dashboard…"
          // overlay when branding is unavailable: fall back to default branding
          // and surface the error so the layout can show a retry banner.
          setStatus('error')
          setIsLoaded(true)
          setServerBranding(null)
        }
      })

    return () => { cancelled = true }
  }, [orgId, retryTick])

  const branding = useMemo<OrgBrandingConfig>(() => {
    const base: OrgBrandingConfig = { ...DEFAULT_BRANDING }
    if (serverOrgType) base.organizationType = serverOrgType
    if (serverOrgContext) base.organizationContext = serverOrgContext
    if (serverElectionCategories.length > 0) base.electionCategories = serverElectionCategories
    if (serverOrgStatus) base.organizationStatus = serverOrgStatus
    if (serverBranding?.organizationName) {
      const name = serverBranding.organizationName
      const shortName =
        serverBranding.shortName ||
        name.split(' ').slice(0, 2).join(' ').replace(/[.,]/g, '')
      const workspaceTitle = serverBranding.workspaceTitle || serverBranding.workspaceName || name
      base.organizationName = name
      base.shortName = shortName || name
      base.workspaceName = workspaceTitle
      base.workspaceTitle = workspaceTitle
      base.browserTitle = `${shortName || name} | ORIVIS`
    }
    if (serverBranding) {
      if (serverBranding.logoUrl) base.logoUrl = serverBranding.logoUrl
      if (serverBranding.faviconUrl) base.faviconUrl = serverBranding.faviconUrl
      if (serverBranding.primaryColor) base.primaryColor = serverBranding.primaryColor
      if (serverBranding.secondaryColor) base.secondaryColor = serverBranding.secondaryColor
      if (serverBranding.accentColor) base.accentColor = serverBranding.accentColor
      if (serverBranding.tagline) base.tagline = serverBranding.tagline
    }
    return override ? { ...base, ...override } : base
  }, [activeOrganization, serverBranding, serverOrgType, serverOrgContext, serverElectionCategories, override])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--org-primary', branding.primaryColor)
    root.style.setProperty('--org-secondary', branding.secondaryColor)
    root.style.setProperty('--org-accent', branding.accentColor)
    setFavicon(branding.faviconUrl, branding.primaryColor)
  }, [branding])

  const updateBranding = (config: Partial<OrgBrandingConfig>) => {
    const next = { ...(overrideRef.current ?? {}), ...config }
    overrideRef.current = next
    setOverride(next)
    if (orgId) writeBrandingCache(orgId, { ...serverBranding, ...next })
  }

  const retry = () => {
    setRetryTick((t) => t + 1)
  }

  const admin: OrgUser = {
    id: user?.id ?? 'unknown',
    displayName: user?.displayName ?? 'Administrator',
    email: user?.email ?? '',
    avatarUrl: user?.avatarUrl ?? null,
    role: activeOrganization?.role ?? 'ADMIN',
  }

  return (
    <OrgBrandingContext.Provider value={{ branding, admin, isLoaded, status, retry, updateBranding, assistedEventsEnabled }}>
      {children}
    </OrgBrandingContext.Provider>
  )
}

export function useOrgBranding() {
  const ctx = useContext(OrgBrandingContext)
  if (!ctx) throw new Error('useOrgBranding must be used within OrgBrandingProvider')
  return ctx
}
