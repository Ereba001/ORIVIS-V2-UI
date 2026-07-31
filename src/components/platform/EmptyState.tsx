import { type LucideIcon, Inbox } from "lucide-react"
import { motion } from "motion/react"

interface Props {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-surface-elevated flex items-center justify-center mb-4 text-brand-text-muted">
        <Icon size={28} />
      </div>
      <h3 className="text-sm font-bold text-brand-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-brand-text-muted max-w-[260px] leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-5 py-2 bg-brand-gold text-black text-[11px] font-bold uppercase tracking-wider rounded-xl hover:bg-brand-gold-hover active:bg-brand-gold-pressed transition-colors cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}
