import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { CheckCircle2, Copy } from "lucide-react"
import TextureBg from "../components/TextureBg"
import type { OrganizeFormState } from "../types/organize"
import { getTierForPopulation } from "../constants/subscription"
import SeoHead from "../components/SeoHead"

interface AppData {
  appId: string
  form: OrganizeFormState
  deliveryEmail: string
  submittedAt: string
}

export default function ApplicationSubmitted() {
  const { appId } = useParams<{ appId: string }>()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [data, setData] = useState<AppData | null>(null)

  useEffect(() => {
    if (!appId) return
    const raw = localStorage.getItem(`orivis_app_${appId}`)
    if (raw) {
      try {
        setData(JSON.parse(raw))
      } catch { /* ignore */ }
    }
  }, [appId])

  const population = data ? parseInt(data.form.phase3.estimatedVoterPopulation, 10) || 0 : 0
  const tier = getTierForPopulation(population)
  const deliveryEmail = data?.deliveryEmail || ""

  const handleHome = () => {
    if (appId) localStorage.removeItem(`orivis_app_${appId}`)
    navigate("/")
  }

  return (
    <>
      <SeoHead meta={{ title: "Application Submitted | ORIVIS", noindex: true }} />
      <div className="w-full flex-grow flex items-center justify-center py-16 px-4 sm:px-6 bg-gradient-to-br from-brand-bg via-brand-bg-secondary to-brand-bg min-h-[calc(100vh-80px)] mt-20 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-[28px] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.4)] relative z-10 p-8 sm:p-10">
        <TextureBg
          src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop"
          opacity={0.12}
        />

        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="w-16 h-16 rounded-full bg-status-success/10 flex items-center justify-center mb-6"
          >
            <CheckCircle2 size={36} className="text-status-success" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="font-display font-bold text-2xl text-brand-text-primary uppercase mb-2">
              Application Submitted
            </h1>
            <p className="text-xs text-brand-text-muted max-w-sm mx-auto mb-6">
              Your application and payment are being processed. You'll receive a confirmation shortly.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-brand-surface border border-brand-border rounded-xl p-4 w-full mb-6 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider">
                Application ID
              </span>
              <button
                type="button"
                onClick={() => { if (appId) { navigator.clipboard.writeText(appId); setCopied(true); setTimeout(() => setCopied(false), 2000) } }}
                className="flex items-center gap-1 text-[10px] text-brand-gold hover:text-brand-gold-hover transition-colors cursor-pointer"
              >
                <Copy size={11} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-sm font-mono font-bold text-brand-text-primary mt-1 tracking-wide">
              {appId}
            </p>
            <p className="text-[9px] text-brand-text-muted mt-1">
              Use this ID to track your application status. Reference it when contacting support.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-brand-surface border border-brand-border rounded-xl p-5 w-full mb-6 text-left"
          >
            {deliveryEmail && (
              <div className="bg-brand-gold/5 border border-brand-gold/20 rounded-lg p-2.5 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-status-success shrink-0" />
                <p className="text-[10px] text-brand-text-secondary">
                  Credentials will be sent to <strong className="text-brand-text-primary">{deliveryEmail}</strong>
                </p>
              </div>
            )}
            <h4 className={`text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-3 ${deliveryEmail ? 'mt-3' : ''}`}>
              What happens next?
            </h4>
            <ol className="space-y-2.5">
              {[
                "Our team verifies your organization documents and details",
                "Orivis approves your application",
                "Payment is processed (if applicable)",
                "Admin console credentials are sent to your designated email",
                "Log in and configure your election from the admin console",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-brand-text-secondary">
                  <span className="w-5 h-5 rounded-full bg-brand-gold/10 text-brand-gold text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            onClick={handleHome}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-md transition-all cursor-pointer"
          >
            Back to Home
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-[10px] text-brand-text-muted mt-4"
          >
            Have any problems or mistakes?{" "}
            <Link to="/contact" className="text-brand-gold hover:text-brand-gold-hover underline underline-offset-2 transition-colors">
              Contact Orivis
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
    </>
  )
}
