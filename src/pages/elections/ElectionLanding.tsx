import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { motion } from "motion/react"
import {
  Calendar, Users, AlertCircle, Info, BarChart3,
} from "lucide-react"
import SeoHead from "../../components/SeoHead"
import CountdownTimer from "../../components/CountdownTimer"
import { electionService } from "../../services/election-service"
import { useElectionPublic } from "../../layouts/ElectionPublicLayout"
import { usePolling } from "../../hooks/usePolling"
import type { Election, ElectionStatus } from "../../types/election"
import type { ElectionRegistrationInfo } from "../../types/registration"

interface StatusPill {
  label: string
  sub: string
  color: string
  bg: string
}

function getStatusPill(status: ElectionStatus, regOpen: boolean): StatusPill {
  if (status === 'LIVE') {
    return { label: 'LIVE', sub: 'Voting is open', color: '#10b981', bg: 'rgba(16,185,129,0.1)' }
  }
  if (status === 'PUBLISHED' || status === 'CREATED') {
    return regOpen
      ? { label: 'OPEN FOR REGISTRATION', sub: 'Register to get your voting pass', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' }
      : { label: 'UPCOMING', sub: 'Registration not yet open', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
  }
  return { label: 'CLOSED', sub: 'Voting has ended', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' }
}

function orgInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

function formatDateRange(election: Election): string {
  if (!election.startsAt) return "Dates to be announced"
  const start = new Date(election.startsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  if (!election.endsAt) return start
  const end = new Date(election.endsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${start} — ${end}`
}

export default function ElectionLanding() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { election, loading } = useElectionPublic()
  const [regInfo, setRegInfo] = useState<ElectionRegistrationInfo | null>(null)

  const refreshRegInfo = async () => {
    if (!id) return
    try {
      const info = await electionService.getRegistrationInfo(id)
      setRegInfo(info)
    } catch {
      setRegInfo(null)
    }
  }

  useEffect(() => {
    let cancelled = false
    if (!id) return
    electionService.getRegistrationInfo(id)
      .then((info) => { if (!cancelled) setRegInfo(info) })
      .catch(() => { if (!cancelled) setRegInfo(null) })
    return () => { cancelled = true }
  }, [id])

  // Auto-refresh registration state so the landing page reacts to scheduled
  // registration open/close and the live registered count.
  usePolling(refreshRegInfo, 20000, Boolean(id))

  if (loading) {
    return (
      <div className="w-full flex-grow flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2" style={{ borderColor: "var(--org-primary)", borderTopColor: "transparent" }} />
          <span className="text-xs text-brand-text-muted font-mono animate-pulse">Loading election...</span>
        </div>
      </div>
    )
  }

  if (!election) {
    return (
      <div className="w-full flex-grow flex flex-col items-center justify-center px-6">
        <AlertCircle size={40} className="text-brand-text-disabled mb-4" />
        <h1 className="text-xl font-bold text-brand-text-primary mb-2">Election Not Found</h1>
        <p className="text-xs text-brand-text-muted mb-6">This election doesn't exist or has been removed.</p>
        <button onClick={() => navigate("/governance")} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-white" style={{ backgroundColor: "var(--org-primary)" }}>
          Back
        </button>
      </div>
    )
  }

  const primary = election.branding?.primaryColor || '#6366f1'
  const secondary = election.branding?.secondaryColor || '#8b5cf6'
  const isLive = election.status === 'LIVE'
  const isRegOpenState = election.status === 'PUBLISHED' || election.status === 'CREATED'
  const isClosed = election.status === 'ENDED' || election.status === 'ARCHIVED' || election.status === 'CANCELLED'
  const regOpen = Boolean(regInfo?.registrationEnabled) && Boolean(regInfo?.registrationOpen)
  const pill = getStatusPill(election.status, regOpen)
  const path = `/elections/${election.slug ?? election.id}`

  return (
    <motion.main
      key={`el-${id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-16"
      style={{ background: "radial-gradient(1200px 500px at 50% -10%, color-mix(in srgb, var(--org-primary, #6366f1) 14%, transparent), transparent)" }}
    >
      <SeoHead meta={{ title: `${election.title} | ORIVIS` }} />

      <div className="w-full max-w-2xl">
        <motion.div
          className="w-full rounded-3xl overflow-hidden border border-brand-border bg-brand-surface shadow-[var(--shadow-brand-lg)]"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <Banner election={election} primary={primary} secondary={secondary} />

          <div className="px-6 sm:px-9 py-7 sm:py-9">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                style={{ color: pill.color, backgroundColor: pill.bg }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pill.color }} />
                {pill.label}
              </span>
              <span className="text-[10px] font-mono text-brand-text-muted">{pill.sub}</span>
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-display font-bold text-brand-text-primary leading-tight">
              {election.title}
            </h1>

            {election.subtitle && (
              <p className="mt-1 text-sm font-semibold" style={{ color: primary }}>{election.subtitle}</p>
            )}

            {election.description && (
              <p className="mt-3 text-sm text-brand-text-secondary leading-relaxed max-w-xl">
                {election.description}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-brand-text-muted">
              <span className="flex items-center gap-1.5"><Calendar size={13} className="text-brand-text-disabled" />{formatDateRange(election)}</span>
              <span className="flex items-center gap-1.5"><Users size={13} className="text-brand-text-disabled" />{(election.totalRegistered ?? 0).toLocaleString()} registered</span>
            </div>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              {isLive && (
                <>
                  <MainCta onClick={() => navigate(`${path}/console`)} color={primary}>
                    Participate Now
                  </MainCta>
                  {regOpen && (
                    <SecondaryCta onClick={() => navigate(`${path}/register`)}>
                      Get a Voting Pass
                    </SecondaryCta>
                  )}
                </>
              )}

              {isRegOpenState && regOpen && (
                <>
                  <MainCta onClick={() => navigate(`${path}/register`)} color={primary}>
                    Register Now
                  </MainCta>
                </>
              )}

              {isRegOpenState && !regOpen && (
                <>
                  {regInfo?.registrationStatus === "closed" && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-brand-text-muted"><Info size={13} /> Registration is currently closed</span>
                  )}
                </>
              )}

              {isClosed && (
                <>
                  <MainCta href={`${path}/results`} color={primary}>
                    <BarChart3 size={15} /> View Results
                  </MainCta>
                </>
              )}
            </div>

            {isRegOpenState && !isLive && election.startsAt && (
              <div className="mt-6 pt-5 border-t border-brand-divider">
                <CountdownTimer targetDate={election.startsAt} label="Voting opens in" />
              </div>
            )}
            {regOpen && regInfo?.registrationEndsAt && (
              <div className="mt-6 pt-5 border-t border-brand-divider">
                <CountdownTimer targetDate={regInfo.registrationEndsAt} label="Registration closes in" />
              </div>
            )}
            {isLive && !regOpen && (
              <div className="mt-6 pt-5 border-t border-brand-divider">
                <span className="flex items-center gap-1.5 text-xs text-brand-text-muted"><Info size={13} /> Registration is closed</span>
              </div>
            )}
          </div>
        </motion.div>

        <p className="mt-6 text-center text-[10px] uppercase tracking-widest text-brand-text-muted">
          Powered by <span className="font-bold text-brand-text-primary">ORIVIS</span>
        </p>
      </div>
    </motion.main>
  )
}

function Banner({ election, primary, secondary }: { election: Election; primary: string; secondary: string }) {
  const name = election.branding?.shortName || election.branding?.organizationName || election.organizationName || 'ORIVIS'
  const logoUrl = election.branding?.logoUrl ?? null
  const hasBanner = Boolean(election.bannerUrl)

  return (
    <div className="relative h-44 sm:h-52 w-full overflow-hidden">
      {hasBanner ? (
        <img src={election.bannerUrl!} alt="" className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full"
          style={{ background: `linear-gradient(120deg, ${primary} 0%, ${secondary} 100%)` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/5" />

      <div className="absolute bottom-4 left-5 sm:left-7 flex items-center gap-3">
        <div className="rounded-xl overflow-hidden border-2 border-white/70 shadow-lg bg-white">
          {logoUrl ? (
            <img src={logoUrl} alt={name} className="h-11 w-11 sm:h-12 sm:w-12 object-contain p-1" />
          ) : (
            <span className="h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center text-sm font-extrabold text-white" style={{ backgroundColor: primary }}>
              {orgInitials(name)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-white/75">{name}</span>
          <span className="block text-white text-sm sm:text-base font-bold truncate max-w-[70vw] sm:max-w-md">
            {election.title}
          </span>
        </div>
      </div>
    </div>
  )
}

function MainCta({ href, onClick, color, children }: { href?: string; onClick?: () => void; color: string; children: React.ReactNode }) {
  const cls = "flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110 text-white cursor-pointer shadow-sm"
  if (href) {
    return <Link to={href} className={cls} style={{ backgroundColor: color }}>{children}</Link>
  }
  return <button onClick={onClick} className={cls} style={{ backgroundColor: color }}>{children}</button>
}

function SecondaryCta({ onClick, href, children }: { onClick?: () => void; href?: string; children: React.ReactNode }) {
  const cls = "flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-brand-border bg-brand-surface-elevated text-brand-text-primary hover:border-[var(--org-primary)]/40 cursor-pointer"
  if (href) {
    return <Link to={href} className={cls}>{children}</Link>
  }
  return <button onClick={onClick} className={cls}>{children}</button>
}
