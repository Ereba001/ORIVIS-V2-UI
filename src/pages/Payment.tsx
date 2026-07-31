import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { useParams, useNavigate, Navigate } from "react-router-dom"
import { CreditCard, Lock, Shield, CheckCircle2, ArrowLeft } from "lucide-react"
import TextureBg from "../components/TextureBg"
import LoadingOverlay from "../components/LoadingOverlay"
import { getTierForPopulation } from "../constants/subscription"
import type { OrganizeFormState } from "../types/organize"
import SeoHead from "../components/SeoHead"

interface AppData {
  appId: string
  form: OrganizeFormState
  deliveryEmail: string
  submittedAt: string
}

export default function Payment() {
  const { appId } = useParams<{ appId: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<AppData | null>(null)
  const [showLoading, setShowLoading] = useState(false)

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
  const isFree = tier.id === "STARTER"
  const isCustom = tier.id === "CUSTOM"

  const handlePay = () => {
    if (!appId || !data) return
    setShowLoading(true)
    const updated = { ...data, paid: true }
    localStorage.setItem(`orivis_app_${appId}`, JSON.stringify(updated))
    setTimeout(() => {
      navigate(`/application-submitted/${appId}`)
    }, 1500)
  }

  if (!data) {
    return (
      <div className="w-full flex-grow flex items-center justify-center py-16 px-4 bg-brand-bg min-h-[calc(100vh-80px)] mt-20">
        <div className="text-center">
          <p className="text-sm text-brand-text-muted">Application data not found.</p>
          <button onClick={() => navigate("/organize")} className="mt-4 text-brand-gold text-xs underline underline-offset-2 cursor-pointer">
            Start a new application
          </button>
        </div>
      </div>
    )
  }

  if (isFree) {
    return <Navigate to={`/application-submitted/${appId}`} replace />
  }

  return (
    <>
      <SeoHead meta={{ title: "Payment | ORIVIS", noindex: true }} />
      <div className="w-full flex-grow flex items-center justify-center py-16 px-4 sm:px-6 bg-gradient-to-br from-brand-bg via-brand-bg-secondary to-brand-bg min-h-[calc(100vh-80px)] mt-20 relative overflow-hidden">
      {showLoading && <LoadingOverlay messages={["Processing your payment...", "Verifying transaction...", "Redirecting to confirmation..."]} />}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-[28px] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.4)] relative z-10 p-8 sm:p-10">
        <TextureBg
          src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop"
          opacity={0.12}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => navigate("/organize")}
              className="w-8 h-8 rounded-lg bg-brand-surface border border-brand-border flex items-center justify-center hover:bg-brand-surface-interactive transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} className="text-brand-text-muted" />
            </button>
            <h1 className="font-display font-bold text-xl text-brand-text-primary uppercase">
              Payment
            </h1>
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-xl p-5 mb-5">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-3">
              Payment Summary
            </h4>

            <div className="flex items-center justify-between py-2 border-b border-brand-border">
              <span className="text-xs text-brand-text-secondary">Plan</span>
              <span className="text-xs font-semibold text-brand-text-primary">{tier.name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-brand-border">
              <span className="text-xs text-brand-text-secondary">Voter limit</span>
              <span className="text-xs font-semibold text-brand-text-primary">
                {tier.maxVoters === Infinity ? "Unlimited" : tier.maxVoters.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-brand-border">
              <span className="text-xs text-brand-text-secondary">This covers</span>
              <span className="text-xs font-semibold text-brand-text-primary">1 election</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-brand-text-secondary">Total</span>
              <span className="text-sm font-bold text-brand-gold">{tier.price}</span>
            </div>
            {tier.priceNote && (
              <p className="text-[10px] text-brand-text-muted text-right mt-1">{tier.priceNote}</p>
            )}
          </div>

          {isCustom ? (
            <div className="bg-brand-surface border border-brand-border rounded-xl p-4 text-center mb-5">
              <p className="text-xs text-brand-text-muted mb-3">
                Your organization exceeds 1 million voters. Please contact our team for a custom solution.
              </p>
              <a
                href="mailto:enterprise@orivis.com"
                className="inline-block bg-brand-gold text-brand-bg-secondary text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-brand-gold-hover transition-colors"
              >
                Contact Orivis Enterprise
              </a>
            </div>
          ) : (
            <div className="bg-brand-surface border border-brand-border rounded-xl p-5 mb-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={16} className="text-brand-gold" />
                <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
                  Card Details
                </h4>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1.5 block">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text-primary placeholder-brand-text-disabled/50 outline-none focus:border-brand-gold transition-colors pr-10"
                    />
                    <Lock size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-disabled" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1.5 block">
                      Expiry
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text-primary placeholder-brand-text-disabled/50 outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1.5 block">
                      CVC
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text-primary placeholder-brand-text-disabled/50 outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-brand-text-muted mt-3 flex items-center gap-1">
                <Lock size={10} />
                Your payment is processed securely. We do not store card details.
              </p>
            </div>
          )}

          {!isCustom && (
            <motion.button
              type="button"
              onClick={handlePay}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              Pay with Paystack
              <Shield size={13} />
            </motion.button>
          )}

          <div className="mt-4 bg-brand-gold/5 border border-brand-gold/20 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle2 size={12} className="text-status-success shrink-0 mt-0.5" />
            <p className="text-[10px] text-brand-text-secondary">
              This is a simulated payment. In production, you will be redirected to Paystack's secure checkout page.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
