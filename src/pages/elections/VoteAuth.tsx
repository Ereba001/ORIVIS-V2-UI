import { useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, Loader2, Shield, AlertCircle, CheckCircle, Clock, XCircle, Ban } from "lucide-react"
import TextureBg from "../../components/TextureBg"
import VotingPassInput from "../../components/VotingPassInput"
import { voterService } from "../../services/voter-service"
import SeoHead from "../../components/SeoHead"
import type { PassValidationResult } from "../../types/voting-pass"

type AuthState = "input" | "validating" | "valid" | "invalid" | "expired" | "used" | "revoked" | "error"

const STATUS_MESSAGES: Record<string, { title: string; description: string; icon: typeof AlertCircle }> = {
  expired: { title: "Pass Expired", description: "This voting pass has expired. Request a new one.", icon: Clock },
  used: { title: "Pass Already Used", description: "This pass has already been used. Each pass can only be used once.", icon: XCircle },
  revoked: { title: "Pass Revoked", description: "This voting pass has been revoked. Contact support for assistance.", icon: Ban },
  invalid: { title: "Invalid Pass", description: "The pass you entered is not valid. Check the pass and try again.", icon: AlertCircle },
}

export default function VoteAuth() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [groups, setGroups] = useState<string[]>(["", "", "", ""])
  const [authState, setAuthState] = useState<AuthState>("input")
  const [error, setError] = useState("")
  const [passResult, setPassResult] = useState<PassValidationResult | null>(null)

  const fullPass = groups.join("")

  const handleValidate = useCallback(async () => {
    if (fullPass.length < 16) { setError("Please enter a complete voting pass."); return }
    setAuthState("validating")
    setError("")
    try {
      const result = await voterService.validatePass(fullPass)
      setPassResult(result)
      if (result.valid && result.electionId === id && result.pass) {
        setAuthState("valid")
        setTimeout(() => navigate(`/elections/${id}/vote?pass=${fullPass}`), 1000)
      } else if (result.pass?.status === "EXPIRED") {
        setAuthState("expired")
      } else if (result.pass?.status === "USED") {
        setAuthState("used")
      } else if (result.pass?.status === "REVOKED") {
        setAuthState("revoked")
      } else {
        setAuthState("invalid")
      }
    } catch {
      setAuthState("error")
      setError("An error occurred while validating your pass. Please try again.")
    }
  }, [fullPass, id, navigate])

  const handleReset = useCallback(() => {
    setGroups(["", "", "", ""])
    setAuthState("input")
    setError("")
    setPassResult(null)
  }, [])

  const renderStatusCard = () => {
    if (authState === "valid") {
      return (
        <motion.div key="valid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-4">
          <CheckCircle size={40} className="text-status-success mx-auto" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Pass Validated!</h2>
            <p className="text-xs text-brand-text-muted mt-1">Redirecting to ballot...</p>
          </div>
          {passResult?.voter && (
            <div className="bg-brand-bg-secondary/50 border border-brand-border rounded-xl p-4 text-left space-y-2 max-w-sm mx-auto">
              <StatusDetail label="Name" value={passResult.voter.name} />
              <StatusDetail label="Email" value={passResult.voter.maskedEmail} />
              {passResult.voter.organization && <StatusDetail label="Organization" value={passResult.voter.organization} />}
            </div>
          )}
        </motion.div>
      )
    }

    const details = STATUS_MESSAGES[authState]
    if (!details) return null
    const Icon = details.icon

    return (
      <motion.div key={authState} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-4">
        <div className="w-14 h-14 rounded-full bg-status-error/10 flex items-center justify-center mx-auto">
          <Icon size={26} className="text-status-error" />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">{details.title}</h2>
          <p className="text-xs text-brand-text-muted mt-2 max-w-xs mx-auto">{details.description}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={handleReset} className="flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
            Try Again
          </button>
          <button onClick={() => navigate(`/elections/${id}/register`)} className="flex items-center justify-center gap-2 bg-brand-surface border border-brand-border hover:border-brand-gold/30 text-brand-text-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
            Get New Pass
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col pt-24"
    >
      <SeoHead meta={{ title: "Voter Authentication | ORIVIS", noindex: true }} />
      <div className="w-full bg-brand-surface py-12 border-b border-brand-border relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-2xl mx-auto px-6 relative z-10">
          <button onClick={() => navigate(`/elections/${id}`)} className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors mb-6 cursor-pointer">
            <ArrowLeft size={14} /> Back to Election
          </button>
          <h1 className="text-xl sm:text-2xl font-display font-bold uppercase text-brand-text-primary leading-tight">
            Enter Your Voting Pass
          </h1>
          <p className="text-xs text-brand-text-muted mt-2">
            Enter the pass you received to authenticate and proceed to the ballot.
          </p>
        </div>
      </div>

      <div className="w-full bg-brand-surface-elevated py-16 relative overflow-hidden flex-grow">
        <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-2xl mx-auto px-6 relative z-10">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-8">
            <AnimatePresence mode="wait">
              {authState === "input" || authState === "validating" || authState === "error" ? (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="flex items-center gap-3 justify-center mb-2">
                    <Shield size={20} className="text-brand-gold" />
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Authenticate to Vote</span>
                  </div>

                  <VotingPassInput value={groups} onChange={setGroups} disabled={authState === "validating"} />

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} role="alert" className="flex items-start gap-2 bg-status-error/10 border border-status-error/20 rounded-xl p-3">
                      <AlertCircle size={14} className="text-status-error shrink-0 mt-0.5" />
                      <p className="text-xs text-status-error">{error}</p>
                    </motion.div>
                  )}

                  <button
                    onClick={handleValidate}
                    disabled={authState === "validating" || fullPass.length < 16}
                    className="w-full flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-hover disabled:opacity-50 text-brand-bg-secondary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {authState === "validating" ? <Loader2 size={14} className="animate-spin" /> : null}
                    <span>{authState === "validating" ? "Validating..." : "Authenticate"}</span>
                  </button>

                  <p className="text-[10px] text-brand-text-muted text-center">
                    Don't have a pass? <button onClick={() => navigate(`/elections/${id}/register`)} className="text-brand-gold hover:underline cursor-pointer">Get one here</button>
                  </p>
                </motion.div>
              ) : (
                renderStatusCard()
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.main>
  )
}

function StatusDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-0.5">{label}</span>
      <span className="text-xs font-semibold text-brand-text-primary">{value}</span>
    </div>
  )
}
