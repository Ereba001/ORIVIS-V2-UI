import { motion } from "motion/react"
import { Construction, Hammer } from "lucide-react"
import SeoHead from "../SeoHead"
import Breadcrumbs from "./Breadcrumbs"

interface ComingSoonProps {
  title: string
  description?: string
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <>
      <SeoHead meta={{ title: `${title} | ORIVIS`, noindex: true }} />
      <div className="max-w-3xl space-y-6">
        <Breadcrumbs items={[{ label: title }]} />
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center border-dashed"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mb-5">
            <Construction size={26} className="text-brand-gold" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand-gold/30 bg-brand-gold/5 text-brand-gold text-[10px] font-mono font-bold uppercase tracking-wider mb-3">
            <Hammer size={11} />
            Feature Under Development
          </div>
          <h1 className="font-display font-bold text-xl uppercase tracking-tight text-brand-text-primary mb-2">
            {title}
          </h1>
          <p className="text-xs text-brand-text-muted leading-relaxed max-w-md mx-auto">
            {description ?? "This platform feature is currently under development and will be available in a future update. It is not wired to the backend yet."}
          </p>
        </motion.div>
      </div>
    </>
  )
}