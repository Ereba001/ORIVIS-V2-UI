import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react'
import type { OrgBrandingConfig, OrgUser } from '../types'
import { useAuth } from '../../hooks/useAuth'
import { getApiClient } from '../../lib/api-client'
import { API } from '../../constants/api'

interface OrgBrandingContextType {
  branding: OrgBrandingConfig
  admin: OrgUser
  isLoaded: boolean
  updateBranding: (config: Partial<OrgBrandingConfig>) => void
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
  tagline: 'Powering Trusted Decisions',
  eventPackage: 'Enterprise — Annual',
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
    return
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${primaryColor}"/><text x="16" y="22" text-anchor="middle" font-family="system-ui" font-weight="800" font-size="18" fill="white">O</text></svg>`
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function OrgBrandingProvider({ children }: { children: ReactNode }) {
  const { user, activeOrganization } = useAuth()
  const [isLoaded, setIsLoaded] = useState(false)
  const [override, setOverride] = useState<Partial<OrgBrandingConfig> | null>(null)
  const [serverBranding, setServerBranding] = useState<Partial<OrgBrandingConfig> | null>(null)

  const orgId = activeOrganization?.organizationId

  useEffect(() => {
    if (!orgId) return
    let cancelled = false
    getApiClient().get(API.ENDPOINTS.ORGANIZATIONS.BRANDING(orgId))
      .then(({ data }) => {
        if (!cancelled && data) setServerBranding(data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [orgId])

  const branding = useMemo<OrgBrandingConfig>(() => {
    const base: OrgBrandingConfig = { ...DEFAULT_BRANDING }
    if (serverBranding?.organizationName) {
      const name = serverBranding.organizationName
      const shortName = name.split(' ').slice(0, 2).join(' ').replace(/[.,]/g, '')
      base.organizationName = name
      base.shortName = shortName || name
      base.browserTitle = `${shortName || name} | ORIVIS`
    }
    if (serverBranding) {
      if (serverBranding.logoUrl) base.logoUrl = serverBranding.logoUrl
      if (serverBranding.faviconUrl) base.faviconUrl = serverBranding.faviconUrl
      if (serverBranding.primaryColor) base.primaryColor = serverBranding.primaryColor
      if (serverBranding.secondaryColor) base.secondaryColor = serverBranding.secondaryColor
      if (serverBranding.accentColor) base.accentColor = serverBranding.accentColor
    }
    return override ? { ...base, ...override } : base
  }, [activeOrganization, serverBranding, override])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--org-primary', branding.primaryColor)
    root.style.setProperty('--org-secondary', branding.secondaryColor)
    root.style.setProperty('--org-accent', branding.accentColor)
    setFavicon(branding.faviconUrl, branding.primaryColor)
    setIsLoaded(true)
  }, [branding])

  const updateBranding = (config: Partial<OrgBrandingConfig>) => {
    setOverride((prev) => ({ ...prev, ...config }))
  }

  const admin: OrgUser = {
    id: user?.id ?? 'unknown',
    displayName: user?.displayName ?? 'Administrator',
    email: user?.email ?? '',
    avatarUrl: user?.avatarUrl ?? null,
    role: activeOrganization?.role ?? 'ADMIN',
  }

  return (
    <OrgBrandingContext.Provider value={{ branding, admin, isLoaded, updateBranding }}>
      {children}
    </OrgBrandingContext.Provider>
  )
}

export function useOrgBranding() {
  const ctx = useContext(OrgBrandingContext)
  if (!ctx) throw new Error('useOrgBranding must be used within OrgBrandingProvider')
  return ctx
}
