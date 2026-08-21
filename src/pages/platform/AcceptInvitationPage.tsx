import { useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { Check, UserPlus, AlertTriangle, Loader2 } from "lucide-react"
import { API } from "../../constants/api"

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token") ?? ""

  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 max-w-md w-full text-center">
          <AlertTriangle size={32} className="text-status-error mx-auto mb-4" />
          <h1 className="text-sm font-bold text-brand-text-primary mb-2">Invalid Invitation Link</h1>
          <p className="text-xs text-brand-text-muted mb-6">This invitation link is invalid or missing a token. Please request a new invitation from your administrator.</p>
          <button
            onClick={() => navigate("/platformsignin")}
            className="px-4 py-2 bg-brand-gold text-brand-bg-secondary text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-brand-gold-hover transition-colors cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-brand-surface border border-brand-border rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-status-success/10 flex items-center justify-center mx-auto mb-4">
            <Check size={24} className="text-status-success" />
          </div>
          <h1 className="text-sm font-bold text-brand-text-primary mb-2">Account Created!</h1>
          <p className="text-xs text-brand-text-muted mb-6">Your account has been set up successfully. You can now sign in to the platform.</p>
          <button
            onClick={() => navigate("/platformsignin")}
            className="px-4 py-2 bg-brand-gold text-brand-bg-secondary text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-brand-gold-hover transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </motion.div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Please enter your full name.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API.BASE_URL}${API.ENDPOINTS.PLATFORM.INVITATION_ACCEPT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ token, name: name.trim(), password, password_confirmation: passwordConfirm }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Failed to accept invitation. Please try again.")
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-brand-surface border border-brand-border rounded-2xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus size={24} className="text-brand-gold" />
          </div>
          <h1 className="text-sm font-bold text-brand-text-primary mb-1">Join the ORIVIS Team</h1>
          <p className="text-xs text-brand-text-muted">Set up your account to get started</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-status-error/10 border border-status-error/20 flex items-center gap-2">
            <AlertTriangle size={14} className="text-status-error shrink-0" />
            <span className="text-xs text-status-error">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a password (min 8 characters)"
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
            />
          </div>
          <div>
            <label htmlFor="passwordConfirm" className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1.5">Confirm Password</label>
            <input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              placeholder="Confirm your password"
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {loading ? "Setting up..." : "Create Account & Join"}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
