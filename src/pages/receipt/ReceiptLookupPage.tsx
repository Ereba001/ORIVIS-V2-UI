import { useState, useEffect, FormEvent } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { ArrowLeft, Loader2, AlertCircle, Search } from "lucide-react"
import TextureBg from "../../components/TextureBg"
import SeoHead from "../../components/SeoHead"
import ReceiptDisplay from "../../components/ReceiptDisplay"
import { publicVoterService } from "../../services/public-voter-service"
import type { PublicReceipt } from "../../types/voting-pass"

export default function ReceiptLookupPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const codeParam = searchParams.get("code") ?? ""

  const [code, setCode] = useState(codeParam)
  const [receipt, setReceipt] = useState<PublicReceipt | null>(null)
  const [loading, setLoading] = useState(false)
  const [lookedUp, setLookedUp] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (codeParam) {
      handleLookup(codeParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLookup(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    setError("")
    setLoading(true)
    setLookedUp(false)
    setReceipt(null)
    try {
      const data = await publicVoterService.getPublicReceipt(trimmed)
      setReceipt(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Receipt not found. Double-check the code from your email.")
    } finally {
      setLoading(false)
      setLookedUp(true)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    handleLookup(code)
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col pt-24"
    >
      <SeoHead meta={{ title: "Verify Receipt | ORIVIS", noindex: true }} />
      <div className="w-full bg-brand-surface py-12 border-b border-brand-border relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <button onClick={() => navigate("/governance")} className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors mb-6 cursor-pointer">
            <ArrowLeft size={14} /> Governance Centre
          </button>
          <h1 className="text-xl font-display font-bold uppercase text-brand-text-primary">Verify Your Vote Receipt</h1>
          <p className="text-xs text-brand-text-muted mt-1">Enter the receipt code from your confirmation email to view who you voted for.</p>
        </div>
      </div>

      <div className="w-full bg-brand-surface-elevated py-16 relative overflow-hidden flex-grow">
        <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <form onSubmit={onSubmit} className="bg-brand-surface border border-brand-border rounded-2xl p-6 mb-6">
            <label htmlFor="receipt-code" className="block text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-2">
              Receipt Code
            </label>
            <div className="flex gap-3">
              <input
                id="receipt-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. RCP-8F2K-7QPL"
                className="flex-1 bg-brand-surface-elevated border border-brand-border rounded-xl px-4 py-3 text-sm font-mono text-brand-text-primary placeholder:text-brand-text-disabled focus:outline-none focus:border-brand-gold/40 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-hover disabled:opacity-50 disabled:cursor-not-allowed text-brand-bg-secondary px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span>{loading ? "Checking" : "View Receipt"}</span>
              </button>
            </div>
          </form>

          {error && (
            <div className="flex items-start gap-3 bg-status-error/10 border border-status-error/20 rounded-2xl p-6 mb-6">
              <AlertCircle size={18} className="text-status-error shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-brand-text-primary">Receipt Not Found</h3>
                <p className="text-xs text-brand-text-muted mt-1">{error}</p>
              </div>
            </div>
          )}

          {receipt && (
            <ReceiptDisplay
              receipt={receipt}
              electionTitle={receipt.election?.title}
              organization={receipt.election?.organizationName ?? undefined}
              selections={receipt.selections}
              readOnly
            />
          )}

          {lookedUp && !receipt && !error && !loading && (
            <p className="text-center text-xs text-brand-text-muted">No receipt found for that code.</p>
          )}
        </div>
      </div>
    </motion.main>
  )
}
