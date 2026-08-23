import { useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, Loader2, Shield, AlertCircle, CheckCircle, Ban } from "lucide-react"
import TextureBg from "../../components/TextureBg"
import VotingPassInput from "../../components/VotingPassInput"
import { voterService } from "../../services/voter-service"
import SeoHead from "../../components/SeoHead"

type AuthState = "input" | "validating" | "valid" | "expired" | "revoked" | "error"

const STATUS_MESSAGES: Record<string, { title: string; description: string; icon: typeof AlertCircle }> = {
  expired: { title: "Token Expired", description: "This voting token has expired. Request a new one from the organizer.", icon: Ban },
  revoked: { title: "Token Revoked", description: "This voting token has been revoked. Contact support for assistance.", icon: Ban },
  invalid: { title: "Invalid Token", description: "The voting token you entered is not valid. Check it and try again.", icon: AlertCircle },
}

export default function VoteAuth() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [token, setToken] = useState("")
  const [authState, setAuthState] = useState<AuthState>("input")
  const [error, setError] = useState("")

  const fullToken = token.trim()

  const handleValidate = useCallback(async () => {
    if (fullToken.length === 0) { setError("Please enter your voting token."); return }
    setAuthState("validating")
    setError("")
    try {
      await voterService.startSession(id!, fullToken)
      setAuthState("valid")
      // The raw token is never placed in the URL (no history/referrer/server-
      // log exposure). It travels to the booth via per-tab sessionStorage only.
      sessionStorage.setItem("orivis_vote_token", fullToken)
      setTimeout(() => navigate(`/elections/${id}/vote`), 1000)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to authenticate."
      if (/expired/i.test(message)) {
        setAuthState("expired")
      } else if (/revoked/i.test(message)) {
        setAuthState("revoked")
      } else {
        setAuthState("error")
        setError(message)
      }
    }
  }, [fullToken, id, navigate])

  const handleReset = useCallback(() => {
    setToken("")
    setAuthState("input")
    setError("")
  }, [])

  if (!id) {
    return <div className="text-center py-12 text-status-danger">Invalid election.</div>
  }

  const renderStatusCard = () => {
    if (authState === "valid") {
      return (
        <motion.div key="valid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-4">
          <CheckCircle size={40} className="text-status-success mx-auto" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Authenticated!</h2>
            <p className="text-xs text-brand-text-muted mt-1">Redirecting to ballot...</p>
          </div>
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
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-text-primary">{details.title}</h2>
          <p className="text-xs text-brand-text-muted mt-2 max-w-xs mx-auto">{error || details.description}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={handleReset} className="flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
            Try Again
          </button>
          <button onClick={() => navigate(`/elections/${id}`)} className="flex items-center justify-center gap-2 bg-brand-surface border border-brand-border hover:border-brand-gold/30 text-brand-text-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
            Back
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
            Enter Your Voting Token
          </h1>
          <p className="text-xs text-brand-text-muted mt-2">
            Enter the token issued to you by the election organizer to open your voting session.
          </p>
        </div>
      </div>

      <div className="w-full bg-brand-surface-elevated py-16 relative overflow-hidden flex-grow">
        <TextureBg src="https://images.unsplash.com/photo-1772775756679-71acf7a6a24e?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-2xl mx-auto px-6 relative z-10">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-8">
            <AnimatePresence mode="wait">
              {authState === "input" || authState === "validating" || authState === "error" ? (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="flex items-center gap-3 justify-center mb-2">
                    <Shield size={20} className="text-brand-gold" />
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Authenticate to Vote</span>
                  </div>

                  <VotingPassInput
                    value={token}
                    onChange={setToken}
                    disabled={authState === "validating"}
                    placeholder="Paste your voting token"
                  />

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} role="alert" className="flex items-start gap-2 bg-status-error/10 border border-status-error/20 rounded-xl p-3">
                      <AlertCircle size={14} className="text-status-error shrink-0 mt-0.5" />
                      <p className="text-xs text-status-error">{error}</p>
                    </motion.div>
                  )}

                  <button
                    onClick={handleValidate}
                    disabled={authState === "validating" || fullToken.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-hover disabled:opacity-50 text-brand-bg-secondary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {authState === "validating" ? <Loader2 size={14} className="animate-spin" /> : null}
                    <span>{authState === "validating" ? "Validating..." : "Authenticate"}</span>
                  </button>
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