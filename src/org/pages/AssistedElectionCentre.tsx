import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search, Loader2, AlertCircle, X, Users, ClipboardCheck,
  Vote, Key, Activity, Clock, RefreshCw,
  ChevronLeft, ChevronRight as ChevronRightIcon, SearchX,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import {
  assistedElectionService,
  type GlobalParticipant,
  type ParticipantContextResult,
  type AssistedActivity,
} from '../services/assisted-election-service'
import ParticipantSearchResult from '../components/aec/ParticipantSearchResult'
import ElectionContextCard from '../components/aec/ElectionContextCard'
import ActionPanel from '../components/aec/ActionPanel'
import ParticipantHeader from '../components/aec/ParticipantHeader'
import AssistedConfirmModal from '../components/aec/AssistedConfirmModal'
import ActionSuccessModal from '../components/aec/ActionSuccessModal'
import AssistedAuditModal from '../components/aec/AssistedAuditModal'
import OperationProgressModal, { type OperationState } from '../components/OperationProgressModal'
import EmptyState from '../components/EmptyState'

type WorkflowView = 'search' | 'results' | 'participant' | 'action' | 'confirming' | 'processing' | 'success' | 'error'

const ACTION_LABELS: Record<string, string> = {
  register: 'Register participant',
  send_otp: 'Send verification code',
  verify_otp: 'Verify code',
  issue_pass: 'Issue voting pass',
  reissue_pass: 'Reissue voting pass',
  start_session: 'Start voting session',
  cast_vote: 'Cast vote',
  print_receipt: 'Print receipt',
}

