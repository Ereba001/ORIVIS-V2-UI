import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { ArrowLeft, SearchX } from "lucide-react"
import TextureBg from "../components/TextureBg"
import SeoHead from "../components/SeoHead"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <>
      <SeoHead meta={{ title: "404 — Page Not Found | ORIVIS", noindex: true }} />
      <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col pt-24"
    >
      <div className="w-full flex-grow flex items-center justify-center relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-md mx-auto px-6 relative z-10 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-brand-surface-interactive flex items-center justify-center mx-auto">
            <SearchX size={40} className="text-brand-text-disabled" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold text-brand-text-primary mb-2">404</h1>
            <p className="text-sm text-brand-text-muted">Page not found</p>
            <p className="text-xs text-brand-text-muted mt-2">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <ArrowLeft size={14} /> Go Home
          </button>
        </div>
      </div>
    </motion.main>
    </>
  )
}
