import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom"
import { motion } from "motion/react"
import { Loader2 } from "lucide-react"
import TextureBg from "../../components/TextureBg"
import ReceiptDisplay from "../../components/ReceiptDisplay"
import { voterService } from "../../services/voter-service"
import { electionService } from "../../services/election-service"
import type { VoteReceipt } from "../../types/voting-pass"
import type { Election } from "../../types/election"
import SeoHead from "../../components/SeoHead"

export default function VoteSuccess() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const receiptUuid = searchParams.get("receipt")

  const [receipt, setReceipt] = useState<VoteReceipt | null>(null)
  const [election, setElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!receiptUuid || !id) { setLoading(false); return }
    let cancelled = false
    Promise.all([
      voterService.getReceiptByUuid(id, receiptUuid),
      electionService.getPublicElection(id),
    ]).then(([r, e]) => {
      if (!cancelled) {
        setReceipt(r)
        setElection(e)
        setLoading(false)
      }
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [receiptUuid, id])

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
      <SeoHead meta={{ title: "Vote Cast Successfully | ORIVIS", noindex: true }} />
      <div className="w-full bg-brand-surface py-16 border-b border-brand-border relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold uppercase text-brand-text-primary">Vote Cast Successfully</h1>
            <p className="text-xs text-brand-text-muted mt-2">
              Your vote has been recorded on the blockchain. Below is your receipt.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full bg-brand-surface-elevated py-16 relative overflow-hidden flex-grow">
        <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          {receipt && (
            <ReceiptDisplay
              receipt={receipt}
              electionTitle={election?.title}
              organization={election?.organizationName}
              selections={receipt.selections}
            />
          )}

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => navigate("/governance")}
              className="flex items-center gap-2 bg-brand-surface border border-brand-border hover:border-brand-gold/30 text-brand-text-primary px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Back
            </button>
            <Link
              to={`/elections/${id}/results`}
              className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              View Results
            </Link>
          </div>
        </div>
      </div>
    </motion.main>
  )
}
