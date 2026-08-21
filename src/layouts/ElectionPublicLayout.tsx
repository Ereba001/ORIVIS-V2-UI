import { createContext, useContext, useState, useEffect, useMemo } from "react"
import { Outlet, useParams, useLocation, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { electionService } from "../services/election-service"
import { useElectionBranding } from "../hooks/useElectionBranding"
import { usePolling } from "../hooks/usePolling"
import { useAuth } from "../hooks/useAuth"
import type { Election } from "../types/election"

interface ElectionPublicContextType {
  election: Election | null
  loading: boolean
}

const ElectionPublicContext = createContext<ElectionPublicContextType>({
  election: null,
  loading: true,
})

export function useElectionPublic(): ElectionPublicContextType {
  return useContext(ElectionPublicContext)
}

function readOrgTheme(): 'dark' | 'light' {
  const s = window.localStorage.getItem('orivis-org-theme')
  return s === 'light' ? 'light' : 'dark'
}

function orgInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
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

export default function ElectionPublicLayout() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const { user } = useAuth()
  const [election, setElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(true)
  const [orgTheme, setOrgTheme] = useState<'dark' | 'light'>(() => readOrgTheme())

  const branding = useElectionBranding(election)
  const isBare = location.pathname.replace(/\/+$/, "") === `/elections/${id}`

  useEffect(() => {
    if (!id) { setLoading(false); return }
    let cancelled = false
    async function load() {
      try {
        const data = await electionService.getPublicElection(id!)
        if (!cancelled) setElection(data)
      } catch {
        if (!cancelled) setElection(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  // Refresh the authoritative election state so the landing page / console
  // react to scheduled lifecycle transitions without a manual reload.
  usePolling(async () => {
    if (!id) return
    const data = await electionService.getPublicElection(id)
    if (data) setElection(data)
  }, 20000, Boolean(id))

  useEffect(() => {
    if (!election) return
    const theme = election.branding?.themeMode === 'light' ? 'light' : 'dark'
    setOrgTheme(theme)
    setFavicon(election.branding?.faviconUrl ?? election.branding?.logoUrl ?? null, election.branding?.primaryColor ?? '#6366f1')
  }, [election])

  const displayName = branding.displayName
  const logoUrl = election?.branding?.logoUrl ?? null
  const primaryColor = election?.branding?.primaryColor ?? '#6366f1'

  const contextValue = useMemo<ElectionPublicContextType>(
    () => ({ election, loading }),
    [election, loading],
  )

  return (
    <ElectionPublicContext.Provider value={contextValue}>
      <div className="org-shell min-h-screen bg-brand-bg flex flex-col font-sans antialiased" data-org-theme={orgTheme}>
        {!isBare && (
        <header className="w-full border-b border-brand-border bg-brand-surface/80 backdrop-blur">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <Link
              to="/governance"
              className="flex items-center gap-3 min-w-0"
            >
              {logoUrl ? (
                <img src={logoUrl} alt={displayName} className="h-10 w-auto rounded-lg object-contain" />
              ) : (
                <span
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {orgInitials(displayName)}
                </span>
              )}
              <span className="min-w-0">
                <span className="block text-sm font-bold tracking-tight text-brand-text-primary truncate">
                  {displayName}
                </span>
                <span className="block text-[10px] font-mono uppercase tracking-widest text-brand-text-muted truncate">
                  {branding.displayTagline}
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-3 flex-shrink-0">
              {user && (
                <Link to="/account" className="flex items-center gap-2.5 group" title={user.displayName}>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="h-8 w-8 rounded-full object-cover ring-2 ring-brand-border group-hover:ring-[var(--org-primary)] transition-all" />
                  ) : (
                    <span
                      className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white group-hover:brightness-110 transition-all"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {orgInitials(user.displayName)}
                    </span>
                  )}
                  <span className="hidden sm:block text-xs font-semibold text-brand-text-secondary group-hover:text-brand-text-primary transition-colors">
                    {user.displayName}
                  </span>
                </Link>
              )}
              <button
                onClick={() => window.history.length > 1 ? window.history.back() : undefined}
                className="inline-flex items-center gap-2 text-brand-text-muted hover:text-brand-text-primary text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          </div>
        </header>
        )}

        <main className="flex-grow flex flex-col w-full">
          <Outlet key={location.pathname} />
        </main>

        {!isBare && (
        <footer className="w-full border-t border-brand-border py-5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <span className="text-[10px] uppercase tracking-widest text-brand-text-muted">
              Powered by <span className="text-brand-text-primary font-bold">ORIVIS</span>
            </span>
          </div>
        </footer>
        )}
      </div>
    </ElectionPublicContext.Provider>
  )
}