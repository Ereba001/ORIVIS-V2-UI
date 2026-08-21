import { useParams, useNavigate, Link } from "react-router-dom"
import { motion } from "motion/react"
import { AlertCircle } from "lucide-react"
import TextureBg from "../../components/TextureBg"
import SeoHead from "../../components/SeoHead"

export default function ElectionClosed() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col pt-24"
    >
      <SeoHead meta={{ title: "Voting Closed | ORIVIS", noindex: true }} />
      <div className="w-full flex-grow flex items-center justify-center relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-md mx-auto px-6 relative z-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-brand-text-disabled/10 flex items-center justify-center mx-auto">
            <AlertCircle size={32} className="text-brand-text-disabled" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold uppercase text-brand-text-primary mb-2">Voting Has Ended</h1>
            <p className="text-xs text-brand-text-muted leading-relaxed">
              This election is no longer accepting votes. Results will be published once the election period concludes.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate("/governance")} className="flex items-center gap-2 bg-brand-surface border border-brand-border hover:border-brand-gold/30 text-brand-text-primary px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
              Back
            </button>
            <Link to={`/elections/${id}/results`} className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
              View Results
            </Link>
          </div>
        </div>
      </div>
    </motion.main>
  )
}
