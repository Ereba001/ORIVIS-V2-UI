import { useEffect } from 'react'
import type { Election, ElectionBranding } from '../types/election'

interface AppliedBranding {
  branding: ElectionBranding | undefined
  isLoaded: boolean
  displayName: string
  displayTagline: string
}

/**
 * Applies a public election's branding payload to `--org-*` CSS variables so
 * the voter console inherits the organization's identity without any admin
 * session. Safe to call from any `/elections/*` page.
 */
export function useElectionBranding(election: Election | null | undefined): AppliedBranding {
  const branding = election?.branding

  useEffect(() => {
    if (!branding) {
      document.documentElement.style.removeProperty('--org-primary')
      document.documentElement.style.removeProperty('--org-secondary')
      document.documentElement.style.removeProperty('--org-accent')
      return
    }
    const root = document.documentElement
    if (branding.primaryColor) root.style.setProperty('--org-primary', branding.primaryColor)
    if (branding.secondaryColor) root.style.setProperty('--org-secondary', branding.secondaryColor)
    if (branding.accentColor) root.style.setProperty('--org-accent', branding.accentColor)
    return () => {
      root.style.removeProperty('--org-primary')
      root.style.removeProperty('--org-secondary')
      root.style.removeProperty('--org-accent')
    }
  }, [branding])

  const name = branding?.shortName || branding?.organizationName || election?.organizationName || 'ORIVIS'
  return {
    branding,
    isLoaded: !!election,
    displayName: name,
    displayTagline: branding?.tagline || 'Powering Trusted Decisions',
  }
}