export default function AssistedElectionCentre() {
  const { branding } = useOrgBranding()

  const [view, setView] = useState<WorkflowView>('search')

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [participants, setParticipants] = useState<GlobalParticipant[]>([])
  const [paginationMeta, setPaginationMeta] = useState<{ current_page: number; last_page: number; per_page: number; total: number } | null>(null)
  const [searching, setSearching] = useState(false)

  const [selectedParticipant, setSelectedParticipant] = useState<GlobalParticipant | null>(null)
  const [participantContext, setParticipantContext] = useState<ParticipantContextResult | null>(null)
  const [loadingContext, setLoadingContext] = useState(false)

  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null)
  const [selectedElectionTitle, setSelectedElectionTitle] = useState('')

  const [currentAction, setCurrentAction] = useState<string | null>(null)

  const [operationState, setOperationState] = useState<OperationState>('idle')
  const [operationTitle, setOperationTitle] = useState('')
  const [operationSuccessTitle, setOperationSuccessTitle] = useState('')
  const [operationSuccessMessage, setOperationSuccessMessage] = useState('')
  const [operationErrorTitle, setOperationErrorTitle] = useState('')
  const [operationErrorMessage, setOperationErrorMessage] = useState('')

  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmDescription, setConfirmDescription] = useState('')
  const [confirmLoading, setConfirmLoading] = useState(false)

  const [successTitle, setSuccessTitle] = useState('Action Completed')
  const [successMessage, setSuccessMessage] = useState('')

  const [error, setError] = useState<string | null>(null)

  const [activity, setActivity] = useState<AssistedActivity[]>([])
  const [auditOpen, setAuditOpen] = useState(false)

  const [centerStats, setCenterStats] = useState<{ total_participants: number; total_elections: number; registered: number; verified: number; active_passes: number; voted: number } | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageRef = useRef(1)

  const PRIMARY = branding.primaryColor

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [stats, activityResult] = await Promise.all([
          assistedElectionService.getCenterStats(),
          assistedElectionService.getCenterActivity(20),
        ])
        if (!cancelled) {
          setCenterStats(stats)
          setActivity(activityResult.data ?? [])
        }
      } catch {
        // Stats and activity load failed silently
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!searchQuery.trim()) {
      setDebouncedQuery('')
      return
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim())
      pageRef.current = 1
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  const executeSearch = useCallback(async (query: string, _page?: number) => {
    if (!query) return
    setSearching(true)
    setError(null)
    try {
      const { data, meta } = await assistedElectionService.searchParticipantsGlobally(query, 10)
      setParticipants(data ?? [])
      setPaginationMeta(meta ?? null)
      setView('results')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Search failed'
      setError(msg)
      setView('error')
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debouncedQuery) {
      executeSearch(debouncedQuery)
    }
  }, [debouncedQuery, executeSearch])

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return
    pageRef.current = 1
    setDebouncedQuery(searchQuery.trim())
  }, [searchQuery])

  const goToPage = useCallback((page: number) => {
    pageRef.current = page
    if (debouncedQuery) executeSearch(debouncedQuery)
  }, [debouncedQuery, executeSearch])

  const selectParticipant = useCallback(async (p: GlobalParticipant) => {
    setSelectedParticipant(p)
    setView('participant')
    setLoadingContext(true)
    setError(null)
    try {
      const ctx = await assistedElectionService.getParticipantContext(p.uuid)
      setParticipantContext(ctx)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load participant context'
      setError(msg)
    } finally {
      setLoadingContext(false)
    }
  }, [])

  const selectElection = useCallback(async (electionId: number, title: string) => {
    setSelectedElectionId(electionId)
    setSelectedElectionTitle(title)
    setView('action')
    setError(null)
    if (selectedParticipant) {
      try {
        await assistedElectionService.logAccess(String(electionId))
      } catch { /* silent */ }
    }
  }, [selectedParticipant])

  const handleAction = useCallback((action: string) => {
    setCurrentAction(action)
    setConfirmTitle(ACTION_LABELS[action] ?? action)
    setConfirmDescription(
      `You are about to ${ACTION_LABELS[action]?.toLowerCase() ?? action} for ${selectedParticipant?.name} in ${selectedElectionTitle}. Do you want to proceed?`
    )
    setConfirmLoading(false)
    setView('confirming')
  }, [selectedParticipant, selectedElectionTitle])

  const executeAction = useCallback(async () => {
    if (!selectedParticipant || !selectedElectionId || !currentAction) return
    setConfirmLoading(true)
    try {
      const electionIdStr = String(selectedElectionId)

      switch (currentAction) {
        case 'register': {
          setView('processing')
          setOperationTitle('Registering participant...')
          setOperationState('processing')
          const regResult = await assistedElectionService.registerParticipant(electionIdStr, selectedParticipant.id)
          setParticipantContext(prev => {
            if (!prev) return prev
            return {
              ...prev,
              elections: prev.elections.map(e =>
                e.election_id === selectedElectionId
                  ? { ...e, registration_status: regResult.status }
                  : e
              ),
            }
          })
          setOperationState('success')
          setSuccessTitle('Registration Complete')
          setSuccessMessage(`${selectedParticipant.name} has been registered for ${selectedElectionTitle}.`)
          setView('success')
          break
        }
        case 'send_otp': {
          setView('processing')
          setOperationTitle('Sending verification code...')
          setOperationState('processing')
          const ctx = participantContext
          const election = ctx?.elections.find(e => e.election_id === selectedElectionId)
          const regUuid = election ? String(election.election_id) : ''
          await assistedElectionService.sendOtp(electionIdStr, regUuid)
          setOperationState('success')
          setSuccessTitle('Verification Code Sent')
          setSuccessMessage('A verification code has been sent to the participant\'s email.')
          setView('success')
          break
        }
        case 'verify_otp': {
          setConfirmLoading(false)
          setCurrentAction('verify_otp_pending')
          setConfirmTitle('Enter Verification Code')
          setConfirmDescription('Ask the participant for their verification code.')
          setView('confirming')
          return
        }
        case 'issue_pass': {
          setView('processing')
          setOperationTitle('Issuing voting pass...')
          setOperationState('processing')
          const ctx = participantContext
          const election = ctx?.elections.find(e => e.election_id === selectedElectionId)
          const regUuid = election ? String(election.election_id) : ''
          const passResult = await assistedElectionService.issuePass(electionIdStr, regUuid)
          setParticipantContext(prev => {
            if (!prev) return prev
            return {
              ...prev,
              elections: prev.elections.map(e =>
                e.election_id === selectedElectionId
                  ? { ...e, has_active_pass: true, allowed_actions: e.allowed_actions.filter(a => a !== 'issue_pass').concat(e.has_voted ? [] : ['start_session']) }
                  : e
              ),
            }
          })
          setOperationState('success')
          setSuccessTitle('Voting Pass Issued')
          setSuccessMessage(`Pass code: ${passResult.pass.code}`)
          setView('success')
          break
        }
        case 'reissue_pass': {
          setView('processing')
          setOperationTitle('Reissuing voting pass...')
          setOperationState('processing')
          const ctx = participantContext
          const election = ctx?.elections.find(e => e.election_id === selectedElectionId)
          const regUuid = election ? String(election.election_id) : ''
          const reissueResult = await assistedElectionService.reissuePass(electionIdStr, regUuid)
          setOperationState('success')
          setSuccessTitle('Voting Pass Reissued')
          setSuccessMessage(`New pass code: ${reissueResult.pass_code}`)
          setView('success')
          break
        }
        case 'start_session': {
          setView('processing')
          setOperationTitle('Starting voting session...')
          setOperationState('processing')
          const sessionResult = await assistedElectionService.startSession(electionIdStr, selectedParticipant.id)
          setOperationState('success')
          setSuccessTitle('Voting Session Started')
          setSuccessMessage(`Ballot loaded with ${sessionResult.ballot.positions.length} position${sessionResult.ballot.positions.length !== 1 ? 's' : ''}. The participant can now make their selections.`)
          setView('success')
          break
        }
        case 'cast_vote': {
          setView('processing')
          setOperationTitle('Casting vote...')
          setOperationState('processing')
          setOperationSuccessTitle('Vote Cast Successfully')
          setOperationSuccessMessage('The participant\'s vote has been recorded and encrypted.')
          setSuccessTitle('Vote Cast')
          setSuccessMessage('The participant\'s vote has been recorded and encrypted.')
          setView('success')
          break
        }
        case 'print_receipt': {
          window.print()
          setConfirmLoading(false)
          setView('action')
          return
        }
        default:
          setConfirmLoading(false)
          setView('action')
          return
      }

      if (selectedParticipant) {
        try {
          const refreshed = await assistedElectionService.getParticipantContext(selectedParticipant.uuid)
          setParticipantContext(refreshed)
        } catch { /* silent refresh */ }
      }
    } catch (err: unknown) {
      setConfirmLoading(false)
      const msg = err instanceof Error ? err.message : 'Action failed'
      setOperationState('error')
      setOperationErrorTitle('Action Failed')
      setOperationErrorMessage(msg)
      setView('error')
    }
  }, [selectedParticipant, selectedElectionId, currentAction, selectedElectionTitle, participantContext])

  const goToParticipant = useCallback(() => {
    setView('participant')
    setCurrentAction(null)
    setError(null)
  }, [])

  const goToElections = useCallback(() => {
    setView('participant')
    setSelectedElectionId(null)
    setSelectedElectionTitle('')
    setCurrentAction(null)
    setError(null)
  }, [])

  const goToSearch = useCallback(() => {
    setView('search')
    setSelectedParticipant(null)
    setParticipantContext(null)
    setSelectedElectionId(null)
    setSelectedElectionTitle('')
    setCurrentAction(null)
    setError(null)
    setParticipants([])
    setPaginationMeta(null)
    searchInputRef.current?.focus()
  }, [])

  const goToResults = useCallback(() => {
    setView('results')
    setSelectedParticipant(null)
    setParticipantContext(null)
    setSelectedElectionId(null)
    setSelectedElectionTitle('')
    setCurrentAction(null)
    setError(null)
  }, [])

  const handleSuccessClose = useCallback(() => {
    setView('action')
    setSuccessTitle('Action Completed')
    setSuccessMessage('')
  }, [])

  const handleSuccessAction = useCallback(() => {
    setView('action')
    setSuccessTitle('Action Completed')
    setSuccessMessage('')
  }, [])

  const handleErrorRetry = useCallback(() => {
    setView('action')
    setError(null)
  }, [])

  const filteredElections = useMemo(() => {
    if (!participantContext) return []
    return participantContext.elections.filter(e => {
      if (e.lifecycle_state === 'ended' || e.lifecycle_state === 'archived') return false
      return true
    })
  }, [participantContext])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-brand-text-primary">Assisted Election Centre</h1>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Search for a participant to assist them with elections, registration and voting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {centerStats && (
            <div className="hidden sm:flex items-center gap-3 text-[10px] text-brand-text-muted">
              <span className="flex items-center gap-1"><Users size={11} /> {centerStats.total_participants}</span>
              <span className="flex items-center gap-1"><Vote size={11} /> {centerStats.voted} voted</span>
            </div>
          )}
          <button
            onClick={() => setAuditOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border text-[10px] font-semibold text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-elevated transition-all cursor-pointer"
          >
            <Activity size={12} /> Audit Log
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center py-16 px-4"
          >
            <div className="w-full max-w-xl">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: `${PRIMARY}15`, color: PRIMARY }}
              >
                <Search size={24} />
              </div>
              <h2 className="text-base font-bold text-brand-text-primary text-center mb-1">Find a participant</h2>
              <p className="text-xs text-brand-text-muted text-center mb-6">
                Search by name, email, or voter ID across all elections.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by name, email, voter ID..."
                    className="w-full bg-brand-bg-secondary border border-brand-border rounded-xl pl-9 pr-3 py-3 text-sm text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(''); setDebouncedQuery(''); searchInputRef.current?.focus() }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="px-5 py-3 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {searching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={goToSearch}
                className="p-2 rounded-xl border border-brand-border hover:bg-brand-surface-elevated transition-colors cursor-pointer shrink-0"
              >
                <ChevronLeft size={14} className="text-brand-text-muted" />
              </button>
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by name, email, voter ID..."
                  className="w-full bg-brand-bg-secondary border border-brand-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setDebouncedQuery('') }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                style={{ backgroundColor: PRIMARY }}
              >
                {searching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
              </button>
            </div>

            {searching && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-brand-text-muted" />
              </div>
            )}

            {!searching && participants.length > 0 && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted">
                  {paginationMeta?.total ?? participants.length} participant{(paginationMeta?.total ?? participants.length) !== 1 ? 's' : ''} found
                </p>
                <div className="space-y-2">
                  {participants.map(p => (
                    <ParticipantSearchResult
                      key={p.id}
                      participant={p}
                      onSelect={selectParticipant}
                      primaryColor={PRIMARY}
                    />
                  ))}
                </div>
                {paginationMeta && paginationMeta.last_page > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => goToPage(paginationMeta.current_page - 1)}
                      disabled={paginationMeta.current_page <= 1}
                      className="p-2 rounded-lg border border-brand-border hover:bg-brand-surface-elevated transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={14} className="text-brand-text-muted" />
                    </button>
                    <span className="text-[10px] font-medium text-brand-text-muted">
                      Page {paginationMeta.current_page} of {paginationMeta.last_page}
                    </span>
                    <button
                      onClick={() => goToPage(paginationMeta.current_page + 1)}
                      disabled={paginationMeta.current_page >= paginationMeta.last_page}
                      className="p-2 rounded-lg border border-brand-border hover:bg-brand-surface-elevated transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon size={14} className="text-brand-text-muted" />
                    </button>
                  </div>
                )}
              </>
            )}

            {!searching && participants.length === 0 && (
              <EmptyState
                icon={SearchX}
                title="No participants found"
                description="No participant matched your search. Try a different name, email, or voter ID."
                action={{ label: 'Clear search', onClick: goToSearch }}
              />
            )}
          </motion.div>
        )}

        {view === 'participant' && selectedParticipant && (
          <motion.div
            key="participant"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <ParticipantHeader
              participant={selectedParticipant}
              onBack={goToResults}
              primaryColor={PRIMARY}
            />

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-600"
                >
                  <AlertCircle size={14} /> {error}
                  <button onClick={() => setError(null)} className="ml-auto cursor-pointer">
                    <X size={12} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {loadingContext ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-brand-text-muted" />
              </div>
            ) : participantContext ? (
              <>
                <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardCheck size={14} className="text-brand-text-muted" />
                    <h3 className="text-xs font-semibold text-brand-text-primary uppercase tracking-wider">Associated Elections</h3>
                  </div>
                  {filteredElections.length > 0 ? (
                    <div className="space-y-2">
                      {filteredElections.map(e => (
                        <ElectionContextCard
                          key={e.election_id}
                          election={e}
                          onSelectElection={(id) => selectElection(id, e.election_title)}
                          primaryColor={PRIMARY}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Vote}
                      title="No eligible elections"
                      description="This participant has no active or upcoming elections to assist with."
                    />
                  )}
                </div>

                {centerStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Total Participants', value: centerStats.total_participants, icon: Users },
                      { label: 'Active Passes', value: centerStats.active_passes, icon: Key },
                      { label: 'Voted', value: centerStats.voted, icon: Vote },
                    ].map(s => (
                      <div key={s.label} className="bg-brand-surface rounded-xl border border-brand-border p-3 flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${PRIMARY}15`, color: PRIMARY }}
                        >
                          <s.icon size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted">{s.label}</p>
                          <p className="text-lg font-bold text-brand-text-primary leading-tight">{s.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </motion.div>
        )}

        {view === 'action' && selectedParticipant && participantContext && (
          <motion.div
            key="action"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={goToElections}
                className="p-2 rounded-xl border border-brand-border hover:bg-brand-surface-elevated transition-colors cursor-pointer shrink-0"
              >
                <ChevronLeft size={14} className="text-brand-text-muted" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted">Assisting</p>
                <p className="text-sm font-bold text-brand-text-primary truncate">{selectedParticipant.name}</p>
              </div>
              <button
                onClick={goToSearch}
                className="text-[10px] font-semibold text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw size={11} /> New search
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-600"
                >
                  <AlertCircle size={14} /> {error}
                  <button onClick={() => setError(null)} className="ml-auto cursor-pointer">
                    <X size={12} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-brand-surface rounded-xl border border-brand-border p-4 space-y-3">
              {(() => {
                const election = participantContext.elections.find(e => e.election_id === selectedElectionId)
                if (!election) return null
                return (
                  <div className="bg-brand-bg-secondary/50 rounded-xl p-3 border border-brand-border">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-brand-text-primary">{selectedElectionTitle}</span>
                      <span className="text-[9px] text-brand-text-muted">({election.lifecycle_state})</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[9px] text-brand-text-muted">Status: {election.registration_status.replace(/_/g, ' ')}</span>
                      {election.has_voted && <span className="text-[9px] text-emerald-600 font-medium">Voted</span>}
                      {election.has_active_pass && <span className="text-[9px] text-blue-600 font-medium">Active pass</span>}
                    </div>
                  </div>
                )
              })()}
              <ActionPanel
                allowedActions={participantContext.elections.find(e => e.election_id === selectedElectionId)?.allowed_actions ?? []}
                blockedReasons={participantContext.elections.find(e => e.election_id === selectedElectionId)?.blocked_reasons ?? {}}
                onAction={handleAction}
                primaryColor={PRIMARY}
              />
            </div>
          </motion.div>
        )}

        {(view === 'confirming' || view === 'processing' || view === 'success' || view === 'error') && (
          <motion.div
            key="workflow-modal"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={goToParticipant}
                className="p-2 rounded-xl border border-brand-border hover:bg-brand-surface-elevated transition-colors cursor-pointer shrink-0"
              >
                <ChevronLeft size={14} className="text-brand-text-muted" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted">Assisting</p>
                <p className="text-sm font-bold text-brand-text-primary truncate">{selectedParticipant?.name}</p>
              </div>
              <span className="text-[10px] text-brand-text-muted truncate">{selectedElectionTitle}</span>
            </div>

            <EmptyState
              icon={Loader2}
              title={view === 'processing' ? 'Processing...' : view === 'confirming' ? 'Confirm action' : view === 'success' ? 'Done' : 'Error'}
              description={view === 'processing' ? 'Please wait while the action is being processed.' : view === 'confirming' ? 'Review the action before proceeding.' : view === 'success' ? successMessage : error ?? 'An error occurred.'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {view !== 'search' && view !== 'results' && activity.length > 0 && (
        <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-divider flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-brand-text-muted" />
              <h3 className="text-xs font-semibold text-brand-text-primary">Recent Activity</h3>
            </div>
            <button
              onClick={() => setAuditOpen(true)}
              className="text-[10px] font-semibold text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-brand-divider">
            {activity.slice(0, 5).map(a => (
              <div key={a.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-brand-text-primary truncate">{a.description}</p>
                  <p className="text-[10px] text-brand-text-muted">{a.actor}</p>
                </div>
                <span className="text-[10px] text-brand-text-muted shrink-0 flex items-center gap-1">
                  <Clock size={10} />
                  {a.created_at ? new Date(a.created_at).toLocaleTimeString() : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <AssistedConfirmModal
        open={view === 'confirming'}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLoading ? 'Processing...' : 'Confirm'}
        onConfirm={executeAction}
        onCancel={() => {
          setConfirmLoading(false)
          setView('action')
          setCurrentAction(null)
        }}
        loading={confirmLoading}
        brandColor={PRIMARY}
      />

      <OperationProgressModal
        open={view === 'processing'}
        state={operationState}
        title={operationTitle}
        stages={[operationTitle]}
        currentStage={0}
        successTitle={operationSuccessTitle || 'Completed'}
        successMessage={operationSuccessMessage || 'Done'}
        errorTitle={operationErrorTitle}
        errorMessage={operationErrorMessage}
        successActionLabel="Continue"
        errorActionLabel="Retry"
        onSuccessAction={handleSuccessClose}
        onErrorAction={handleErrorRetry}
        onClose={handleSuccessClose}
        brandColor={PRIMARY}
      />

      <ActionSuccessModal
        open={view === 'success'}
        title={successTitle}
        message={successMessage}
        actionLabel="Continue"
        onAction={handleSuccessAction}
        onClose={handleSuccessClose}
        brandColor={PRIMARY}
      />

      {view === 'error' && !operationState && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={goToParticipant}
              className="p-2 rounded-xl border border-brand-border hover:bg-brand-surface-elevated transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft size={14} className="text-brand-text-muted" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-brand-text-primary">Something went wrong</p>
            </div>
          </div>
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <p className="text-sm font-semibold text-brand-text-primary mb-1">{error || 'An unexpected error occurred'}</p>
            <p className="text-xs text-brand-text-muted mb-4">Please try again or contact support if the problem persists.</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={goToParticipant}
                className="px-4 py-2 rounded-xl border border-brand-border text-xs font-medium text-brand-text-secondary hover:bg-brand-surface-elevated transition-colors cursor-pointer"
              >
                Go back
              </button>
              <button
                onClick={handleErrorRetry}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-opacity cursor-pointer"
                style={{ backgroundColor: PRIMARY }}
              >
                Retry
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <AssistedAuditModal
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        events={activity}
        brandColor={PRIMARY}
      />
    </div>
  )
}
