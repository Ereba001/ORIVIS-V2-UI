import { motion } from 'motion/react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number; className?: string }>
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-brand-surface-elevated flex items-center justify-center mb-4" style={{ color: 'var(--org-primary)' }}>
        <Icon size={28} />
      </div>
      <h3 className="text-sm font-semibold text-brand-text-primary mb-1">{title}</h3>
      <p className="text-xs text-brand-text-muted max-w-xs">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          style={{ backgroundColor: 'var(--org-primary)', color: '#FFFFFF' }}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}
