import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { Calendar, Users, Shield, Smartphone, BookOpen } from "lucide-react"
import TextureBg from "../components/TextureBg"
import SeoHead from "../components/SeoHead"
import { electionService } from "../services/election-service"
import { usePolling } from "../hooks/usePolling"
import { softwareApplicationSchema, breadcrumbListSchema } from "../seo/schema"
import type { Election, ElectionStatus } from "../types/election"

function getDisplayStatus(status: ElectionStatus): { label: string; colorClass: string; cta: string } {
  switch (status) {
    case 'LIVE':
      return { label: 'LIVE', colorClass: 'text-status-success border-status-success bg-status-success/10', cta: 'Participate' }
    case 'PUBLISHED':
    case 'CREATED':
      return { label: 'UPCOMING', colorClass: 'text-brand-text-muted border-brand-text-disabled bg-brand-surface-interactive', cta: 'View' }
    case 'ENDED':
    case 'ARCHIVED':
    case 'CANCELLED':
      return { label: 'CLOSED', colorClass: 'text-brand-text-disabled border-brand-text-disabled bg-brand-surface-interactive', cta: 'View Results' }
    default:
      return { label: status, colorClass: 'text-brand-text-muted border-brand-text-disabled bg-brand-surface-interactive', cta: 'View' }
  }
}

function isParticipatable(status: ElectionStatus): boolean {
  return status === 'LIVE'
}

function isViewable(status: ElectionStatus): boolean {
  // Defense in depth: the public directory only ever renders elections the
  // backend public contract can return (published/live). Draft, created, and
  // archived states are never public and must not render even if the API
  // misbehaves.
  return status === 'PUBLISHED' || status === 'LIVE' || status === 'ENDED'
}

function displayType(type: string | undefined): string {
  switch (type) {
    case 'governance_election':
    case 'ELECTION':
      return 'Election'
    case 'award_competition':
      return 'Competition'
    case 'poll':
      return 'Poll'
    case 'survey':
      return 'Survey'
    case 'referendum':
      return 'Referendum'
    default:
      return type ?? 'Election'
  }
}

export default function Governance() {
  const navigate = useNavigate()
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  // The Governance Centre is a public directory: it must only ever show the
  // public listing (published or live elections), never the organization's
  // full list, which includes drafts and unpublished elections.
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const e = await electionService.getPublicElections()
        if (!cancelled) setElections(e)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error && err.message ? err.message : 'Failed to load elections.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Auto-refresh the list so statuses and registration counts reflect the
  // authoritative backend state as elections move through their lifecycle.
  usePolling(async () => {
    try {
      const e = await electionService.getPublicElections()
      setElections(e)
      setError(null)
    } catch { /* keep last list */ }
  }, 30000)

  return (
    <motion.main
      key="governance"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col pt-24"
    >
      <SeoHead jsonLd={[
        softwareApplicationSchema(),
        breadcrumbListSchema([
          { name: "Home", url: "/" },
          { name: "Governance Centre", url: "/governance" },
        ]),
      ]} />

      <div className="w-full bg-brand-surface py-16 sm:py-20 border-b border-brand-border relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col gap-5 relative z-10">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] uppercase text-brand-gold font-bold">Overview</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold uppercase text-brand-text-primary leading-[1.05]">
            Governance Centre
          </h1>
          <p className="text-xs sm:text-sm text-brand-text-muted max-w-xl mx-auto leading-relaxed uppercase tracking-wider">
            Browse elections, consultations, approvals, referendums, and surveys across your organization.
          </p>
        </div>
      </div>

      <div className="w-full bg-brand-surface-elevated py-20 sm:py-24 relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1773429492523-20d3d5df05b8?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-brand-gold border-t-transparent animate-spin" />
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p role="alert" className="text-xs text-status-error font-bold">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {elections.filter((e) => isViewable(e.status)).map((election, i) => {
                const ds = getDisplayStatus(election.status)
                return (
                  <motion.div
                    key={election.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="glass-card rounded-2xl flex flex-col overflow-hidden hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="p-5 sm:p-6 border-b border-brand-border flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-brand-gold mb-1.5">
                          {displayType(election.type)}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold uppercase tracking-tight text-brand-text-primary leading-snug">
                          {election.title}
                        </h3>
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border ${ds.colorClass}`}>
                        {ds.label}
                      </span>
                    </div>

                    <div className="p-5 sm:p-6 flex flex-col gap-3 flex-grow">
                      <div className="flex items-center gap-2.5 text-xs text-brand-text-muted">
                        <Calendar size={13} className="shrink-0 text-brand-text-disabled" />
                        <span><strong className="text-brand-text-secondary">Date:</strong> {election.startsAt ? new Date(election.startsAt).toLocaleDateString() : 'TBA'} — {election.endsAt ? new Date(election.endsAt).toLocaleDateString() : 'TBA'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-brand-text-muted">
                        <Users size={13} className="shrink-0 text-brand-text-disabled" />
                        <span><strong className="text-brand-text-secondary">Registered:</strong> {(election.totalRegistered ?? 0).toLocaleString()} participants</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-brand-text-muted">
                        <Shield size={13} className="shrink-0 text-brand-text-disabled" />
                        <span><strong className="text-brand-text-secondary">Organization:</strong> {election.organizationName ?? election.organizationId}</span>
                      </div>
                      <p className="text-xs text-brand-text-muted leading-relaxed mt-1">
                        {election.description}
                      </p>
                    </div>

                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 mt-auto">
                      <button
                        onClick={() => navigate(`/elections/${election.slug ?? election.id}`)}
                        className="w-full bg-brand-gold text-brand-bg-secondary text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:scale-102 active:scale-98 transition-all cursor-pointer"
                      >
                        {isParticipatable(election.status) ? "Participate" : ds.cta}
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="w-full bg-brand-surface py-20 sm:py-24 border-t border-brand-border relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <span className="text-[10px] font-mono tracking-widest uppercase text-brand-gold font-bold">Getting Started</span>
          <h2 className="text-xl sm:text-2xl font-display font-bold uppercase text-brand-text-primary mt-3 leading-[1.1]">
            Before You Participate
          </h2>
          <p className="text-xs text-brand-text-muted mt-2">
            Get ready in three quick steps.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-10">
            {[
              { icon: Shield, title: "Verify Your Identity", desc: "Enter your student/staff ID to get your voting pass." },
              { icon: Smartphone, title: "Get Your Voting Pass", desc: "Your pass will be sent to your email. Keep it safe." },
              { icon: BookOpen, title: "Cast Your Vote", desc: "On election day, use your pass to authenticate and vote." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card rounded-2xl p-6 sm:p-7 text-left flex flex-col gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
                  <item.icon size={18} className="text-brand-gold" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight text-brand-text-primary">{item.title}</h3>
                <p className="text-xs text-brand-text-muted leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

    </motion.main>
  )
}
