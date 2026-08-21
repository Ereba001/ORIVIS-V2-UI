import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { motion } from "motion/react"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import TextureBg from "../../components/TextureBg"
import SeoHead from "../../components/SeoHead"
import ReceiptDisplay from "../../components/ReceiptDisplay"
import { voterService } from "../../services/voter-service"
import { electionService } from "../../services/election-service"
import type { VoteReceipt } from "../../types/voting-pass"
import type { Election } from "../../types/election"

export default function ReceiptPage() {
  const { passId: receiptUUID } = useParams<{ passId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const electionId = searchParams.get("election")

  const [receipt, setReceipt] = useState<VoteReceipt | null>(null)
  const [election, setElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!receiptUUID || !electionId) { setError("A receipt and election are required to load your receipt."); setLoading(false); return }
    Promise.all([
      voterService.getReceiptByUuid(electionId, receiptUUID),
      electionService.getPublicElection(electionId),
    ]).then(([r, e]) => {
      if (!r) {
        setError("Receipt not found.")
        setLoading(false)
        return
      }
      setReceipt(r)
      setElection(e)
      setLoading(false)
    }).catch(() => { setError("Failed to load receipt."); setLoading(false) })
  }, [receiptUUID, electionId])

  if (loading) {
    return (
      <div className="w-full flex-grow flex items-center justify-center pt-24">
        <Loader2 size={20} className="animate-spin text-brand-gold" />
      </div>
    )
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col pt-24"
    >
      <SeoHead meta={{ title: "Vote Receipt | ORIVIS", noindex: true }} />
      <div className="w-full bg-brand-surface py-12 border-b border-brand-border relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <button onClick={() => navigate("/governance")} className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors mb-6 cursor-pointer">
            <ArrowLeft size={14} /> Governance Centre
          </button>
          <h1 className="text-xl font-display font-bold uppercase text-brand-text-primary">Vote Receipt</h1>
          <p className="text-xs text-brand-text-muted mt-1">Verify your vote receipt</p>
        </div>
      </div>

      <div className="w-full bg-brand-surface-elevated py-16 relative overflow-hidden flex-grow">
        <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          {error && (
            <div className="flex items-start gap-3 bg-status-error/10 border border-status-error/20 rounded-2xl p-6">
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
              electionTitle={election?.title}
              organization={election?.organizationName}
              selections={receipt.selections}
            />
          )}
        </div>
      </div>
    </motion.main>
  )
}
